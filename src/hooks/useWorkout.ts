import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { WorkoutDay, Exercise, TrainingWeek, LoggedSet } from '../types'
import { generateId, copyWorkoutDay } from '../utils/helpers'

const DAYS_KEY = 'gymlab_days'

// ── Migración de datos legacy ──────────────────────────────────────────────────
// Si el usuario tenía datos con el formato viejo (exercise.sets[]),
// los convierte automáticamente a exercise.weeks[{ weekNumber:1, sets:[...] }]
function migrateDays(raw: unknown): WorkoutDay[] {
    if (!Array.isArray(raw)) return []
    // Helper: convierte el valor legacy (number | '') a number | null
    const toNum = (v: unknown): number | null =>
        v === '' || v === null || v === undefined ? null : Number(v)

    return (raw as WorkoutDay[]).map(day => ({
        ...day,
        exercises: (day.exercises ?? []).map(ex => {
            // Formato viejo: exercise tenía sets[] directamente
            const legacyEx = ex as unknown as Record<string, unknown> & { weeks?: TrainingWeek[] }
            const legacySets = legacyEx['sets'] as Array<Record<string, unknown>> | undefined

            if (!legacyEx.weeks && Array.isArray(legacySets)) {
                const migratedSets: LoggedSet[] = legacySets.map(s => ({
                    id: typeof s.id === 'string' ? s.id : generateId(),
                    weight: toNum(s.weight),
                    reps: toNum(s.reps),
                    rir: toNum(s.rir),
                    notes: typeof s.notes === 'string' ? s.notes : undefined,
                }))
                return {
                    id: ex.id,
                    name: ex.name,
                    muscleGroup: ex.muscleGroup,
                    notes: ex.notes,
                    weeks: migratedSets.length > 0
                        ? [{ id: generateId(), weekNumber: 1, sets: migratedSets }]
                        : [],
                } satisfies Exercise
            }
            // Asegura que weeks exista aunque esté vacío
            return { ...ex, weeks: (ex.weeks ?? []) } as Exercise
        }),
    }))
}

function loadDays(): WorkoutDay[] {
    try {
        const raw = localStorage.getItem(DAYS_KEY)
        if (!raw) return []
        return migrateDays(JSON.parse(raw))
    } catch {
        return []
    }
}

export function useWorkout() {
    const [days, setDays] = useLocalStorage<WorkoutDay[]>(DAYS_KEY, [], loadDays)

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

    const addExercise = useCallback((dayId: string, name: string, muscleGroup?: string) => {
        const newExercise: Exercise = {
            id: generateId(),
            name,
            muscleGroup,
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
        let newWeek!: TrainingWeek
        updateExerciseInDay(dayId, exerciseId, ex => {
            const nextNumber = ex.weeks.length > 0
                ? Math.max(...ex.weeks.map(w => w.weekNumber)) + 1
                : 1
            newWeek = { id: generateId(), weekNumber: nextNumber, sets: [] }
            return { ...ex, weeks: [...ex.weeks, newWeek] }
        })
        return newWeek
    }, [updateExerciseInDay])

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
        addWeek, deleteWeek, updateWeekLabel,
        addSet, updateSet, deleteSet,
    }
}
