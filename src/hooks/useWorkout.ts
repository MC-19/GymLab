import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { WorkoutDay, Exercise, WorkoutSet, WorkoutSession } from '../types'
import { generateId, copyWorkoutDay } from '../utils/helpers'

const DAYS_KEY = 'gymlab_days'
const SESSIONS_KEY = 'gymlab_sessions'

export function useWorkout() {
    const [days, setDays] = useLocalStorage<WorkoutDay[]>(DAYS_KEY, [])
    const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>(SESSIONS_KEY, [])

    // ── Days ──────────────────────────────────────────────────────────────────

    const addDay = useCallback((name: string) => {
        const newDay: WorkoutDay = {
            id: generateId(),
            name,
            exercises: [],
            createdAt: new Date().toISOString(),
            order: days.length,
        }
        setDays(prev => [...prev, newDay])
        return newDay
    }, [days.length, setDays])

    const updateDay = useCallback((dayId: string, updates: Partial<WorkoutDay>) => {
        setDays(prev => prev.map(d => d.id === dayId ? { ...d, ...updates } : d))
    }, [setDays])

    const deleteDay = useCallback((dayId: string) => {
        setDays(prev => prev.filter(d => d.id !== dayId))
    }, [setDays])

    const reorderDays = useCallback((orderedIds: string[]) => {
        setDays(prev => {
            const map = new Map(prev.map(d => [d.id, d]))
            return orderedIds.map((id, i) => ({ ...map.get(id)!, order: i }))
        })
    }, [setDays])

    const duplicateDay = useCallback((dayId: string) => {
        const day = days.find(d => d.id === dayId)
        if (!day) return
        const copy = copyWorkoutDay(day)
        setDays(prev => [...prev, copy])
        return copy
    }, [days, setDays])

    // ── Exercises ─────────────────────────────────────────────────────────────

    const addExercise = useCallback((dayId: string, name: string, muscleGroup?: string) => {
        const newExercise: Exercise = {
            id: generateId(),
            name,
            muscleGroup,
            sets: [],
        }
        setDays(prev =>
            prev.map(d =>
                d.id === dayId ? { ...d, exercises: [...d.exercises, newExercise] } : d
            )
        )
        return newExercise
    }, [setDays])

    const updateExercise = useCallback((dayId: string, exerciseId: string, updates: Partial<Exercise>) => {
        setDays(prev =>
            prev.map(d =>
                d.id === dayId
                    ? { ...d, exercises: d.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e) }
                    : d
            )
        )
    }, [setDays])

    const deleteExercise = useCallback((dayId: string, exerciseId: string) => {
        setDays(prev =>
            prev.map(d =>
                d.id === dayId
                    ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) }
                    : d
            )
        )
    }, [setDays])

    const reorderExercises = useCallback((dayId: string, orderedIds: string[]) => {
        setDays(prev =>
            prev.map(d => {
                if (d.id !== dayId) return d
                const map = new Map(d.exercises.map(e => [e.id, e]))
                return { ...d, exercises: orderedIds.map(id => map.get(id)!) }
            })
        )
    }, [setDays])

    // ── Sets ──────────────────────────────────────────────────────────────────

    const addSet = useCallback((dayId: string, exerciseId: string) => {
        const newSet: WorkoutSet = {
            id: generateId(),
            weight: '',
            reps: '',
            rir: '',
        }
        setDays(prev =>
            prev.map(d =>
                d.id === dayId
                    ? {
                        ...d,
                        exercises: d.exercises.map(e =>
                            e.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
                        ),
                    }
                    : d
            )
        )
        return newSet
    }, [setDays])

    const updateSet = useCallback(
        (dayId: string, exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
            setDays(prev =>
                prev.map(d =>
                    d.id === dayId
                        ? {
                            ...d,
                            exercises: d.exercises.map(e =>
                                e.id === exerciseId
                                    ? { ...e, sets: e.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)) }
                                    : e
                            ),
                        }
                        : d
                )
            )
        },
        [setDays]
    )

    const deleteSet = useCallback((dayId: string, exerciseId: string, setId: string) => {
        setDays(prev =>
            prev.map(d =>
                d.id === dayId
                    ? {
                        ...d,
                        exercises: d.exercises.map(e =>
                            e.id === exerciseId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
                        ),
                    }
                    : d
            )
        )
    }, [setDays])

    // ── Sessions / History ────────────────────────────────────────────────────

    const logSession = useCallback((day: WorkoutDay) => {
        const session: WorkoutSession = {
            id: generateId(),
            dayId: day.id,
            dayName: day.name,
            date: new Date().toISOString(),
            exercises: JSON.parse(JSON.stringify(day.exercises)),
        }
        setSessions(prev => [session, ...prev])
        updateDay(day.id, { lastPerformed: session.date })
        return session
    }, [setSessions, updateDay])

    return {
        days,
        sessions,
        addDay, updateDay, deleteDay, reorderDays, duplicateDay,
        addExercise, updateExercise, deleteExercise, reorderExercises,
        addSet, updateSet, deleteSet,
        logSession,
    }
}
