import { localMonday, shiftLocalDay } from './dates'
import type { Exercise, LoggedSet, TrainingWeek, WorkoutDay } from '../types'

export function generateId(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

    // Mobile browsers on plain HTTP can provide random bytes without randomUUID.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}

export function findExercise(days: WorkoutDay[], dayId: string | undefined, exerciseId: string | undefined): Exercise | undefined {
    return days.find(day => day.id === dayId)?.exercises.find(exercise => exercise.id === exerciseId)
}

export function findTrainingWeek(
    days: WorkoutDay[],
    dayId: string | undefined,
    exerciseId: string | undefined,
    weekId: string | undefined,
): TrainingWeek | undefined {
    return findExercise(days, dayId, exerciseId)?.weeks.find(week => week.id === weekId)
}

export function getLatestTrainingWeek(exercise: Exercise): TrainingWeek | undefined {
    return [...exercise.weeks].sort((a, b) => b.weekNumber - a.weekNumber)[0]
}

export function createEmptyTrainingWeek(exercise: Exercise): TrainingWeek {
    const latestWeek = getLatestTrainingWeek(exercise)
    return {
        id: generateId(),
        weekNumber: latestWeek ? latestWeek.weekNumber + 1 : 1,
        sets: [],
    }
}

export function shouldSuggestWeightIncrease(week: TrainingWeek | undefined): boolean {
    const effective = week?.sets.filter(set => set.type !== 'warmup' && set.type !== 'dropset') ?? []
    if (!effective.length) return false

    return effective.every(set =>
        set.weight !== null && Number.isFinite(set.weight) && set.weight > 0
        && set.reps !== null && Number.isInteger(set.reps) && set.reps > 0
        && set.rir !== null && Number.isFinite(set.rir) && set.rir >= 2 && set.rir <= 10
    )
}

/** Only advance prepared working sets, without touching anything already logged. */
export function incrementPreparedWeek(week: TrainingWeek, increment: number): TrainingWeek {
    if (!Number.isFinite(increment) || increment <= 0
        || week.sets.some(set => set.reps !== null || set.rir !== null || !!set.notes)) return week
    return {
        ...week,
        sets: week.sets.map(set => {
            if (set.type === 'warmup' || set.type === 'dropset' || set.weight === null
                || !Number.isFinite(set.weight) || set.weight <= 0) return set
            const nextWeight = Math.round((set.weight + increment) * 100) / 100
            return Number.isFinite(nextWeight) ? { ...set, weight: nextWeight } : set
        }),
    }
}

export function createTrainingWeekFromPrevious(exercise: Exercise): TrainingWeek {
    const latestWeek = getLatestTrainingWeek(exercise)
    const emptyWeek = createEmptyTrainingWeek(exercise)

    return {
        ...emptyWeek,
        sets: latestWeek?.sets.map(set => ({
            id: generateId(),
            type: set.type,
            weight: set.weight,
            reps: null,
            rir: null,
        })) ?? [],
    }
}

export function formatDate(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function getRelativeDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    return formatDate(iso)
}

export function copyWorkoutDay(day: WorkoutDay): WorkoutDay {
    return {
        id: generateId(),
        name: day.name,
        order: day.order,
        createdAt: new Date().toISOString(),
        exercises: day.exercises.filter(exercise => !exercise.isDeleted).map(exercise => {
            const latest = getLatestTrainingWeek(exercise)
            return {
                ...exercise,
                id: generateId(),
                weeks: latest?.sets.length ? [{
                    id: generateId(),
                    weekNumber: 1,
                    sets: latest.sets.map(set => ({
                        id: generateId(), type: set.type, weight: null, reps: null, rir: null,
                    })),
                }] : [],
            }
        }),
    }
}

export function calcTotalVolume(sets: LoggedSet[]): number {
    return sets.reduce((sum, s) => {
        // Ignorar series de calentamiento para el volumen total histórico
        if (s.type === 'warmup') return sum
        const w = s.weight ?? 0
        const r = s.reps ?? 0
        return sum + w * r
    }, 0)
}

export function getCompletedSets(sets: LoggedSet[]): number {
    return sets.filter(s => s.weight !== null && s.reps !== null).length
}

/** Epley is an estimate for working sets of 1–10 reps, most useful near failure. */
export function calc1RM(weight: number, reps: number): number {
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 10) return 0
    if (reps === 1) return weight
    const estimate = Math.round(weight * (1 + reps / 30))
    return Number.isFinite(estimate) ? estimate : 0
}

export function getEstimated1RM(sets: LoggedSet[]): number {
    return sets.reduce((best, set) => set.type === 'warmup'
        ? best : Math.max(best, calc1RM(set.weight ?? 0, set.reps ?? 0)), 0)
}

export function calculateWeeklyStreak(sessions: { completedAt: string }[], now = new Date()): number {
    const mondays = new Set(sessions.flatMap(session => {
        const date = new Date(session.completedAt)
        return date <= now ? [localMonday(date).getTime()] : []
    }))
    let monday = localMonday(now)
    if (!mondays.has(monday.getTime())) monday = shiftLocalDay(monday, -7)
    let streak = 0
    while (mondays.has(monday.getTime())) {
        streak++
        monday = shiftLocalDay(monday, -7)
    }
    return streak
}

export interface WeekProgress {
    weekNumber: number
    label: string
    maxWeight: number
    totalVolume: number
    totalSets: number
    estimated1RM: number
    isPR?: boolean
}

/**
 * Devuelve la progresión histórica de un ejercicio, lista para gráficas.
 * Ordenada por weekNumber ascendente.
 */
export function getExerciseProgress(exercise: Exercise): WeekProgress[] {
    let allTimeMax = 0

    return exercise.weeks
        .slice()
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map(week => {
            const completed = week.sets.filter(s => s.weight !== null && s.reps !== null)
            const effectiveCompleted = completed.filter(s => s.type !== 'warmup')

            // Usamos solo series efectivas para buscar el peso máximo
            const maxWeight = effectiveCompleted.length > 0
                ? Math.max(...effectiveCompleted.map(s => s.weight!))
                : 0
            const volume = calcTotalVolume(completed) // ya filtra warmups internamente

            let isPR = false
            if (maxWeight > 0 && maxWeight > allTimeMax) {
                // Solo es PR si ya teníamos un récord anterior mayor que 0
                isPR = allTimeMax > 0
                allTimeMax = maxWeight
            }

            return {
                weekNumber: week.weekNumber,
                label: week.label ?? `S${week.weekNumber}`,
                maxWeight,
                totalVolume: volume,
                totalSets: effectiveCompleted.length, // Mostrar # de series efectivas
                estimated1RM: getEstimated1RM(week.sets),
                isPR
            }
        })
}
