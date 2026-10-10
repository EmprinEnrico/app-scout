// Continuous editor model: converts objective entities to stable editor blocks.
import type { Goal, ObjectiveBlock, Stage, StageLine } from './contracts'

export type ObjectiveEditorNode = {
  type: 'milestone' | 'paragraph' | 'task'
  attrs?: { id?: string | null; completed?: boolean }
  content?: Array<{ type: 'text'; text: string }>
}

export type ObjectiveEditorDocument = {
  type: 'doc'
  content: ObjectiveEditorNode[]
}

function textNode(text: string) {
  return text ? [{ type: 'text' as const, text }] : []
}

function legacyStageLines(stage: Stage, goals: Goal[]): StageLine[] {
  return goals
    .filter((goal) => goal.stageId === stage.id)
    .map((goal) => ({ id: goal.id, kind: 'task' as const, text: goal.title, goalId: goal.id }))
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
      const lines = stage.content?.length ? stage.content : legacyStageLines(stage, goals)
      lines.forEach((line) => {
        const goal = line.goalId ? goals.find((item) => item.id === line.goalId) : undefined
        content.push({
          type: line.kind === 'task' ? 'task' : 'paragraph',
          attrs: line.kind === 'task'
            ? { id: goal?.id ?? line.goalId ?? line.id, completed: goal?.completed ?? false }
            : { id: line.id },
          content: textNode(line.text),
        })
      })
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
    if (typed.type !== 'milestone' && typed.type !== 'task' && typed.type !== 'paragraph') return []
    const text = typed.content?.map((part) => part.text).join('') ?? ''
    return [{
      id: typed.attrs?.id ?? null, kind: typed.type === 'paragraph' ? 'text' : typed.type, text,
      completed: typed.type === 'task' ? typed.attrs?.completed : undefined,
    }]
  })
}

