// React context that exposes goal state, persistence, imports, and mutations.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { GoalPatch, GoalsContextValue, GoalState, NewGoal, ObjectiveBlock } from './contracts'
import { createInitialState, newId, reduceGoals, type GoalAction } from './goalState'
import {
  exportObjectiveHistory, loadGoalState, loadObjectiveVersions, recordObjectiveVersion,
  replaceGoalArchive, saveGoalState,
} from './goalsDb'
import { parseGoalState } from './validation'
import { parseObjectiveHistory } from './objectiveHistory'

const GoalsContext = createContext<GoalsContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operazione non riuscita.'
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

  const importData = useCallback(async (json: string) => {
    if (!readyRef.current) return { ok: false, message: 'Attendere il caricamento dei dati.' }
    try {
      const parsed: unknown = JSON.parse(json)
      const bundle = parsed && typeof parsed === 'object' && 'format' in parsed
        && parsed.format === 'scout-journey-backup' && 'state' in parsed
        && 'history' in parsed ? parsed : null
      const imported = parseGoalState(JSON.stringify(bundle ? bundle.state : parsed))
      const versions = bundle
        ? parseObjectiveHistory(JSON.stringify(bundle.history))
        : []
      await writes.current
      await replaceGoalArchive(imported, versions)
      stateRef.current = imported
      setState(imported)
      setError(null)
      return { ok: true, message: 'Dati importati.' }
    } catch (cause) {
      const message = errorMessage(cause)
      setError(message)
      return { ok: false, message }
    }
  }, [])

  const getObjectiveVersions = useCallback(async (areaId: string) => {
    await writes.current
    return loadObjectiveVersions(areaId)
  }, [])

  const value: GoalsContextValue = {
    state,
    ready,
    error,
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
    replaceObjective: (areaId: string, blocks: ObjectiveBlock[]) => dispatch({
      type: 'replaceObjective', areaId, blocks, now: new Date().toISOString(),
    }),
    recordObjectiveVersion: (areaId: string, reason = 'edit') => {
      if (!readyRef.current) return
      writes.current = writes.current.then(() => recordObjectiveVersion(areaId, reason)).catch(
        (cause: unknown) => setError(`Cronologia non salvata: ${errorMessage(cause)}`),
      )
    },
    getObjectiveVersions,
    selectArea: (id: string) => dispatch({ type: 'selectArea', id }),
    selectStage: (id: string) => dispatch({ type: 'selectStage', id }),
    exportData: async () => {
      if (!readyRef.current) {
        setError('Attendere il caricamento dei dati.')
        return ''
      }
      await writes.current
      return JSON.stringify({
        format: 'scout-journey-backup',
        schemaVersion: 2,
        state: stateRef.current,
        history: JSON.parse(await exportObjectiveHistory()),
      }, null, 2)
    },
    importData,
    resetData: async () => {
      if (!readyRef.current) {
        setError('Attendere il caricamento dei dati.')
        return
      }
      const fresh = createInitialState()
      try {
        await writes.current
        await replaceGoalArchive(fresh, [])
        stateRef.current = fresh
        setState(fresh)
        setError(null)
      } catch (cause) {
        setError(`Reimpostazione non riuscita: ${errorMessage(cause)}`)
      }
    },
  }

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoals(): GoalsContextValue {
  const context = useContext(GoalsContext)
  if (!context) throw new Error('useGoals deve essere usato all’interno di GoalsProvider.')
  return context
}
