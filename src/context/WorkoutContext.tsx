import { createContext, useContext, type ReactNode } from 'react'
import { useWorkout } from '../hooks/useWorkout'
import { useToast } from '../hooks/useToast'
import type { Toast } from '../hooks/useToast'
import type { WorkoutDay, Exercise, TrainingWeek, LoggedSet } from '../types'

interface WorkoutContextType {
    days: WorkoutDay[]
    toasts: Toast[]
    showToast: (message: string, type?: Toast['type']) => void
    removeToast: (id: string) => void
    // Days
    addDay: (name: string) => WorkoutDay
    updateDay: (dayId: string, updates: Partial<WorkoutDay>) => void
    deleteDay: (dayId: string) => void
    reorderDays: (orderedIds: string[]) => void
    duplicateDay: (dayId: string) => WorkoutDay | undefined
    // Exercises
    addExercise: (dayId: string, name: string, muscleGroup?: string) => Exercise
    updateExercise: (dayId: string, exerciseId: string, updates: Partial<Exercise>) => void
    deleteExercise: (dayId: string, exerciseId: string) => void
    reorderExercises: (dayId: string, orderedIds: string[]) => void
    // Weeks
    addWeek: (dayId: string, exerciseId: string) => TrainingWeek
    deleteWeek: (dayId: string, exerciseId: string, weekId: string) => void
    updateWeekLabel: (dayId: string, exerciseId: string, weekId: string, label: string) => void
    // Sets
    addSet: (dayId: string, exerciseId: string, weekId: string) => LoggedSet
    updateSet: (dayId: string, exerciseId: string, weekId: string, setId: string, updates: Partial<LoggedSet>) => void
    deleteSet: (dayId: string, exerciseId: string, weekId: string, setId: string) => void
}

const WorkoutContext = createContext<WorkoutContextType | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const workout = useWorkout()
    const { toasts, showToast, removeToast } = useToast()

    return (
        <WorkoutContext.Provider value={{ ...workout, toasts, showToast, removeToast }}>
            {children}
        </WorkoutContext.Provider>
    )
}

export function useWorkoutContext() {
    const ctx = useContext(WorkoutContext)
    if (!ctx) throw new Error('useWorkoutContext must be used within WorkoutProvider')
    return ctx
}
