import { useCallback } from 'react'
import type { Exercise, WorkoutDay } from '../types'
import { copyExercisePlan, generateId } from '../utils/helpers'
import type { SetDays, UpdateExerciseInDay } from './workoutTypes'

export function useWorkoutExercises(days: WorkoutDay[], setDays: SetDays, updateExerciseInDay: UpdateExerciseInDay) {
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

    const duplicateExercise = useCallback((dayId: string, exerciseId: string) => {
        const source = days.find(day => day.id === dayId)?.exercises.find(exercise => exercise.id === exerciseId)
        if (!source) return
        const copy = copyExercisePlan(source)
        setDays(previous => previous.map(day => day.id === dayId ? {
            ...day,
            exercises: day.exercises.flatMap(exercise => exercise.id === exerciseId ? [exercise, copy] : [exercise]),
        } : day))
    }, [days, setDays])

    const replaceExercise = useCallback((dayId: string, exerciseId: string, name: string, muscleGroup?: string, catalogId?: string) => {
        const id = generateId()
        updateExerciseInDay(dayId, exerciseId, previous => ({
            id, name, muscleGroup, catalogId, goals: previous.goals && { ...previous.goals }, weeks: [],
        }))
    }, [updateExerciseInDay])

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

    return { addExercise, updateExercise, deleteExercise, reorderExercises, duplicateExercise, replaceExercise }
}
