// Safe, explicit conversion of data from the previous Scout Journey version.

import type { Goal, GoalState, GoalsContextValue, Stage } from './contracts'
import { newId } from './goalState'

export type ImportResult = { ok: boolean; message: string }
type ConversionResult = ImportResult & { state?: GoalState }
type LegacyStorage = Pick<Storage, 'getItem'>

const KEYS = ['CapacitorStorage.database', '_cap_database', 'database'] as const
const IMPORTED_AREA = 'Obiettivi importati'

function readLegacyRaw(storage: LegacyStorage): string | null {
  for (const key of KEYS) {
    const value = storage.getItem(key)
    if (value !== null) return value
  }
  return null
}

export function legacyDataAvailable(state: GoalState, storage: LegacyStorage): boolean {
  if (state.areas.some((area) => area.name === IMPORTED_AREA)) return false
  try {
    return readLegacyRaw(storage) !== null
  } catch {
    return false
  }
}

export function convertLegacyData(
  current: GoalState,
  raw: string,
  id: () => string = newId,
  now = new Date().toISOString(),
): ConversionResult {
  if (current.areas.some((area) => area.name === IMPORTED_AREA)) {
    return { ok: false, message: 'Gli obiettivi importati sono già presenti.' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'I dati precedenti non contengono JSON valido.' }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: 'Formato dei dati precedenti non valido.' }
  }
  const entries = Object.entries(parsed)
  if (entries.length === 0 || entries.some(([key, values]) =>
    !/^(branco|reparto|clan)-\d+$/.test(key) || !Array.isArray(values)
    || values.some((value) => typeof value !== 'string'))) {
    return { ok: false, message: 'Formato dei dati precedenti non valido.' }
  }
  const groupOrder: Record<string, number> = { branco: 0, reparto: 1, clan: 2 }
  const nonEmpty = entries.map(([key, values]) => ({
    key,
    titles: (values as string[]).map((value) => value.trim()).filter(Boolean),
  })).filter((entry) => entry.titles.length > 0).sort((left, right) => {
    const [leftGroup, leftNumber] = left.key.split('-')
    const [rightGroup, rightNumber] = right.key.split('-')
    return (groupOrder[leftGroup ?? ''] ?? 0) - (groupOrder[rightGroup ?? ''] ?? 0)
      || Number(leftNumber) - Number(rightNumber)
  })
  if (nonEmpty.length === 0) return { ok: false, message: 'Nessun obiettivo da importare.' }

  const areaId = id()
  const stages: Stage[] = []
  const goals: Goal[] = []
  for (const [index, entry] of nonEmpty.entries()) {
    const stageId = id()
    stages.push({ id: stageId, areaId, name: `Fase ${index + 1}`, position: index })
    for (const title of entry.titles) {
      goals.push({
        id: id(), areaId, stageId, title, note: 'Importato dalla versione precedente',
        completed: false, createdAt: now, updatedAt: now, completedAt: null,
      })
    }
  }
  return {
    ok: true,
    message: `${goals.length} obiettivi importati.`,
    state: {
      ...current,
      areas: [...current.areas, { id: areaId, name: IMPORTED_AREA, color: '#0d9488', createdAt: now }],
      stages: [...current.stages, ...stages],
      goals: [...current.goals, ...goals],
    },
  }
}

// Invoke with the active context from Settings. The old storage is only read.
export function importLegacyData(
  context: Pick<GoalsContextValue, 'state' | 'ready' | 'importData'>,
  storage: LegacyStorage,
): ImportResult {
  if (!context.ready) return { ok: false, message: 'Attendere il caricamento dei dati.' }
  try {
    const raw = readLegacyRaw(storage)
    if (raw === null) return { ok: false, message: 'Nessun dato precedente trovato.' }
    const converted = convertLegacyData(context.state, raw)
    if (!converted.ok || !converted.state) return converted
    return context.importData(JSON.stringify(converted.state))
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Importazione non riuscita.',
    }
  }
}
