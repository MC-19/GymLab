// Core data types for GymLab

export interface WorkoutSet {
    id: string
    weight: number | ''
    reps: number | ''
    rir: number | ''
    notes?: string
    completedAt?: string
}

export interface Exercise {
    id: string
    name: string
    muscleGroup?: string
    notes?: string
    sets: WorkoutSet[]
}

export interface WorkoutDay {
    id: string
    name: string
    exercises: Exercise[]
    createdAt: string
    lastPerformed?: string
    order: number
}

export interface WorkoutSession {
    id: string
    dayId: string
    dayName: string
    date: string
    exercises: Exercise[]
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
    theme: ThemeMode
}
