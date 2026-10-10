// Continuous editor model tests: protect stable identity and block conversion.
import { describe, expect, it } from 'vitest'
import { editorDocumentToBlocks, objectiveToEditorDocument } from './objectiveEditorModel'
import type { Goal, Stage } from './contracts'

const stages: Stage[] = [{ id: 'stage-1', areaId: 'area-1', name: 'Spanish', position: 0 }]
const goals: Goal[] = [{
  id: 'task-1', areaId: 'area-1', stageId: 'stage-1', title: 'Read a page', note: '',
  completed: true, createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z', completedAt: '2026-01-02T00:00:00.000Z',
}]

describe('objective editor model', () => {
  it('round-trips milestone and task identity through editor JSON', () => {
    const document = objectiveToEditorDocument(stages, goals)
    expect(editorDocumentToBlocks(document)).toEqual([
      { id: 'stage-1', kind: 'milestone', text: 'Spanish', completed: undefined },
      { id: 'task-1', kind: 'task', text: 'Read a page', completed: true },
    ])
  })

  it('keeps inserted blocks independent from neighboring ids', () => {
    const document = objectiveToEditorDocument(stages, goals)
    document.content.splice(1, 0, {
      type: 'task', attrs: { id: 'task-new', completed: false },
      content: [{ type: 'text', text: 'Practice speaking' }],
    })
    const blocks = editorDocumentToBlocks(document)
    expect(blocks.map((block) => block.id)).toEqual(['stage-1', 'task-new', 'task-1'])
  })

  it('keeps descriptive text interleaved with tasks', () => {
    const document = objectiveToEditorDocument([{
      ...stages[0]!,
      content: [
        { id: 'text-1', kind: 'text', text: 'Build a daily habit.' },
        { id: 'task-1', kind: 'task', text: 'Read a page', goalId: 'task-1' },
        { id: 'text-2', kind: 'text', text: 'Review progress each Sunday.' },
      ],
    }], goals)
    expect(editorDocumentToBlocks(document).map((block) => [block.kind, block.text])).toEqual([
      ['milestone', 'Spanish'],
      ['text', 'Build a daily habit.'],
      ['task', 'Read a page'],
      ['text', 'Review progress each Sunday.'],
    ])
  })
})
