// Runtime validation for imported and persisted goal-state JSON data.

import type { GoalState } from './contracts'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function timestamp(value: unknown): value is string {
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  if (typeof value !== 'string' || !isoPattern.test(value)) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

function invalid(): never {
  throw new Error('Dati non validi o incompleti.')
}

export function assertGoalState(value: unknown): asserts value is GoalState {
  if (!record(value)) invalid()
  if (value.schemaVersion !== 1) throw new Error('Versione dei dati non supportata.')
  if (!Array.isArray(value.areas) || !Array.isArray(value.stages) || !Array.isArray(value.goals)) invalid()
  if (value.areas.length === 0) invalid()

  const ids = new Set<string>()
  const areaIds = new Set<string>()
  const stageAreas = new Map<string, string>()
  const positions = new Map<string, Set<number>>()
  for (const area of value.areas) {
    if (!record(area) || !nonEmpty(area.id) || !nonEmpty(area.name)
      || !nonEmpty(area.color) || !timestamp(area.createdAt)) invalid()
    if (ids.has(area.id)) invalid()
    ids.add(area.id)
    areaIds.add(area.id)
    positions.set(area.id, new Set())
  }
  for (const stage of value.stages) {
    if (!record(stage) || !nonEmpty(stage.id) || !nonEmpty(stage.areaId) || !nonEmpty(stage.name)
      || !Number.isSafeInteger(stage.position) || (stage.position as number) < 0) invalid()
    if (ids.has(stage.id) || !areaIds.has(stage.areaId)) invalid()
    if (stage.content !== undefined && (!Array.isArray(stage.content) || stage.content.some((line) =>
      !record(line) || !nonEmpty(line.id) || (line.kind !== 'text' && line.kind !== 'task')
      || typeof line.text !== 'string'
      || (line.goalId !== undefined && !nonEmpty(line.goalId))))) invalid()
    ids.add(stage.id)
    stageAreas.set(stage.id, stage.areaId)
    const areaPositions = positions.get(stage.areaId)!
    if (areaPositions.has(stage.position as number)) invalid()
    areaPositions.add(stage.position as number)
  }
  for (const areaPositions of positions.values()) {
    if (!areaPositions.size) invalid()
    for (let position = 0; position < areaPositions.size; position++) {
      if (!areaPositions.has(position)) invalid()
    }
  }
  for (const goal of value.goals) {
    if (!record(goal) || !nonEmpty(goal.id) || !nonEmpty(goal.areaId)
      || !nonEmpty(goal.stageId) || !nonEmpty(goal.title)
      || typeof goal.note !== 'string' || typeof goal.completed !== 'boolean'
      || !timestamp(goal.createdAt) || !timestamp(goal.updatedAt)
      || (goal.completedAt !== null && !timestamp(goal.completedAt))) invalid()
    if (ids.has(goal.id) || !areaIds.has(goal.areaId) || stageAreas.get(goal.stageId) !== goal.areaId) invalid()
    if (goal.completed !== (goal.completedAt !== null)) invalid()
    ids.add(goal.id)
  }
  if (!nonEmpty(value.selectedAreaId) || !nonEmpty(value.selectedStageId)
    || !areaIds.has(value.selectedAreaId)
    || stageAreas.get(value.selectedStageId) !== value.selectedAreaId) invalid()
}

export function parseGoalState(json: string): GoalState {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Il file non contiene JSON valido.')
  }
  assertGoalState(parsed)
  return parsed
}
