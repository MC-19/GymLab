import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { TrainingProgram, WorkoutDay, WorkoutState, CompletedSession } from '../types'
import { generateId } from '../utils/helpers'

const STATE_KEY = 'gymlab_state'

const DEFAULT_STATE: WorkoutState = {
    version: 2,
    currentDayIndexByProgram: {},
    sessions: [],
}

export function parseWorkoutState(raw: string | null, activeProgramId = ''): WorkoutState {
    try {
        if (!raw) return DEFAULT_STATE
        const parsed = JSON.parse(raw) as Partial<WorkoutState> & { currentDayIndex?: number }
        const legacyIndex = Number.isInteger(parsed.currentDayIndex) ? parsed.currentDayIndex! : 0
        return {
            version: 2,
            currentDayIndexByProgram: parsed.currentDayIndexByProgram
                ?? (activeProgramId ? { [activeProgramId]: legacyIndex } : {}),
            sessions: Array.isArray(parsed.sessions)
                ? parsed.sessions.map(session =>
                    activeProgramId && !session.programId
                        ? { ...session, programId: activeProgramId }
                        : session
                )
                : [],
        }
    } catch {
        return DEFAULT_STATE
    }
}

export function useRotation(activeProgram: TrainingProgram | null) {
    const activeProgramId = activeProgram?.id ?? ''
    const [state, setState] = useLocalStorage<WorkoutState>(
        STATE_KEY,
        DEFAULT_STATE,
        () => parseWorkoutState(localStorage.getItem(STATE_KEY), activeProgramId)
    )
    const currentDayIndex = activeProgramId
        ? state.currentDayIndexByProgram[activeProgramId] ?? 0
        : 0

    /**
     * Devuelve el día que toca ahora dado el array de días.
     * Si no hay días, devuelve null.
     */
    const getCurrentDay = useCallback(
        (days: WorkoutDay[]): WorkoutDay | null => {
            if (days.length === 0) return null
            const idx = currentDayIndex % days.length
            return days[idx] ?? null
        },
        [currentDayIndex]
    )

    /**
     * Completa la sesión actual:
     * - Guarda un CompletedSession en el historial
     * - Avanza currentDayIndex de forma circular
     */
    const completeSession = useCallback(
        (dayId: string, totalDays: number) => {
            const session: CompletedSession = {
                id: generateId(),
                programId: activeProgramId || undefined,
                programName: activeProgram?.name,
                dayId,
                dayName: activeProgram?.days.find(day => day.id === dayId)?.name,
                completedAt: new Date().toISOString(),
            }
            setState(prev => ({
                ...prev,
                currentDayIndexByProgram: activeProgramId ? {
                    ...prev.currentDayIndexByProgram,
                    [activeProgramId]: totalDays > 0
                        ? ((prev.currentDayIndexByProgram[activeProgramId] ?? 0) + 1) % totalDays
                        : 0,
                } : prev.currentDayIndexByProgram,
                sessions: [...prev.sessions, session],
            }))
        },
        [activeProgram, activeProgramId, setState]
    )

    /**
     * Devuelve las sesiones de los últimos N días (para el calendario visual).
     * Por defecto devuelve las de los últimos 7 días.
     */
    const getRecentSessions = useCallback(
        (days = 7): CompletedSession[] => {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - days)
            return state.sessions.filter(s =>
                (!s.programId || s.programId === activeProgramId)
                && new Date(s.completedAt) >= cutoff
            )
        },
        [activeProgramId, state.sessions]
    )

    const sessions = state.sessions.filter(s => !s.programId || s.programId === activeProgramId)

    /** Reinicia la rotación al Día 0 (no borra el historial) */
    const resetRotation = useCallback(() => {
        if (!activeProgramId) return
        setState(prev => ({
            ...prev,
            currentDayIndexByProgram: { ...prev.currentDayIndexByProgram, [activeProgramId]: 0 },
        }))
    }, [activeProgramId, setState])

    /** Establece manualmente el índice de la rotación */
    const setCurrentDayIndex = useCallback(
        (index: number) => {
            if (!activeProgramId) return
            setState(prev => ({
                ...prev,
                currentDayIndexByProgram: { ...prev.currentDayIndexByProgram, [activeProgramId]: index },
            }))
        },
        [activeProgramId, setState]
    )

    return {
        currentDayIndex,
        sessions,
        getCurrentDay,
        completeSession,
        getRecentSessions,
        resetRotation,
        setCurrentDayIndex,
    }
}
