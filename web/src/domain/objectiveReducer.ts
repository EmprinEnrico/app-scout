// Objective replacement reducer: applies one continuous editor document atomically.
import type { GoalState, ObjectiveBlock, Stage } from './contracts'
function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function freshId(used: Set<string>, preferred: string | null): string {
  let id = preferred ?? newId()
  while (used.has(id)) id = newId()
  used.add(id)
  return id
}

export function replaceObjective(
  state: GoalState,
  areaId: string,
  blocks: ObjectiveBlock[],
  now: string,
): GoalState {
  const area = state.areas.find((item) => item.id === areaId)
  if (!area) throw new Error('Obiettivo inesistente.')
  const oldStages = state.stages.filter((stage) => stage.areaId === areaId)
  const oldGoals = state.goals.filter((goal) => goal.areaId === areaId)
  const reserved = new Set<string>([...state.areas.map((item) => item.id)])
  state.stages.filter((stage) => stage.areaId !== areaId).forEach((stage) => reserved.add(stage.id))
  state.goals.filter((goal) => goal.areaId !== areaId).forEach((goal) => reserved.add(goal.id))
  const localUsed = new Set<string>(reserved)
  const stages: Stage[] = []
  const goals = [] as GoalState['goals']
  let currentStage: Stage | undefined

  blocks.forEach((block) => {
    const text = block.text.trim()
    if (!text && block.kind !== 'text') return
    if (block.kind === 'milestone') {
      const id = freshId(localUsed, block.id)
      const old = oldStages.find((stage) => stage.id === id)
      currentStage = { id, areaId, name: text, position: stages.length, content: [] }
      if (old) currentStage.position = stages.length
      stages.push(currentStage)
      return
    }
    if (!currentStage) return
    if (block.kind === 'text') {
      currentStage.content!.push({ id: freshId(localUsed, block.id), kind: 'text', text })
      return
    }
    const id = freshId(localUsed, block.id)
    const old = oldGoals.find((goal) => goal.id === id)
    const completed = block.completed ?? old?.completed ?? false
    const changed = !old || old.title !== text || old.stageId !== currentStage.id
      || old.completed !== completed
    goals.push({
      id, areaId, stageId: currentStage.id, title: text, note: old?.note ?? '',
      completed, createdAt: old?.createdAt ?? now,
      updatedAt: changed ? now : old.updatedAt,
      completedAt: completed ? old?.completedAt ?? now : null,
    })
    currentStage.content!.push({ id, kind: 'task', text, goalId: id })
  })

  if (!stages.length) {
    const id = freshId(localUsed, oldStages[0]?.id ?? null)
    stages.push({ id, areaId, name: 'Primi passi', position: 0, content: [] })
  }
  const selectedStageId = stages.some((stage) => stage.id === state.selectedStageId)
    ? state.selectedStageId
    : stages[0]!.id
  return {
    ...state,
    stages: [...state.stages.filter((stage) => stage.areaId !== areaId), ...stages],
    goals: [...state.goals.filter((goal) => goal.areaId !== areaId), ...goals],
    selectedStageId,
  }
}
