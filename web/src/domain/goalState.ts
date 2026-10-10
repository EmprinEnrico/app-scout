// Pure reducer and helpers for creating and changing the goal-tracking state.

import type { Area, Goal, GoalPatch, GoalState, NewGoal, Stage } from './contracts'

export type GoalAction =
  | { type: 'addArea'; id: string; stageId: string; name: string; createdAt: string }
  | { type: 'renameArea'; id: string; name: string }
  | { type: 'deleteArea'; id: string; replacementIds: [string, string, string, string]; createdAt: string }
  | { type: 'addStage'; id: string; areaId: string; name: string }
  | { type: 'renameStage'; id: string; name: string }
  | { type: 'deleteStage'; id: string; replacementId: string }
  | { type: 'addGoal'; id: string; input: NewGoal; now: string }
  | { type: 'updateGoal'; id: string; patch: GoalPatch; now: string }
  | { type: 'toggleGoal'; id: string; now: string }
  | { type: 'deleteGoal'; id: string }
  | { type: 'selectArea'; id: string }
  | { type: 'selectStage'; id: string }

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createInitialState(id: () => string = newId, now = new Date().toISOString()): GoalState {
  const areaId = id()
  const stageNames = ['Primi passi', 'In movimento', 'Consolidare']
  const stages = stageNames.map((name, position) => ({ id: id(), areaId, name, position }))
  return {
    schemaVersion: 1,
    areas: [{ id: areaId, name: 'Il mio percorso', color: '#6366f1', createdAt: now }],
    stages,
    goals: [],
    selectedAreaId: areaId,
    selectedStageId: stages[0]!.id,
  }
}

function name(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} non può essere vuoto.`)
  return trimmed
}

function requireArea(state: GoalState, id: string): Area {
  const area = state.areas.find((item) => item.id === id)
  if (!area) throw new Error('Area inesistente.')
  return area
}

function requireStage(state: GoalState, id: string): Stage {
  const stage = state.stages.find((item) => item.id === id)
  if (!stage) throw new Error('Fase inesistente.')
  return stage
}

function requireGoal(state: GoalState, id: string): Goal {
  const goal = state.goals.find((item) => item.id === id)
  if (!goal) throw new Error('Obiettivo inesistente.')
  return goal
}

function firstStage(state: GoalState, areaId: string): Stage {
  const stage = state.stages
    .filter((item) => item.areaId === areaId)
    .sort((left, right) => left.position - right.position)[0]
  if (!stage) throw new Error('L’area non ha fasi.')
  return stage
}

function uniqueId(state: GoalState, id: string): void {
  if ([...state.areas, ...state.stages, ...state.goals].some((item) => item.id === id)) {
    throw new Error('Identificativo già in uso.')
  }
}

export function reduceGoals(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    case 'addArea': {
      uniqueId(state, action.id)
      uniqueId(state, action.stageId)
      if (action.id === action.stageId) throw new Error('Identificativo già in uso.')
      const area: Area = {
        id: action.id,
        name: name(action.name, 'Il nome'),
        color: '#6366f1',
        createdAt: action.createdAt,
      }
      const stage = { id: action.stageId, areaId: area.id, name: 'Primi passi', position: 0 }
      return { ...state, areas: [...state.areas, area], stages: [...state.stages, stage] }
    }
    case 'renameArea':
      requireArea(state, action.id)
      return {
        ...state,
        areas: state.areas.map((area) => area.id === action.id
          ? { ...area, name: name(action.name, 'Il nome') }
          : area),
      }
    case 'deleteArea': {
      requireArea(state, action.id)
      const areas = state.areas.filter((area) => area.id !== action.id)
      const stages = state.stages.filter((stage) => stage.areaId !== action.id)
      const goals = state.goals.filter((goal) => goal.areaId !== action.id)
      if (areas.length === 0) {
        let index = 0
        const replacement = createInitialState(() => action.replacementIds[index++]!, action.createdAt)
        return replacement
      }
      const selectedAreaId = state.selectedAreaId === action.id ? areas[0]!.id : state.selectedAreaId
      const selectedStageId = state.selectedAreaId === action.id
        ? stages.find((stage) => stage.areaId === selectedAreaId)!.id
        : state.selectedStageId
      return { ...state, areas, stages, goals, selectedAreaId, selectedStageId }
    }
    case 'addStage': {
      requireArea(state, action.areaId)
      uniqueId(state, action.id)
      const position = state.stages.filter((stage) => stage.areaId === action.areaId).length
      const stage = {
        id: action.id,
        areaId: action.areaId,
        name: name(action.name, 'Il nome'),
        position,
      }
      return { ...state, stages: [...state.stages, stage] }
    }
    case 'renameStage':
      requireStage(state, action.id)
      return {
        ...state,
        stages: state.stages.map((stage) => stage.id === action.id
          ? { ...stage, name: name(action.name, 'Il nome') }
          : stage),
      }
    case 'deleteStage': {
      const target = requireStage(state, action.id)
      const remaining = state.stages.filter((stage) => stage.id !== action.id && stage.areaId === target.areaId)
      const fallback = remaining.sort((left, right) => left.position - right.position)[0]
        ?? { id: action.replacementId, areaId: target.areaId, name: 'Primi passi', position: 0 }
      if (!remaining.length) uniqueId(state, action.replacementId)
      const stages = state.stages.filter((stage) => stage.id !== action.id)
      if (!remaining.length) stages.push(fallback)
      const positions = new Map(
        stages
          .filter((stage) => stage.areaId === target.areaId)
          .sort((left, right) => left.position - right.position)
          .map((stage, position) => [stage.id, position]),
      )
      return {
        ...state,
        stages: stages.map((stage) => stage.areaId === target.areaId
          ? { ...stage, position: positions.get(stage.id)! }
          : stage),
        goals: state.goals.map((goal) => goal.stageId === action.id
          ? { ...goal, stageId: fallback.id }
          : goal),
        selectedStageId: state.selectedStageId === action.id ? fallback.id : state.selectedStageId,
      }
    }
    case 'addGoal': {
      uniqueId(state, action.id)
      requireArea(state, action.input.areaId)
      const stage = requireStage(state, action.input.stageId)
      if (stage.areaId !== action.input.areaId) throw new Error('La fase non appartiene all’area.')
      const goal: Goal = {
        id: action.id, areaId: action.input.areaId, stageId: stage.id,
        title: name(action.input.title, 'Il titolo'), note: action.input.note ?? '',
        completed: false, createdAt: action.now, updatedAt: action.now, completedAt: null,
      }
      return { ...state, goals: [...state.goals, goal] }
    }
    case 'updateGoal': {
      const existing = requireGoal(state, action.id)
      const areaId = action.patch.areaId
        ?? (action.patch.stageId ? requireStage(state, action.patch.stageId).areaId : existing.areaId)
      requireArea(state, areaId)
      const stageId = action.patch.stageId
        ?? (areaId === existing.areaId ? existing.stageId : firstStage(state, areaId).id)
      if (requireStage(state, stageId).areaId !== areaId) throw new Error('La fase non appartiene all’area.')
      const updated: Goal = {
        ...existing,
        areaId,
        stageId,
        title: action.patch.title === undefined
          ? existing.title
          : name(action.patch.title, 'Il titolo'),
        note: action.patch.note ?? existing.note,
        updatedAt: action.now,
      }
      return {
        ...state,
        goals: state.goals.map((goal) => goal.id === action.id ? updated : goal),
      }
    }
    case 'toggleGoal': {
      const existing = requireGoal(state, action.id)
      const completed = !existing.completed
      return {
        ...state,
        goals: state.goals.map((goal) => goal.id === action.id
          ? { ...goal, completed, updatedAt: action.now, completedAt: completed ? action.now : null }
          : goal),
      }
    }
    case 'deleteGoal':
      requireGoal(state, action.id)
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.id) }
    case 'selectArea': {
      requireArea(state, action.id)
      return { ...state, selectedAreaId: action.id, selectedStageId: firstStage(state, action.id).id }
    }
    case 'selectStage': {
      const stage = requireStage(state, action.id)
      return { ...state, selectedAreaId: stage.areaId, selectedStageId: stage.id }
    }
  }
}
