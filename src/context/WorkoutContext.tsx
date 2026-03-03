import { createContext, useContext, type ReactNode } from 'react'
import { useWorkout } from '../hooks/useWorkout'
import { useToast } from '../hooks/useToast'
import type { Toast } from '../hooks/useToast'
import type { WorkoutDay, Exercise, WorkoutSet, WorkoutSession } from '../types'

interface WorkoutContextType {
    days: WorkoutDay[]
    sessions: WorkoutSession[]
    toasts: Toast[]
    showToast: (message: string, type?: Toast['type']) => void
    removeToast: (id: string) => void
    addDay: (name: string) => WorkoutDay
    updateDay: (dayId: string, updates: Partial<WorkoutDay>) => void
    deleteDay: (dayId: string) => void
    reorderDays: (orderedIds: string[]) => void
    duplicateDay: (dayId: string) => WorkoutDay | undefined
    addExercise: (dayId: string, name: string, muscleGroup?: string) => Exercise
    updateExercise: (dayId: string, exerciseId: string, updates: Partial<Exercise>) => void
    deleteExercise: (dayId: string, exerciseId: string) => void
    reorderExercises: (dayId: string, orderedIds: string[]) => void
    addSet: (dayId: string, exerciseId: string) => WorkoutSet
    updateSet: (dayId: string, exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
    deleteSet: (dayId: string, exerciseId: string, setId: string) => void
    logSession: (day: WorkoutDay) => WorkoutSession
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
