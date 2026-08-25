import type { TrainingProgram, WorkoutDay } from '../types'

export const GYMLAB_STORAGE_PREFIX = 'gymlab_'

export interface GymLabBackup {
    version: 1 | 2
    days: WorkoutDay[]
    localStorage?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWorkoutDay(value: unknown): value is WorkoutDay {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string'
        || typeof value.createdAt !== 'string' || typeof value.order !== 'number'
        || !Array.isArray(value.exercises)) return false

    return value.exercises.every(exercise =>
        isRecord(exercise)
        && typeof exercise.id === 'string'
        && typeof exercise.name === 'string'
        && Array.isArray(exercise.weeks)
        && exercise.weeks.every(week =>
            isRecord(week)
            && typeof week.id === 'string'
            && typeof week.weekNumber === 'number'
            && Array.isArray(week.sets)
            && week.sets.every(set =>
                isRecord(set)
                && typeof set.id === 'string'
                && (set.weight === null || typeof set.weight === 'number')
                && (set.reps === null || typeof set.reps === 'number')
                && (set.rir === null || typeof set.rir === 'number')
            )
        )
    )
}

function isProgram(value: unknown): value is TrainingProgram {
    return isRecord(value)
        && typeof value.id === 'string'
        && typeof value.name === 'string'
        && typeof value.createdAt === 'string'
        && typeof value.isArchived === 'boolean'
        && Array.isArray(value.days)
        && value.days.every(isWorkoutDay)
}

export function parseBackup(raw: string): GymLabBackup {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !Array.isArray(parsed.days) || !parsed.days.every(isWorkoutDay)) {
        throw new Error('El archivo no contiene días de entrenamiento válidos')
    }

    if (parsed.version === 2) {
        if (!isRecord(parsed.localStorage)) throw new Error('El backup no contiene almacenamiento válido')
        const entries = Object.entries(parsed.localStorage)
        if (!entries.every(([key, value]) => key.toLowerCase().startsWith(GYMLAB_STORAGE_PREFIX) && typeof value === 'string')) {
            throw new Error('El backup contiene claves no permitidas')
        }

        const programsRaw = parsed.localStorage.gymlab_programs
        if (typeof programsRaw !== 'string') throw new Error('El backup no contiene programas')
        const programs: unknown = JSON.parse(programsRaw)
        if (!Array.isArray(programs) || !programs.every(isProgram)) {
            throw new Error('Los programas del backup no son válidos')
        }

        return { version: 2, days: parsed.days, localStorage: parsed.localStorage as Record<string, string> }
    }

    if (parsed.version !== undefined && parsed.version !== 1) {
        throw new Error('La versión del backup no es compatible')
    }
    return { version: 1, days: parsed.days }
}

export function getGymLabStorageKeys(storage: Storage): string[] {
    return Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key): key is string => key?.toLowerCase().startsWith(GYMLAB_STORAGE_PREFIX) ?? false)
}
