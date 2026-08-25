import type { Exercise, WorkoutDay } from '../types'

export type SetDays = (updater: WorkoutDay[] | ((previous: WorkoutDay[]) => WorkoutDay[])) => void
export type UpdateExerciseInDay = (dayId: string, exerciseId: string, updater: (exercise: Exercise) => Exercise) => void
