// Core data types for GymLab

export type MuscleGroup = 'Pecho' | 'Espalda' | 'Cuádriceps' | 'Femorales' | 'Glúteos' | 'Gemelos' | 'Hombros' | 'Bíceps' | 'Tríceps' | 'Antebrazos' | 'Trapecios' | 'Lumbares' | 'Aductores' | 'Abductores' | 'Abdomen' | 'Cardio' | 'Cuerpo completo'
export type Equipment = 'Barra' | 'Mancuernas' | 'Máquina' | 'Polea' | 'Peso Corporal' | 'Kettlebell' | 'Otro' | 'Cardio'

export interface CatalogExercise {
    id: string
    name: string
    muscleGroup: MuscleGroup
    equipment: Equipment
    imageUrl?: string
    gifUrl?: string
}

export type SetType = 'warmup' | 'normal' | 'dropset'

export interface LoggedSet {
    id: string
    type?: SetType          // Si es undefined, se asume 'normal' para retrocompatibilidad
    weight: number | null   // null = campo vacío
    reps: number | null
    rir: number | null
    notes?: string
}

/**
 * Una semana de entrenamiento para un ejercicio concreto.
 * weekNumber es asignado manualmente por el usuario (1, 2, 3…).
 * Si el usuario salta una semana, simplemente no crea esta entidad.
 */
export interface TrainingWeek {
    id: string
    weekNumber: number
    label?: string          // Opcional: "Descarga", "Pico", etc.
    sets: LoggedSet[]
}

export interface ExerciseGoals {
    sets: number
    minReps: number
    maxReps: number
    targetRir: number
    restSeconds: number
    incrementKg: number
}

export interface Exercise {
    isDeleted?: boolean
    id: string
    name: string
    muscleGroup?: MuscleGroup | string
    notes?: string
    catalogId?: string      // ID to link to official catalog media
    goals?: ExerciseGoals
    weeks: TrainingWeek[]   // Historial de semanas de este ejercicio
}

export interface WorkoutDay {
    isDeleted?: boolean
    replacedByDayId?: string
    id: string
    name: string
    exercises: Exercise[]
    createdAt: string
    order: number
}

/** Un bloque/programa de entrenamiento que agrupa varios días */
export interface TrainingProgram {
    isDeleted?: boolean
    id: string
    name: string
    createdAt: string
    isArchived: boolean
    days: WorkoutDay[]
}

/** Entrada de peso corporal registrada por el usuario */
export interface BodyWeightEntry {
    id: string
    date: string        // YYYY-MM-DD
    weight: number      // kg
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
    theme: ThemeMode
}

/** Registro de una sesión de entrenamiento completada */
export interface CompletedSession {
    id: string
    programId?: string      // opcional para sesiones creadas antes de la migración v2
    programName?: string    // instantánea para conservar el historial si se renombra/elimina
    dayId: string          // qué día de la rotación se entrenó
    dayName?: string        // instantánea para conservar el historial si se renombra/elimina
    completedAt: string    // ISO timestamp
}

/** Estado persistido de la rotación, independiente para cada programa. */
export interface WorkoutState {
    version: 2
    currentDayIndexByProgram: Record<string, number>
    currentDayIdByProgram?: Record<string, string>
    sessions: CompletedSession[]   // historial completo de sesiones
}
