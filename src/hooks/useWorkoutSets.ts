import { useCallback } from 'react'
import type { LoggedSet } from '../types'
import { generateId } from '../utils/helpers'
import type { UpdateExerciseInDay } from './workoutTypes'

export function useWorkoutSets(updateExerciseInDay: UpdateExerciseInDay) {
    const addSet = useCallback((dayId: string, exerciseId: string, weekId: string) => {
        const newSet: LoggedSet = { id: generateId(), weight: null, reps: null, rir: null }
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.map(week => week.id === weekId
                ? { ...week, sets: [...week.sets, newSet] }
                : week
            ),
        }))
        return newSet
    }, [updateExerciseInDay])

    const updateSet = useCallback((dayId: string, exerciseId: string, weekId: string, setId: string, updates: Partial<LoggedSet>) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.map(week => week.id === weekId
                ? { ...week, sets: week.sets.map(set => set.id === setId ? { ...set, ...updates } : set) }
                : week
            ),
        }))
    }, [updateExerciseInDay])

    const deleteSet = useCallback((dayId: string, exerciseId: string, weekId: string, setId: string) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.map(week => week.id === weekId
                ? { ...week, sets: week.sets.filter(set => set.id !== setId) }
                : week
            ),
        }))
    }, [updateExerciseInDay])

    return { addSet, updateSet, deleteSet }
}
