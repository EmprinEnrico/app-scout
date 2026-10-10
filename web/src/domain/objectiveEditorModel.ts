// Continuous editor model: converts objective entities to stable editor blocks.
import type { Goal, ObjectiveBlock, Stage } from './contracts'

export type ObjectiveEditorNode = {
  type: 'milestone' | 'task'
  attrs: { id: string; completed?: boolean }
  content?: Array<{ type: 'text'; text: string }>
}

export type ObjectiveEditorDocument = {
  type: 'doc'
  content: ObjectiveEditorNode[]
}

function textNode(text: string) {
  return text ? [{ type: 'text' as const, text }] : []
}

export function objectiveToEditorDocument(
  stages: Stage[],
  goals: Goal[],
): ObjectiveEditorDocument {
  const content: ObjectiveEditorNode[] = []
  stages
    .slice()
    .sort((left, right) => left.position - right.position)
    .forEach((stage) => {
      content.push({
        type: 'milestone', attrs: { id: stage.id }, content: textNode(stage.name),
      })
      goals
        .filter((goal) => goal.stageId === stage.id)
        .forEach((goal) => content.push({
          type: 'task', attrs: { id: goal.id, completed: goal.completed },
          content: textNode(goal.title),
        }))
    })
  return { type: 'doc', content }
}

export function editorDocumentToBlocks(document: unknown): ObjectiveBlock[] {
  if (!document || typeof document !== 'object') return []
  const content = 'content' in document && Array.isArray(document.content)
    ? document.content
    : []
  return content.flatMap((node) => {
    if (!node || typeof node !== 'object' || !('type' in node)) return []
    const typed = node as ObjectiveEditorNode
    if (typed.type !== 'milestone' && typed.type !== 'task') return []
    const text = typed.content?.map((part) => part.text).join('') ?? ''
    return [{
      id: typed.attrs?.id ?? null, kind: typed.type, text,
      completed: typed.type === 'task' ? typed.attrs?.completed : undefined,
    }]
  })
}

