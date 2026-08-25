import { useCallback } from 'react'
import type { Exercise, LoggedSet, TrainingWeek, WorkoutDay } from '../types'
import {
    copyWorkoutDay,
    createEmptyTrainingWeek,
    createTrainingWeekFromPrevious,
    generateId,
    getLatestTrainingWeek,
    shouldSuggestWeightIncrease,
} from '../utils/helpers'

export function useWorkout(
    days: WorkoutDay[],
    setDays: (updater: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])) => void
) {

    // ── Helper interno para actualizar un ejercicio dentro de un día ───────────
    const updateExerciseInDay = useCallback(
        (dayId: string, exerciseId: string, updater: (ex: Exercise) => Exercise) => {
            setDays(prev =>
                prev.map(d =>
                    d.id === dayId
                        ? { ...d, exercises: d.exercises.map(e => e.id === exerciseId ? updater(e) : e) }
                        : d
                )
            )
        },
        [setDays]
    )

    // ── Days ──────────────────────────────────────────────────────────────────

    const addDay = useCallback((name: string) => {
        let newDay!: WorkoutDay
        setDays(prev => {
            newDay = {
                id: generateId(),
                name,
                exercises: [],
                createdAt: new Date().toISOString(),
                order: prev.length,
            }
            return [...prev, newDay]
        })
        return newDay
    }, [setDays])

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
        let copy: WorkoutDay | undefined
        setDays(prev => {
            const day = prev.find(d => d.id === dayId)
            if (!day) return prev
            copy = copyWorkoutDay(day)
            return [...prev, copy]
        })
        return copy
    }, [setDays])

    // ── Exercises ─────────────────────────────────────────────────────────────

    const addExercise = useCallback((dayId: string, name: string, muscleGroup?: string, catalogId?: string) => {
        const newExercise: Exercise = {
            id: generateId(),
            name,
            muscleGroup,
            catalogId,
            weeks: [],
        }
        setDays(prev =>
            prev.map(d =>
                d.id === dayId ? { ...d, exercises: [...d.exercises, newExercise] } : d
            )
        )
        return newExercise
    }, [setDays])

    const updateExercise = useCallback((dayId: string, exerciseId: string, updates: Partial<Exercise>) => {
        updateExerciseInDay(dayId, exerciseId, ex => ({ ...ex, ...updates }))
    }, [updateExerciseInDay])

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

    // ── Weeks ─────────────────────────────────────────────────────────────────

    const addWeek = useCallback((dayId: string, exerciseId: string) => {
        const exercise = days.find(day => day.id === dayId)?.exercises.find(ex => ex.id === exerciseId)
        if (!exercise) throw new Error('Exercise not found')
        const newWeek = createEmptyTrainingWeek(exercise)

        updateExerciseInDay(dayId, exerciseId, ex => {
            return { ...ex, weeks: [...ex.weeks, newWeek] }
        })
        return newWeek
    }, [days, updateExerciseInDay])

    const deleteWeek = useCallback((dayId: string, exerciseId: string, weekId: string) => {
        updateExerciseInDay(dayId, exerciseId, ex => ({
            ...ex,
            weeks: ex.weeks.filter(w => w.id !== weekId),
        }))
    }, [updateExerciseInDay])

    const updateWeekLabel = useCallback(
        (dayId: string, exerciseId: string, weekId: string, label: string) => {
            updateExerciseInDay(dayId, exerciseId, ex => ({
                ...ex,
                weeks: ex.weeks.map(w => w.id === weekId ? { ...w, label } : w),
            }))
        },
        [updateExerciseInDay]
    )

    /**
     * Crea una nueva semana copiando los sets de la semana más reciente.
     * Devuelve la nueva semana y si se debe sugerir incremento de peso
     * (= todas las series completadas de la semana anterior tuvieron RIR ≤ 1).
     */
    const addWeekFromPrevious = useCallback(
        (dayId: string, exerciseId: string): { week: TrainingWeek; shouldSuggestIncrease: boolean } => {
            const exercise = days.find(day => day.id === dayId)?.exercises.find(ex => ex.id === exerciseId)
            if (!exercise) throw new Error('Exercise not found')

            const previousWeek = getLatestTrainingWeek(exercise)
            const newWeek = createTrainingWeekFromPrevious(exercise)
            const shouldSuggestIncrease = shouldSuggestWeightIncrease(previousWeek)

            updateExerciseInDay(dayId, exerciseId, ex => {
                return { ...ex, weeks: [...ex.weeks, newWeek] }
            })

            return { week: newWeek, shouldSuggestIncrease }
        },
        [days, updateExerciseInDay]
    )

    /**
     * Añade `increment` kg al peso de todos los sets que tengan peso definido
     * en la semana indicada. Usado tras la sugerencia de sobrecarga progresiva.
     */
    const applyWeightIncrement = useCallback(
        (dayId: string, exerciseId: string, weekId: string, increment: number) => {
            updateExerciseInDay(dayId, exerciseId, ex => ({
                ...ex,
                weeks: ex.weeks.map(w =>
                    w.id !== weekId ? w : {
                        ...w,
                        sets: w.sets.map(s =>
                            s.weight !== null
                                ? { ...s, weight: Math.round((s.weight + increment) * 100) / 100 }
                                : s
                        ),
                    }
                ),
            }))
        },
        [updateExerciseInDay]
    )

    // ── Sets ──────────────────────────────────────────────────────────────────

    const addSet = useCallback((dayId: string, exerciseId: string, weekId: string) => {
        const newSet: LoggedSet = { id: generateId(), weight: null, reps: null, rir: null }
        updateExerciseInDay(dayId, exerciseId, ex => ({
            ...ex,
            weeks: ex.weeks.map(w =>
                w.id === weekId ? { ...w, sets: [...w.sets, newSet] } : w
            ),
        }))
        return newSet
    }, [updateExerciseInDay])

    const updateSet = useCallback(
        (dayId: string, exerciseId: string, weekId: string, setId: string, updates: Partial<LoggedSet>) => {
            updateExerciseInDay(dayId, exerciseId, ex => ({
                ...ex,
                weeks: ex.weeks.map(w =>
                    w.id === weekId
                        ? { ...w, sets: w.sets.map(s => s.id === setId ? { ...s, ...updates } : s) }
                        : w
                ),
            }))
        },
        [updateExerciseInDay]
    )

    const deleteSet = useCallback(
        (dayId: string, exerciseId: string, weekId: string, setId: string) => {
            updateExerciseInDay(dayId, exerciseId, ex => ({
                ...ex,
                weeks: ex.weeks.map(w =>
                    w.id === weekId
                        ? { ...w, sets: w.sets.filter(s => s.id !== setId) }
                        : w
                ),
            }))
        },
        [updateExerciseInDay]
    )

    return {
        days,
        addDay, updateDay, deleteDay, reorderDays, duplicateDay,
        addExercise, updateExercise, deleteExercise, reorderExercises,
        addWeek, deleteWeek, updateWeekLabel, addWeekFromPrevious, applyWeightIncrement,
        addSet, updateSet, deleteSet,
    }
}
