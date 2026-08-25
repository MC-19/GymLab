import { useCallback } from 'react'
import type { TrainingWeek, WorkoutDay } from '../types'
import {
    createEmptyTrainingWeek,
    createTrainingWeekFromPrevious,
    getLatestTrainingWeek,
    shouldSuggestWeightIncrease,
} from '../utils/helpers'
import type { UpdateExerciseInDay } from './workoutTypes'

export function useWorkoutWeeks(days: WorkoutDay[], updateExerciseInDay: UpdateExerciseInDay) {
    const findExercise = useCallback((dayId: string, exerciseId: string) => {
        const exercise = days.find(day => day.id === dayId)?.exercises.find(item => item.id === exerciseId)
        if (!exercise) throw new Error('Exercise not found')
        return exercise
    }, [days])

    const addWeek = useCallback((dayId: string, exerciseId: string) => {
        const newWeek = createEmptyTrainingWeek(findExercise(dayId, exerciseId))
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: [...exercise.weeks, newWeek],
        }))
        return newWeek
    }, [findExercise, updateExerciseInDay])

    const deleteWeek = useCallback((dayId: string, exerciseId: string, weekId: string) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.filter(week => week.id !== weekId),
        }))
    }, [updateExerciseInDay])

    const updateWeekLabel = useCallback((dayId: string, exerciseId: string, weekId: string, label: string) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.map(week => week.id === weekId ? { ...week, label } : week),
        }))
    }, [updateExerciseInDay])

    const addWeekFromPrevious = useCallback((dayId: string, exerciseId: string): { week: TrainingWeek; shouldSuggestIncrease: boolean } => {
        const exercise = findExercise(dayId, exerciseId)
        const previousWeek = getLatestTrainingWeek(exercise)
        const newWeek = createTrainingWeekFromPrevious(exercise)

        updateExerciseInDay(dayId, exerciseId, currentExercise => ({
            ...currentExercise,
            weeks: [...currentExercise.weeks, newWeek],
        }))

        return {
            week: newWeek,
            shouldSuggestIncrease: shouldSuggestWeightIncrease(previousWeek),
        }
    }, [findExercise, updateExerciseInDay])

    const applyWeightIncrement = useCallback((dayId: string, exerciseId: string, weekId: string, increment: number) => {
        updateExerciseInDay(dayId, exerciseId, exercise => ({
            ...exercise,
            weeks: exercise.weeks.map(week => week.id !== weekId ? week : {
                ...week,
                sets: week.sets.map(set => set.weight !== null
                    ? { ...set, weight: Math.round((set.weight + increment) * 100) / 100 }
                    : set
                ),
            }),
        }))
    }, [updateExerciseInDay])

    return { addWeek, deleteWeek, updateWeekLabel, addWeekFromPrevious, applyWeightIncrement }
}
