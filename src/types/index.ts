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

export interface LoggedSet {
    id: string
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

export interface Exercise {
    id: string
    name: string
    muscleGroup?: MuscleGroup | string
    notes?: string
    catalogId?: string      // ID to link to official catalog media
    weeks: TrainingWeek[]   // Historial de semanas de este ejercicio
}

export interface WorkoutDay {
    id: string
    name: string
    exercises: Exercise[]
    createdAt: string
    order: number
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
    dayId: string          // qué día de la rotación se entrenó
    completedAt: string    // ISO timestamp
}

/** Estado global de la rotación (separado de las plantillas de días) */
export interface WorkoutState {
    currentDayIndex: number        // índice en days[] que toca ahora
    sessions: CompletedSession[]   // historial completo de sesiones
}
