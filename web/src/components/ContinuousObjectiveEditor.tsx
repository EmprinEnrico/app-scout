// Continuous objective editor: keeps milestones and tasks in one live document.
import { useEffect, useRef } from 'react'
import { Editor, Node } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import type { NodeViewProps } from '@tiptap/react'
import type { Goal, Stage } from '../domain/contracts'
import {
  editorDocumentToBlocks,
  objectiveToEditorDocument,
} from '../domain/objectiveEditorModel'
import '../Hierarchy.css'

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function blockNode(name: 'milestone' | 'paragraph' | 'task') {
  return Node.create({
    name,
    group: 'block',
    content: 'inline*',
    defining: true,
    addAttributes() {
      return {
        id: { default: null },
        completed: { default: false },
      }
    },
    parseHTML() {
      return [{ tag: `div[data-objective-block="${name}"]` }]
    },
    renderHTML({ HTMLAttributes }) {
      const visibleAttributes = { ...HTMLAttributes }
      delete visibleAttributes.id
      delete visibleAttributes.completed
      return [
        'div',
        { ...visibleAttributes, class: `continuous-${name}`, 'data-objective-block': name },
        0,
      ]
    },
    addInputRules() { return [] },
  })
}

function paragraphNode() {
  return blockNode('paragraph')
}

function handleEditorKeyDown(editor: Editor, event: KeyboardEvent): boolean {
  const { state } = editor
  const { selection } = state
  const parent = selection.$from.parent
  const name = parent.type.name
  if (name !== 'milestone' && name !== 'paragraph' && name !== 'task') return false
  if (event.key === ' ') {
    if (!selection.empty || !['milestone', 'paragraph'].includes(name)) return false
    const marker = parent.textContent
    const targetName = marker === '#' ? 'milestone' : marker === '-' ? 'task' : null
    if (!targetName) return false
    const position = selection.$from.before()
    const target = state.schema.nodes[targetName]!.create({ id: null, completed: false })
    const transaction = state.tr.replaceWith(position, position + parent.nodeSize, target)
    transaction.setSelection(TextSelection.create(transaction.doc, position + 1))
    editor.view.dispatch(transaction)
    return true
  }
  if (event.key === 'Backspace' && name === 'task' && !parent.textContent && selection.empty) {
    return editor.commands.setNode('paragraph')
  }
  if (event.key !== 'Enter' || !selection.empty) return false
  event.preventDefault()
  const position = selection.$from.before()
  const offset = selection.$from.parentOffset
  const before = parent.textContent.slice(0, offset)
  const after = parent.textContent.slice(offset)
  const currentType = state.schema.nodes[name]!
  if (name === 'milestone') {
    const first = currentType.create(parent.attrs, before ? state.schema.text(before) : null)
    const paragraph = state.schema.nodes.paragraph!.create({ id: null }, after ? state.schema.text(after) : null)
    const transaction = state.tr.replaceWith(position, position + parent.nodeSize, [first, paragraph])
    transaction.setSelection(TextSelection.create(transaction.doc, position + first.nodeSize + 1))
    editor.view.dispatch(transaction)
    return true
  }
  const nextType = name === 'task' && !before.trim() ? state.schema.nodes.paragraph! : currentType
  if (name === 'task' && !before.trim() && !after.trim()) {
    const paragraph = nextType.create({ id: null })
    const transaction = state.tr.replaceWith(position, position + parent.nodeSize, paragraph)
    transaction.setSelection(TextSelection.create(transaction.doc, position + 1))
    editor.view.dispatch(transaction)
    return true
  }
  const first = currentType.create(parent.attrs, before ? state.schema.text(before) : null)
  const second = nextType.create({ id: null, completed: false }, after ? state.schema.text(after) : null)
  const transaction = state.tr.replaceWith(position, position + parent.nodeSize, [first, second])
  transaction.setSelection(TextSelection.create(transaction.doc, position + first.nodeSize + 1))
  editor.view.dispatch(transaction)
  return true
}

function removeEmptyTasks(editor: Editor) {
  const positions: Array<{ from: number; to: number }> = []
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'task' && !node.textContent.trim()) {
      positions.push({ from: position, to: position + node.nodeSize })
    }
  })
  if (!positions.length) return
  const transaction = editor.state.tr
  positions.reverse().forEach(({ from, to }) => transaction.delete(from, to))
  if (transaction.doc.content.size) editor.view.dispatch(transaction)
}

function TaskNodeView({ node, editor, getPos }: NodeViewProps) {
  const completed = Boolean(node.attrs.completed)
  return (
    <NodeViewWrapper
      className="continuous-task"
      data-objective-block="task"
      data-completed={completed ? 'true' : 'false'}
    >
      <button
        className="continuous-task-checkbox"
        type="button"
        contentEditable={false}
        aria-label={completed ? 'Segna task come non completata' : 'Segna task come completata'}
        aria-pressed={completed}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          const position = typeof getPos === 'function' ? getPos() : undefined
          if (position === undefined) return
          editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, {
            ...node.attrs,
            completed: !completed,
          }))
        }}
      >
        {completed ? '✓' : ''}
      </button>
      <NodeViewContent className="continuous-task-text" />
    </NodeViewWrapper>
  )
}

function taskNode() {
  return blockNode('task').extend({
    addNodeView() {
      return ReactNodeViewRenderer(TaskNodeView)
    },
  })
}

export function ContinuousObjectiveEditor({
  stages,
  goals,
  onChange,
}: {
  stages: Stage[]
  goals: Goal[]
  onChange: (blocks: ReturnType<typeof editorDocumentToBlocks>) => void
}) {
  const onChangeRef = useRef(onChange)
  const editorRef = useRef<Editor | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingBlocks = useRef<ReturnType<typeof editorDocumentToBlocks> | null>(null)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Text,
      paragraphNode(),
      blockNode('milestone'),
      taskNode(),
    ],
    content: objectiveToEditorDocument(stages, goals),
    onCreate: ({ editor: created }) => {
      editorRef.current = created
    },
    onUpdate: ({ editor: changed }) => {
      pendingBlocks.current = editorDocumentToBlocks(changed.getJSON())
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        if (pendingBlocks.current) onChangeRef.current(pendingBlocks.current)
        pendingBlocks.current = null
        saveTimer.current = null
      }, 250)
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        const current = editorRef.current
        return current ? handleEditorKeyDown(current, event) : false
      },
      handleDOMEvents: {
        blur: () => {
          const current = editorRef.current
          if (current) removeEmptyTasks(current)
          return false
        },
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const ensureIds = () => {
      const seen = new Set<string>()
      const duplicatePositions = new Set<number>()
      editor.state.doc.descendants((node, position) => {
        if (node.type.name !== 'milestone' && node.type.name !== 'task') return
        const id = typeof node.attrs.id === 'string' ? node.attrs.id : ''
        if (id && !seen.has(id)) {
          seen.add(id)
          return
        }
        duplicatePositions.add(position)
      })
      if (!duplicatePositions.size) return
      const transaction = editor.state.tr
      editor.state.doc.descendants((node, position) => {
        if (node.type.name !== 'milestone' && node.type.name !== 'task') return
        if (duplicatePositions.has(position)) {
          transaction.setNodeMarkup(position, undefined, { ...node.attrs, id: newId() })
        }
      })
      editor.view.dispatch(transaction)
    }
    ensureIds()
  }, [editor])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (pendingBlocks.current) onChangeRef.current(pendingBlocks.current)
  }, [])

  function startNewMilestone() {
    if (!editor) return
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: 'milestone', attrs: { id: null, completed: false }, content: [],
    })
    editor.commands.focus('end')
  }

  return (
    <>
      <EditorContent className="continuous-objective-editor" editor={editor} />
      <button
        className="continuous-editor-hint"
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={startNewMilestone}
      >
        Nuovo testo… · <code>#</code> milestone · <code>-</code> task
      </button>
    </>
  )
}
