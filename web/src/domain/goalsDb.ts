import Dexie, { type Table } from 'dexie'
import type { GoalState } from './contracts'
import { assertGoalState } from './validation'

type Snapshot = { key: string; state: GoalState }

class GoalsDatabase extends Dexie {
  snapshots!: Table<Snapshot, string>

  constructor() {
    super('generic-goals')
    this.version(1).stores({ snapshots: '&key' })
  }
}

const db = new GoalsDatabase()
const CURRENT = 'current'

export async function loadGoalState(initial: GoalState): Promise<GoalState> {
  const snapshot = await db.snapshots.get(CURRENT)
  if (snapshot) {
    assertGoalState(snapshot.state)
    return snapshot.state
  }
  await db.snapshots.put({ key: CURRENT, state: initial })
  return initial
}

export async function saveGoalState(state: GoalState): Promise<void> {
  await db.snapshots.put({ key: CURRENT, state })
}
