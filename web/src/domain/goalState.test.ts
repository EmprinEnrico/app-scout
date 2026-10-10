// Focused regression tests for goal-state creation and reducer transitions.

import { describe, expect, it } from 'vitest'
import { createInitialState, reduceGoals } from './goalState'
import { parseGoalState } from './validation'

const now = '2026-10-09T00:00:00.000Z'
const later = '2026-10-10T00:00:00.000Z'

function initial() {
  let number = 0
  return createInitialState(() => `id-${++number}`, now)
}

describe('goal state', () => {
  it('starts with one empty area and three ordered stages', () => {
    const state = initial()
    expect(state.areas.map((area) => area.name)).toEqual(['Il mio percorso'])
    expect(state.stages.map((stage) => stage.name)).toEqual(['Primi passi', 'In movimento', 'Consolidare'])
    expect(state.goals).toEqual([])
    expect(parseGoalState(JSON.stringify(state))).toEqual(state)
  })

  it('creates and updates goals, enforcing matching area and stage', () => {
    const base = initial()
    const areaId = base.selectedAreaId
    const stageId = base.selectedStageId
    const withGoal = reduceGoals(base, {
      type: 'addGoal',
      id: 'goal',
      input: { areaId, stageId, title: '  Read  ', note: 'memo' },
      now,
    })
    expect(withGoal.goals[0]?.title).toBe('Read')
    const completed = reduceGoals(withGoal, { type: 'toggleGoal', id: 'goal', now: later })
    expect(completed.goals[0]?.completedAt).toBe(later)
    const moved = reduceGoals(completed, {
      type: 'updateGoal',
      id: 'goal',
      patch: { stageId: base.stages[1]!.id },
      now: later,
    })
    expect(moved.goals[0]?.stageId).toBe(base.stages[1]!.id)
    const reopened = reduceGoals(moved, { type: 'toggleGoal', id: 'goal', now: later })
    expect(reopened.goals[0]?.completedAt).toBeNull()
    expect(() => reduceGoals(base, {
      type: 'addGoal', id: 'bad', input: { areaId, stageId: 'missing', title: 'X' }, now,
    })).toThrow()
    expect(() => reduceGoals(base, {
      type: 'addGoal', id: 'bad', input: { areaId, stageId, title: '  ' }, now,
    })).toThrow()
  })

  it('reassigns goals when a stage is deleted and cascades when an area is deleted', () => {
    const base = initial()
    const withGoal = reduceGoals(base, {
      type: 'addGoal',
      id: 'goal',
      input: { areaId: base.selectedAreaId, stageId: base.selectedStageId, title: 'Keep me' },
      now,
    })
    const withoutStage = reduceGoals(withGoal, {
      type: 'deleteStage',
      id: base.selectedStageId,
      replacementId: 'replacement',
    })
    expect(withoutStage.goals[0]?.stageId).toBe(withoutStage.selectedStageId)
    expect(parseGoalState(JSON.stringify(withoutStage))).toEqual(withoutStage)
    const extra = reduceGoals(withoutStage, {
      type: 'addArea', id: 'extra', stageId: 'extra-stage', name: 'Other', createdAt: now,
    })
    const withoutArea = reduceGoals(extra, {
      type: 'deleteArea',
      id: base.selectedAreaId,
      replacementIds: ['a', 'b', 'c', 'd'],
      createdAt: later,
    })
    expect(withoutArea.goals).toEqual([])
    expect(withoutArea.selectedAreaId).toBe('extra')
    expect(parseGoalState(JSON.stringify(withoutArea))).toEqual(withoutArea)
  })

  it('keeps a usable default after deleting the only area or final stage', () => {
    const base = initial()
    const soleStage = { ...base, stages: [base.stages[0]!] }
    const replaced = reduceGoals(soleStage, {
      type: 'deleteStage',
      id: soleStage.selectedStageId,
      replacementId: 'new-stage',
    })
    expect(replaced.selectedStageId).toBe('new-stage')
    expect(parseGoalState(JSON.stringify(replaced))).toEqual(replaced)
    const reset = reduceGoals(base, {
      type: 'deleteArea',
      id: base.selectedAreaId,
      replacementIds: ['a', 'b', 'c', 'd'],
      createdAt: later,
    })
    expect(reset.goals).toEqual([])
    expect(reset.stages).toHaveLength(3)
    expect(parseGoalState(JSON.stringify(reset))).toEqual(reset)
  })

  it('rejects malformed, orphaned and unsupported imports', () => {
    const state = initial()
    expect(() => parseGoalState('{')).toThrow('JSON')
    expect(() => parseGoalState(JSON.stringify({ ...state, schemaVersion: 2 }))).toThrow('Versione')
    expect(() => parseGoalState(JSON.stringify({ ...state, goals: [{
      id: 'orphan', areaId: state.selectedAreaId, stageId: 'missing', title: 'X', note: '',
      completed: false, createdAt: now, updatedAt: now, completedAt: null,
    }] }))).toThrow()
    expect(() => parseGoalState(JSON.stringify({
      ...state,
      stages: [...state.stages, { ...state.stages[0], id: 'duplicate' }],
    }))).toThrow()
  })
})
