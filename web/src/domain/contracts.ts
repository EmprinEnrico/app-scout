// Domain contracts shared by the goal state, persistence, and UI layers.

export type Area = {
  id: string
  name: string
  color: string
  createdAt: string
}

export type Stage = {
  id: string
  areaId: string
  name: string
  position: number
  content?: StageLine[]
}

export type StageLine = {
  id: string
  kind: 'text' | 'task'
  text: string
  goalId?: string
}

export type Goal = {
  id: string
  areaId: string
  stageId: string
  title: string
  note: string
  completed: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type GoalState = {
  schemaVersion: 1
  areas: Area[]
  stages: Stage[]
  goals: Goal[]
  selectedAreaId: string
  selectedStageId: string
}

export type NewGoal = Pick<Goal, 'title' | 'areaId' | 'stageId'> & { note?: string }

export type ObjectiveBlock = {
  id: string | null
  kind: 'milestone' | 'text' | 'task'
  text: string
  completed?: boolean
}

export type GoalPatch = Partial<Pick<Goal, 'title' | 'note' | 'areaId' | 'stageId'>>

export type GoalsContextValue = {
  state: GoalState
  ready: boolean
  error: string | null
  addArea(name: string): void
  renameArea(id: string, name: string): void
  deleteArea(id: string): void
  addStage(areaId: string, name: string): string
  renameStage(id: string, name: string): void
  deleteStage(id: string): void
  addGoal(input: NewGoal): void
  updateGoal(id: string, patch: GoalPatch): void
  toggleGoal(id: string): void
  deleteGoal(id: string): void
  replaceObjective(areaId: string, blocks: ObjectiveBlock[]): void
  selectArea(id: string): void
  selectStage(id: string): void
  exportData(): string
  importData(json: string): { ok: boolean; message: string }
  resetData(): void
}
