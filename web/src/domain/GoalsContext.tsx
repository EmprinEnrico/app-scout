// React context that exposes goal state, persistence, imports, and mutations.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { GoalPatch, GoalsContextValue, GoalState, NewGoal } from './contracts'
import { createInitialState, newId, reduceGoals, type GoalAction } from './goalState'
import { loadGoalState, saveGoalState } from './goalsDb'
import { importLegacyData as runLegacyImport, legacyDataAvailable as hasLegacyData } from './legacyMigration'
import { parseGoalState } from './validation'

const GoalsContext = createContext<GoalsContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operazione non riuscita.'
}

function legacyStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GoalState>(createInitialState)
  const stateRef = useRef(state)
  const [ready, setReady] = useState(false)
  const readyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const writes = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let active = true
    void loadGoalState(stateRef.current).then((loaded) => {
      if (!active) return
      stateRef.current = loaded
      setState(loaded)
      readyRef.current = true
      setReady(true)
    }).catch((cause: unknown) => {
      if (active) setError(`Caricamento non riuscito: ${errorMessage(cause)}`)
    })
    return () => { active = false }
  }, [])

  const commit = useCallback((next: GoalState) => {
    stateRef.current = next
    setState(next)
    setError(null)
    // Full snapshots and a serial queue make consecutive synchronous edits durable in order.
    writes.current = writes.current.then(() => saveGoalState(next)).catch(
      (cause: unknown) => setError(`Salvataggio non riuscito: ${errorMessage(cause)}`),
    )
  }, [])

  const dispatch = useCallback((action: GoalAction) => {
    if (!readyRef.current) {
      setError('Attendere il caricamento dei dati.')
      return
    }
    try {
      commit(reduceGoals(stateRef.current, action))
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }, [commit])

  const importData = useCallback((json: string) => {
    if (!readyRef.current) return { ok: false, message: 'Attendere il caricamento dei dati.' }
    try {
      const imported = parseGoalState(json)
      commit(imported)
      return { ok: true, message: 'Dati importati.' }
    } catch (cause) {
      const message = errorMessage(cause)
      setError(message)
      return { ok: false, message }
    }
  }, [commit])

  const storage = legacyStorage()
  const available = ready && storage !== null && hasLegacyData(state, storage)
  const value: GoalsContextValue = {
    state,
    ready,
    error,
    legacyDataAvailable: available,
    addArea: (name: string) => dispatch({
      type: 'addArea', id: newId(), stageId: newId(), name,
      createdAt: new Date().toISOString(),
    }),
    renameArea: (id: string, name: string) => dispatch({ type: 'renameArea', id, name }),
    deleteArea: (id: string) => dispatch({
      type: 'deleteArea', id,
      replacementIds: [newId(), newId(), newId(), newId()],
      createdAt: new Date().toISOString(),
    }),
    addStage: (areaId: string, name: string) => {
      const id = newId()
      dispatch({ type: 'addStage', id, areaId, name })
      return id
    },
    renameStage: (id: string, name: string) => dispatch({ type: 'renameStage', id, name }),
    deleteStage: (id: string) => dispatch({ type: 'deleteStage', id, replacementId: newId() }),
    addGoal: (input: NewGoal) => dispatch({
      type: 'addGoal', id: newId(), input, now: new Date().toISOString(),
    }),
    updateGoal: (id: string, patch: GoalPatch) => dispatch({
      type: 'updateGoal', id, patch, now: new Date().toISOString(),
    }),
    toggleGoal: (id: string) => dispatch({ type: 'toggleGoal', id, now: new Date().toISOString() }),
    deleteGoal: (id: string) => dispatch({ type: 'deleteGoal', id }),
    selectArea: (id: string) => dispatch({ type: 'selectArea', id }),
    selectStage: (id: string) => dispatch({ type: 'selectStage', id }),
    exportData: () => {
      if (!readyRef.current) {
        setError('Attendere il caricamento dei dati.')
        return ''
      }
      return JSON.stringify(stateRef.current, null, 2)
    },
    importData,
    importLegacyData: () => storage
      ? runLegacyImport({ state: stateRef.current, ready: readyRef.current, importData }, storage)
      : { ok: false, message: 'Archivio precedente non accessibile.' },
    resetData: () => {
      if (!readyRef.current) {
        setError('Attendere il caricamento dei dati.')
        return
      }
      commit(createInitialState())
    },
  }

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoals(): GoalsContextValue {
  const context = useContext(GoalsContext)
  if (!context) throw new Error('useGoals deve essere usato all’interno di GoalsProvider.')
  return context
}
