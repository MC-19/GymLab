import type { BodyWeightEntry, CompletedSession, LoggedSet, TrainingProgram, WorkoutDay, WorkoutState } from '../types'

export const GYMLAB_STORAGE_PREFIX = 'gymlab_'

export interface GymLabBackup {
    version: 1 | 2
    days: WorkoutDay[]
    localStorage?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalBoolean(value: unknown): boolean {
    return value === undefined || typeof value === 'boolean'
}

function optionalString(value: unknown): boolean {
    return value === undefined || typeof value === 'string'
}

function isLoggedSet(value: unknown): value is LoggedSet {
    return isRecord(value)
        && typeof value.id === 'string' && optionalString(value.notes)
        && (value.type === undefined || value.type === 'warmup' || value.type === 'normal' || value.type === 'dropset')
        && ['weight', 'reps', 'rir'].every(key => value[key] === null || Number.isFinite(value[key]))
}

export function isWorkoutDay(value: unknown): value is WorkoutDay {
    if (!isRecord(value) || !optionalBoolean(value.isDeleted) || typeof value.id !== 'string' || typeof value.name !== 'string'
        || typeof value.createdAt !== 'string' || !Number.isFinite(value.order)
        || !Array.isArray(value.exercises)) return false

    return value.exercises.every(exercise =>
        isRecord(exercise) && typeof exercise.id === 'string' && typeof exercise.name === 'string'
        && optionalBoolean(exercise.isDeleted)
        && ['notes', 'muscleGroup', 'catalogId'].every(key => optionalString(exercise[key]))
        && Array.isArray(exercise.weeks)
        && exercise.weeks.every(week =>
            isRecord(week) && typeof week.id === 'string' && Number.isInteger(week.weekNumber)
            && optionalString(week.label) && Array.isArray(week.sets) && week.sets.every(isLoggedSet)
        )
    )
}

/** The original format put sets directly on each exercise and used empty strings. */
export function migrateLegacyDays(value: unknown): WorkoutDay[] {
    if (!Array.isArray(value)) throw new Error('Rutinas guardadas inválidas')
    const migrated: unknown[] = value.map(day => {
        if (!isRecord(day) || !Array.isArray(day.exercises)) return day
        return {
            ...day,
            exercises: day.exercises.map(exercise => {
                if (!isRecord(exercise) || exercise.weeks !== undefined || !Array.isArray(exercise.sets)) return exercise
                const { sets, ...rest } = exercise
                return {
                    ...rest,
                    weeks: sets.length ? [{
                        id: `legacy-week-${exercise.id}`,
                        weekNumber: 1,
                        sets: sets.map((set: unknown) => {
                            if (!isRecord(set)) return set
                            const normalize = (field: unknown) => field === '' || field === undefined ? null : field
                            return { ...set, weight: normalize(set.weight), reps: normalize(set.reps), rir: normalize(set.rir) }
                        }),
                    }] : [],
                }
            }),
        }
    })
    if (!migrated.every(isWorkoutDay)) throw new Error('El archivo no contiene días de entrenamiento válidos')
    return migrated
}

export function migrateLegacySessions(value: unknown): CompletedSession[] {
    if (!Array.isArray(value)) throw new Error('Historial antiguo inválido')
    return value.map(session => {
        if (!isRecord(session) || typeof session.id !== 'string' || typeof session.dayId !== 'string'
            || typeof session.date !== 'string' || !Number.isFinite(Date.parse(session.date))
            || !optionalString(session.dayName)) throw new Error('Historial antiguo inválido')
        // Keep the original snapshot alongside the existing rotation fields.
        return { ...session, id: session.id, dayId: session.dayId, completedAt: session.date }
    })
}

export function isProgram(value: unknown): value is TrainingProgram {
    return isRecord(value)
        && typeof value.id === 'string'
        && typeof value.name === 'string'
        && typeof value.createdAt === 'string'
        && typeof value.isArchived === 'boolean'
        && optionalBoolean(value.isDeleted)
        && Array.isArray(value.days)
        && value.days.every(isWorkoutDay)
}

export function parseBackup(raw: string): GymLabBackup {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) throw new Error('El archivo no contiene días de entrenamiento válidos')
    const days = migrateLegacyDays(parsed.days)

    if (parsed.version === 2) {
        if (!isRecord(parsed.localStorage)) throw new Error('El backup no contiene almacenamiento válido')
        const entries = Object.entries(parsed.localStorage)
        if (!entries.every(([key, value]) => key.toLowerCase().startsWith(GYMLAB_STORAGE_PREFIX) && typeof value === 'string')) {
            throw new Error('El backup contiene claves no permitidas')
        }

        const storage = parsed.localStorage as Record<string, string>
        const validate = (key: string, check: (value: unknown) => boolean, label: string) => {
            if (storage[key] !== undefined && !check(JSON.parse(storage[key]))) {
                throw new Error(`Los datos de ${label} del backup no son válidos`)
            }
        }
        validate('gymlab_programs', value => Array.isArray(value) && value.every(isProgram), 'programas')
        if (storage.gymlab_days !== undefined) migrateLegacyDays(JSON.parse(storage.gymlab_days))
        if (storage.gymlab_sessions !== undefined) migrateLegacySessions(JSON.parse(storage.gymlab_sessions))
        if (storage.gymlab_theme !== undefined && !['light', 'dark', 'system'].some(theme =>
            storage.gymlab_theme === theme || storage.gymlab_theme === JSON.stringify(theme)
        )) throw new Error('Los datos de tema del backup no son válidos')
        validate('gymlab_state', isWorkoutState, 'rotación')
        validate('gymlab_bodyweight', value => Array.isArray(value) && value.every(isBodyWeightEntry), 'peso corporal')
        validate('gymlab_default_rest', value => typeof value === 'number' && Number.isFinite(value) && value > 0, 'descanso')
        if (storage.gymlab_programs === undefined && storage.gymlab_days === undefined) {
            if (!days.length) throw new Error('El backup no contiene programas ni rutinas')
            return { version: 2, days, localStorage: { ...storage, gymlab_days: JSON.stringify(days) } }
        }
        return { version: 2, days, localStorage: storage }
    }

    if (parsed.version !== undefined && parsed.version !== 1) {
        throw new Error('La versión del backup no es compatible')
    }
    return { version: 1, days }
}

export function getGymLabStorageKeys(storage: Storage): string[] {
    return Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key): key is string => key?.toLowerCase().startsWith(GYMLAB_STORAGE_PREFIX) ?? false)
}

type StoredWorkoutState = Partial<Omit<WorkoutState, 'version'>> & { currentDayIndex?: number }

export function isWorkoutState(value: unknown): value is StoredWorkoutState {
    if (!isRecord(value) || (value.version !== undefined && value.version !== 1 && value.version !== 2)) return false
    const optionalMap = (map: unknown, valid: (entry: unknown) => boolean) =>
        map === undefined || (isRecord(map) && Object.values(map).every(valid))
    const index = (entry: unknown) => Number.isInteger(entry)
    return (value.currentDayIndex === undefined || index(value.currentDayIndex))
        && optionalMap(value.currentDayIndexByProgram, index)
        && optionalMap(value.currentDayIdByProgram, entry => typeof entry === 'string')
        && (value.sessions === undefined || (Array.isArray(value.sessions) && value.sessions.every(session =>
            isRecord(session) && typeof session.id === 'string' && typeof session.dayId === 'string'
            && typeof session.completedAt === 'string' && Number.isFinite(Date.parse(session.completedAt))
            && ['programId', 'programName', 'dayName'].every(key => session[key] === undefined || typeof session[key] === 'string')
        )))
}

export function isBodyWeightEntry(value: unknown): value is BodyWeightEntry {
    return isRecord(value) && typeof value.id === 'string'
        && typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
        && typeof value.weight === 'number' && Number.isFinite(value.weight)
}

export function readGymLabStorage(storage: Storage): Record<string, string> {
    return Object.fromEntries(getGymLabStorageKeys(storage).map(key => [key, storage.getItem(key) ?? '']))
}

export function backupToStorage(backup: GymLabBackup, id: string, createdAt: string): Record<string, string> {
    if (backup.version === 2) return backup.localStorage ?? {}
    const program: TrainingProgram = { id, name: 'Backup Importado', createdAt, isArchived: false, days: backup.days }
    return { gymlab_programs: JSON.stringify([program]), gymlab_active_program_id: JSON.stringify(id) }
}

export function replaceGymLabStorage(storage: Storage, replacement: Record<string, string>): void {
    const previous = readGymLabStorage(storage)
    const changed = Object.keys(replacement).filter(key => replacement[key] !== previous[key])
    const obsolete = Object.keys(previous).filter(key => !Object.hasOwn(replacement, key))
    const removed: string[] = []
    const written: string[] = []
    try {
        for (const key of obsolete) {
            storage.removeItem(key)
            removed.push(key)
        }
        for (const key of changed.sort((a, b) =>
            (replacement[a].length - (previous[a]?.length ?? 0)) - (replacement[b].length - (previous[b]?.length ?? 0)))) {
            storage.setItem(key, replacement[key])
            written.push(key)
        }
    } catch (error) {
        try {
            // Undo increases before restoring old values so we can fit near quota.
            for (const key of written.reverse()) {
                if (Object.hasOwn(previous, key)) storage.setItem(key, previous[key])
                else storage.removeItem(key)
            }
            for (const key of removed) storage.setItem(key, previous[key])
        } catch {
            throw new Error('El almacenamiento no permitió recuperar todos los datos. Usa la copia previa.')
        }
        throw error
    }
}
