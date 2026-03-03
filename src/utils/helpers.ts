import type { WorkoutDay, Exercise, LoggedSet } from '../types'

export function generateId(): string {
    return crypto.randomUUID()
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
    const copy: WorkoutDay = structuredClone(day)
    copy.id = generateId()
    copy.name = `${day.name} (copia)`
    copy.createdAt = new Date().toISOString()
    copy.exercises = copy.exercises.map(e => ({
        ...e,
        id: generateId(),
        weeks: e.weeks.map(w => ({
            ...w,
            id: generateId(),
            sets: w.sets.map(s => ({ ...s, id: generateId() })),
        })),
    }))
    return copy
}

export function calcTotalVolume(sets: LoggedSet[]): number {
    return sets.reduce((sum, s) => {
        const w = s.weight ?? 0
        const r = s.reps ?? 0
        return sum + w * r
    }, 0)
}

export function getCompletedSets(sets: LoggedSet[]): number {
    return sets.filter(s => s.weight !== null && s.reps !== null).length
}

/** Fórmula Epley: estima el 1RM a partir de peso y reps */
export function calc1RM(weight: number, reps: number): number {
    if (reps <= 0) return 0
    if (reps === 1) return weight
    return Math.round(weight * (1 + reps / 30))
}

export function getMuscleGroups(): string[] {
    return [
        'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
        'Piernas', 'Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos',
        'Abdominales', 'Cardio', 'Otro',
    ]
}

export interface WeekProgress {
    weekNumber: number
    label: string
    maxWeight: number
    totalVolume: number
    totalSets: number
    estimated1RM: number
}

/**
 * Devuelve la progresión histórica de un ejercicio, lista para gráficas.
 * Ordenada por weekNumber ascendente.
 */
export function getExerciseProgress(exercise: Exercise): WeekProgress[] {
    return exercise.weeks
        .slice()
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map(week => {
            const completed = week.sets.filter(s => s.weight !== null && s.reps !== null)
            const maxWeight = completed.length > 0
                ? Math.max(...completed.map(s => s.weight!))
                : 0
            const bestSet = completed.find(s => s.weight === maxWeight)
            const volume = calcTotalVolume(completed)

            return {
                weekNumber: week.weekNumber,
                label: week.label ?? `S${week.weekNumber}`,
                maxWeight,
                totalVolume: volume,
                totalSets: completed.length,
                estimated1RM: bestSet ? calc1RM(bestSet.weight!, bestSet.reps!) : 0,
            }
        })
}
