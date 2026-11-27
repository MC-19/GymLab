import { useCallback, useEffect, useState } from 'react'
import { trainingRepository } from '../features/training/repository'
import { assertCurrentStorageGeneration } from '../services/storageGeneration'
import { reportStorageError } from '../services/storageErrors'
import type { TrainingProgram, WorkoutDay, WorkoutState, CompletedSession } from '../types'
import { sessionDates } from '../utils/dates'
import { getActiveDays, loadPrograms } from './usePrograms'
import { isWorkoutState, migrateLegacySessions } from '../utils/backup'

const STATE_KEY = 'gymlab_state'

const DEFAULT_STATE: WorkoutState = {
    version: 2,
    currentDayIndexByProgram: {},
    sessions: [],
}

export function parseWorkoutState(raw: string | null, activeProgramId = ''): WorkoutState {
    if (raw === null) return { ...DEFAULT_STATE }
    const parsed: unknown = JSON.parse(raw)
    if (!isWorkoutState(parsed)) throw new Error('Rotación guardada inválida')
    return {
        version: 2,
        currentDayIndexByProgram: parsed.currentDayIndexByProgram
            ?? (activeProgramId ? { [activeProgramId]: parsed.currentDayIndex ?? 0 } : {}),
        ...(parsed.currentDayIdByProgram && { currentDayIdByProgram: parsed.currentDayIdByProgram }),
        // Resolve unassigned sessions by their original day where possible in the UI.
        sessions: parsed.sessions ?? [],
    }
}

export function getRotationIndex(state: WorkoutState, programId: string, days: WorkoutDay[]): number {
    if (days.length === 0) return 0
    const dayIds = state.currentDayIdByProgram ?? {}
    const dayId = Object.hasOwn(dayIds, programId) ? dayIds[programId] : undefined
    if (dayId) return Math.max(0, days.findIndex(day => day.id === dayId))
    const index = Object.hasOwn(state.currentDayIndexByProgram, programId) ? state.currentDayIndexByProgram[programId] : 0
    return Math.max(0, index) % days.length
}

export function pointRotationAt(state: WorkoutState, programId: string, days: WorkoutDay[], index: number): WorkoutState {
    const validIndex = days[index] ? index : 0
    const day = days[validIndex]
    const dayIds = day ? { ...state.currentDayIdByProgram, [programId]: day.id } : { ...state.currentDayIdByProgram }
    if (!day) delete dayIds[programId]
    return {
        ...state,
        currentDayIdByProgram: dayIds,
        currentDayIndexByProgram: { ...state.currentDayIndexByProgram, [programId]: validIndex },
    }
}

export function removeDayFromRotation(state: WorkoutState, programId: string, days: WorkoutDay[], dayId: string): WorkoutState {
    const current = getRotationIndex(state, programId, days)
    const remaining = days.filter(day => day.id !== dayId)
    const currentId = days[current]?.id === dayId ? days[(current + 1) % days.length]?.id : days[current]?.id
    return pointRotationAt(state, programId, remaining, remaining.findIndex(day => day.id === currentId))
}

export function replaceRotationDay(
    state: WorkoutState, programId: string, days: WorkoutDay[], dayId: string, replacement: WorkoutDay,
): WorkoutState {
    const index = getRotationIndex(state, programId, days)
    if (days[index]?.id !== dayId) return state
    return pointRotationAt(state, programId, days.map(day => day.id === dayId ? replacement : day), index)
}

export function advanceRotation(state: WorkoutState, programId: string, days: WorkoutDay[], session: CompletedSession): WorkoutState {
    const index = days.findIndex(day => day.id === session.dayId)
    if (index < 0) return state
    return {
        ...pointRotationAt(state, programId, days, (index + 1) % days.length),
        sessions: [...state.sessions, session],
    }
}

/** Persist the rotation change and its receipt together, after IndexedDB commits. */
export function reconcileTrainingCompletions(
    state: WorkoutState, programs: TrainingProgram[], completed: CompletedSession[],
): WorkoutState {
    const applied = new Set(state.sessions.map(session => session.id))
    return completed.reduce((current, session) => {
        if (applied.has(session.id)) return current
        applied.add(session.id)
        const program = programs.find(item => item.id === session.programId && !item.isDeleted)
        const days = program ? getActiveDays(program) : []
        if (program && days.some(day => day.id === session.dayId)) {
            return advanceRotation(current, program.id, days, session)
        }
        // Keep the calendar entry when a routine was removed while training.
        return { ...current, sessions: [...current.sessions, session] }
    }, state)
}

export function readRotation(storage: Pick<Storage, 'getItem'>, activeProgramId: string, programs: TrainingProgram[]): WorkoutState {
    const initial = parseWorkoutState(storage.getItem(STATE_KEY), activeProgramId)
    return programs.reduce((current, program) => {
        const programDays = getActiveDays(program)
        const savedIds = current.currentDayIdByProgram ?? {}
        if (Object.hasOwn(savedIds, program.id)) {
            let id = savedIds[program.id]
            const visited = new Set<string>()
            // The plan can commit before the separate rotation write. Follow the stored replacement.
            while (!visited.has(id)) {
                visited.add(id)
                const successor = program.days.find(day => day.id === id && day.isDeleted)?.replacedByDayId
                if (!successor) break
                id = successor
            }
            const index = programDays.findIndex(day => day.id === id)
            return index >= 0 && id !== savedIds[program.id] ? pointRotationAt(current, program.id, programDays, index) : current
        }
        return pointRotationAt(current, program.id, programDays, getRotationIndex(current, program.id, programDays))
    }, initial)
}

export function writeRotation(
    storage: Storage, activeProgramId: string, programs: TrainingProgram[],
    change: (current: WorkoutState) => WorkoutState,
): void {
    assertCurrentStorageGeneration(storage)
    const current = readRotation(storage, activeProgramId, programs)
    const serialized = JSON.stringify(change(current))
    if (storage.getItem(STATE_KEY) !== serialized) storage.setItem(STATE_KEY, serialized)
}

export function useRotation(activeProgram: TrainingProgram | null, programs: TrainingProgram[], days: WorkoutDay[]) {
    const activeProgramId = activeProgram?.id ?? ''
    const [legacySessions] = useState(() => {
        const raw = localStorage.getItem('gymlab_sessions')
        return raw === null ? [] : migrateLegacySessions(JSON.parse(raw))
    })
    const [state, setState] = useState(() => readRotation(localStorage, activeProgramId, programs))

    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.storageArea !== localStorage || event.key !== STATE_KEY) return
            setState(readRotation(localStorage, activeProgramId, programs))
        }
        window.addEventListener('storage', sync)
        return () => window.removeEventListener('storage', sync)
    }, [activeProgramId, programs])

    const update = useCallback(async (change: (current: WorkoutState) => WorkoutState) => {
        const write = () => writeRotation(localStorage, activeProgramId, programs, change)
        if (typeof indexedDB === 'undefined') write()
        else await trainingRepository.coordinateRotation(write)
        // Another tab may have committed a newer rotation before this callback resumed.
        setState(readRotation(localStorage, activeProgramId, programs))
    }, [activeProgramId, programs])

    // Keep legacy snapshots in their original key instead of spending quota on a second copy.
    const known = new Set(state.sessions.map(session => session.id))
    const allSessions = [...legacySessions.filter(session => !known.has(session.id)), ...state.sessions]
    const currentDayIndex = getRotationIndex(state, activeProgramId, days)

    const getCurrentDay = useCallback(
        (routine: WorkoutDay[]) => routine[currentDayIndex] ?? null,
        [currentDayIndex]
    )

    const recordTrainingCompletions = useCallback((completed: CompletedSession[]) =>
        update(current => reconcileTrainingCompletions(current, loadPrograms(localStorage), completed)),
    [update])

    const sessions = allSessions.filter(session =>
        session.programId === activeProgramId
        || (!session.programId && activeProgram?.days.some(day => day.id === session.dayId))
    )

    const getRecentSessions = (count = 7) => sessionDates(sessions, 'recent', new Date(), count)

    const setCurrentDayIndex = useCallback((index: number) => {
        if (activeProgramId) void update(prev => pointRotationAt(prev, activeProgramId, days, index)).catch(reportStorageError)
    }, [activeProgramId, days, update])

    return {
        currentDayIndex,
        sessions,
        allSessions,
        getCurrentDay,
        recordTrainingCompletions,
        getRecentSessions,
        resetRotation: () => setCurrentDayIndex(0),
        setCurrentDayIndex,
        removeDay: (dayId: string) => {
            if (activeProgramId) void update(prev => removeDayFromRotation(prev, activeProgramId, days, dayId)).catch(reportStorageError)
        },
        replaceDay: (id: string, replacement: WorkoutDay) => {
            if (activeProgramId) void update(prev => replaceRotationDay(prev, activeProgramId, days, id, replacement)).catch(reportStorageError)
        },
        // Anchor the current ID before a structural edit, including newly created programs.
        anchorRotation: () => {
            if (activeProgramId && days.length > 0 && !state.currentDayIdByProgram?.[activeProgramId]) {
                setCurrentDayIndex(currentDayIndex)
            }
        },
    }
}
