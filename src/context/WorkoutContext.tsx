import { createContext, useContext, type ReactNode } from 'react'
import { useWorkout } from '../hooks/useWorkout'
import { useRotation } from '../hooks/useRotation'
import { useToast } from '../hooks/useToast'
import type { Toast } from '../hooks/useToast'
import type { WorkoutDay, Exercise, TrainingWeek, LoggedSet, CompletedSession } from '../types'

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
    addExercise: (dayId: string, name: string, muscleGroup?: string, catalogId?: string) => Exercise
    updateExercise: (dayId: string, exerciseId: string, updates: Partial<Exercise>) => void
    deleteExercise: (dayId: string, exerciseId: string) => void
    reorderExercises: (dayId: string, orderedIds: string[]) => void
    // Weeks
    addWeek: (dayId: string, exerciseId: string) => TrainingWeek
    deleteWeek: (dayId: string, exerciseId: string, weekId: string) => void
    updateWeekLabel: (dayId: string, exerciseId: string, weekId: string, label: string) => void
    addWeekFromPrevious: (dayId: string, exerciseId: string) => { week: TrainingWeek; shouldSuggestIncrease: boolean }
    applyWeightIncrement: (dayId: string, exerciseId: string, weekId: string, increment: number) => void
    // Sets
    addSet: (dayId: string, exerciseId: string, weekId: string) => LoggedSet
    updateSet: (dayId: string, exerciseId: string, weekId: string, setId: string, updates: Partial<LoggedSet>) => void
    deleteSet: (dayId: string, exerciseId: string, weekId: string, setId: string) => void
    // Rotation
    currentDayIndex: number
    sessions: CompletedSession[]
    getCurrentDay: (days: WorkoutDay[]) => WorkoutDay | null
    completeSession: (dayId: string, totalDays: number) => void
    getRecentSessions: (days?: number) => CompletedSession[]
    resetRotation: () => void
    setCurrentDayIndex: (index: number) => void
}

const WorkoutContext = createContext<WorkoutContextType | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const workout = useWorkout()
    const rotation = useRotation()
    const { toasts, showToast, removeToast } = useToast()

    return (
        <WorkoutContext.Provider value={{ ...workout, ...rotation, toasts, showToast, removeToast }}>
            {children}
        </WorkoutContext.Provider>
    )
}

export function useWorkoutContext() {
    const ctx = useContext(WorkoutContext)
    if (!ctx) throw new Error('useWorkoutContext must be used within WorkoutProvider')
    return ctx
}
