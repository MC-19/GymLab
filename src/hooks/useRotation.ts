import { useCallback, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { TrainingProgram, WorkoutDay, WorkoutState, CompletedSession } from '../types'
import { generateId } from '../utils/helpers'
import { sessionDates } from '../utils/dates'
import { getActiveDays } from './usePrograms'
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

export function advanceRotation(state: WorkoutState, programId: string, days: WorkoutDay[], session: CompletedSession): WorkoutState {
    const index = days.findIndex(day => day.id === session.dayId)
    if (index < 0) return state
    return {
        ...pointRotationAt(state, programId, days, (index + 1) % days.length),
        sessions: [...state.sessions, session],
    }
}

export function useRotation(activeProgram: TrainingProgram | null, programs: TrainingProgram[], days: WorkoutDay[]) {
    const activeProgramId = activeProgram?.id ?? ''
    const [legacySessions] = useState(() => {
        const raw = localStorage.getItem('gymlab_sessions')
        return raw === null ? [] : migrateLegacySessions(JSON.parse(raw))
    })
    const [state, setState] = useLocalStorage<WorkoutState>(STATE_KEY, DEFAULT_STATE, () => {
        const initial = parseWorkoutState(localStorage.getItem(STATE_KEY), activeProgramId)
        return programs.reduce((current, program) => {
            const programDays = getActiveDays(program)
            return pointRotationAt(current, program.id, programDays, getRotationIndex(current, program.id, programDays))
        }, initial)
    })
    // Keep legacy snapshots in their original key instead of spending quota on a second copy.
    const known = new Set(state.sessions.map(session => session.id))
    const allSessions = [...legacySessions.filter(session => !known.has(session.id)), ...state.sessions]
    const currentDayIndex = getRotationIndex(state, activeProgramId, days)

    const getCurrentDay = useCallback(
        (routine: WorkoutDay[]) => routine[currentDayIndex] ?? null,
        [currentDayIndex]
    )

    const completeSession = useCallback((dayId: string) => {
        if (!activeProgram) return
        const session: CompletedSession = {
            id: generateId(),
            programId: activeProgram.id,
            programName: activeProgram.name,
            dayId,
            dayName: days.find(day => day.id === dayId)?.name,
            completedAt: new Date().toISOString(),
        }
        setState(prev => advanceRotation(prev, activeProgram.id, days, session))
    }, [activeProgram, days, setState])

    const sessions = allSessions.filter(session =>
        session.programId === activeProgramId
        || (!session.programId && activeProgram?.days.some(day => day.id === session.dayId))
    )

    const getRecentSessions = (count = 7) => sessionDates(sessions, 'recent', new Date(), count)

    const setCurrentDayIndex = useCallback((index: number) => {
        if (activeProgramId) setState(prev => pointRotationAt(prev, activeProgramId, days, index))
    }, [activeProgramId, days, setState])

    return {
        currentDayIndex,
        sessions,
        allSessions,
        getCurrentDay,
        completeSession,
        getRecentSessions,
        resetRotation: () => setCurrentDayIndex(0),
        setCurrentDayIndex,
        removeDay: (dayId: string) => {
            if (activeProgramId) setState(prev => removeDayFromRotation(prev, activeProgramId, days, dayId))
        },
        // Anchor the current ID before a structural edit, including newly created programs.
        anchorRotation: () => {
            if (activeProgramId && days.length > 0 && !state.currentDayIdByProgram?.[activeProgramId]) {
                setCurrentDayIndex(currentDayIndex)
            }
        },
    }
}
