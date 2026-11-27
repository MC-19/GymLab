import { useCallback } from 'react'
import type { WorkoutDay } from '../types'
import { useWorkoutDays } from './useWorkoutDays'
import { useWorkoutExercises } from './useWorkoutExercises'
import { useWorkoutSets } from './useWorkoutSets'
import { useWorkoutWeeks } from './useWorkoutWeeks'
import type { SetDays, UpdateExerciseInDay } from './workoutTypes'

export function useWorkout(days: WorkoutDay[], setDays: SetDays) {
    const updateExerciseInDay = useCallback<UpdateExerciseInDay>(
        (dayId, exerciseId, updater) => {
            setDays(previous => previous.map(day =>
                day.id === dayId
                    ? { ...day, exercises: day.exercises.map(exercise => exercise.id === exerciseId ? updater(exercise) : exercise) }
                    : day
            ))
        },
        [setDays]
    )

    const dayOperations = useWorkoutDays(days, setDays)
    const exerciseOperations = useWorkoutExercises(days, setDays, updateExerciseInDay)
    const weekOperations = useWorkoutWeeks(days, updateExerciseInDay)
    const setOperations = useWorkoutSets(updateExerciseInDay)

    return {
        days,
        ...dayOperations,
        ...exerciseOperations,
        ...weekOperations,
        ...setOperations,
    }
}
