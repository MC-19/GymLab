import { useCallback } from 'react'
import type { Exercise } from '../types'
import { generateId } from '../utils/helpers'
import type { SetDays, UpdateExerciseInDay } from './workoutTypes'

export function useWorkoutExercises(setDays: SetDays, updateExerciseInDay: UpdateExerciseInDay) {
    const addExercise = useCallback((dayId: string, name: string, muscleGroup?: string, catalogId?: string) => {
        const newExercise: Exercise = {
            id: generateId(),
            name,
            muscleGroup,
            catalogId,
            weeks: [],
        }
        setDays(previous => previous.map(day =>
            day.id === dayId ? { ...day, exercises: [...day.exercises, newExercise] } : day
        ))
        return newExercise
    }, [setDays])

    const updateExercise = useCallback((dayId: string, exerciseId: string, updates: Partial<Exercise>) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({ ...exercise, ...updates }))
    }, [updateExerciseInDay])

    const deleteExercise = useCallback((dayId: string, exerciseId: string) => {
        setDays(previous => previous.map(day =>
            day.id === dayId
                ? { ...day, exercises: day.exercises.filter(exercise => exercise.id !== exerciseId) }
                : day
        ))
    }, [setDays])

    const reorderExercises = useCallback((dayId: string, orderedIds: string[]) => {
        setDays(previous => previous.map(day => {
            if (day.id !== dayId) return day
            const exercisesById = new Map(day.exercises.map(exercise => [exercise.id, exercise]))
            const ids = [...new Set([...orderedIds, ...exercisesById.keys()])]
            return { ...day, exercises: ids.flatMap(id => {
                const exercise = exercisesById.get(id)
                return exercise ? [exercise] : []
            }) }
        }))
    }, [setDays])

    return { addExercise, updateExercise, deleteExercise, reorderExercises }
}
