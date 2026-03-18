import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { WorkoutDay, WorkoutState, CompletedSession } from '../types'
import { generateId } from '../utils/helpers'

const STATE_KEY = 'gymlab_state'

const DEFAULT_STATE: WorkoutState = {
    currentDayIndex: 0,
    sessions: [],
}

function loadState(): WorkoutState {
    try {
        const raw = localStorage.getItem(STATE_KEY)
        if (!raw) return DEFAULT_STATE
        const parsed = JSON.parse(raw) as Partial<WorkoutState>
        return {
            currentDayIndex: parsed.currentDayIndex ?? 0,
            sessions: parsed.sessions ?? [],
        }
    } catch {
        return DEFAULT_STATE
    }
}

export function useRotation() {
    const [state, setState] = useLocalStorage<WorkoutState>(STATE_KEY, DEFAULT_STATE, loadState)

    /**
     * Devuelve el día que toca ahora dado el array de días.
     * Si no hay días, devuelve null.
     */
    const getCurrentDay = useCallback(
        (days: WorkoutDay[]): WorkoutDay | null => {
            if (days.length === 0) return null
            const idx = state.currentDayIndex % days.length
            return days[idx] ?? null
        },
        [state.currentDayIndex]
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
                dayId,
                completedAt: new Date().toISOString(),
            }
            setState(prev => ({
                currentDayIndex: totalDays > 0
                    ? (prev.currentDayIndex + 1) % totalDays
                    : 0,
                sessions: [...prev.sessions, session],
            }))
        },
        [setState]
    )

    /**
     * Devuelve las sesiones de los últimos N días (para el calendario visual).
     * Por defecto devuelve las de los últimos 7 días.
     */
    const getRecentSessions = useCallback(
        (days = 7): CompletedSession[] => {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - days)
            return state.sessions.filter(s => new Date(s.completedAt) >= cutoff)
        },
        [state.sessions]
    )

    /** Reinicia la rotación al Día 0 (no borra el historial) */
    const resetRotation = useCallback(() => {
        setState(prev => ({ ...prev, currentDayIndex: 0 }))
    }, [setState])

    /** Establece manualmente el índice de la rotación */
    const setCurrentDayIndex = useCallback(
        (index: number) => {
            setState(prev => ({ ...prev, currentDayIndex: index }))
        },
        [setState]
    )

    return {
        currentDayIndex: state.currentDayIndex,
        sessions: state.sessions,
        getCurrentDay,
        completeSession,
        getRecentSessions,
        resetRotation,
        setCurrentDayIndex,
    }
}
