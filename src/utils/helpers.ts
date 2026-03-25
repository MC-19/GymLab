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



export function getMonday(dateString: string): Date {
    const d = new Date(dateString)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export function calculateWeeklyStreak(sessions: { completedAt: string }[]): number {
    if (sessions.length === 0) return 0

    const mondays = new Set<number>()
    for (const s of sessions) {
        mondays.add(getMonday(s.completedAt).getTime())
    }

    const sortedMondays = Array.from(mondays).sort((a, b) => b - a)
    if (sortedMondays.length === 0) return 0

    const thisMonday = getMonday(new Date().toISOString()).getTime()
    const msInWeek = 7 * 24 * 60 * 60 * 1000

    // Si no ha entrenado ni esta semana ni la pasada, perdió la racha
    if (sortedMondays[0] < thisMonday - msInWeek) {
        return 0
    }

    let streak = 0
    let currentMondayToCheck = thisMonday

    let index = 0
    if (sortedMondays[0] === thisMonday) {
        streak = 1
        index = 1
        currentMondayToCheck = thisMonday - msInWeek
    } else if (sortedMondays[0] === thisMonday - msInWeek) {
        // Entrenó la semana pasada pero aún no esta, la racha sigue viva
        streak = 1
        index = 1
        currentMondayToCheck = thisMonday - 2 * msInWeek
    }

    for (let i = index; i < sortedMondays.length; i++) {
        // Tolerancia de +- 2 horas por cambios de DST si fuera necesario, 
        // pero setHours(0,0,0,0) con hora local ya suele cuadrar al usar ms exactos del mismo huso
        // Para evitar bugs sutiles de DST, calculamos la diferencia en días en vez de ms exactos
        const diffMs = currentMondayToCheck - sortedMondays[i]
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

        if (diffDays === 0) {
            streak++
            currentMondayToCheck -= msInWeek
        } else {
            break
        }
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
            const maxWeight = completed.length > 0
                ? Math.max(...completed.map(s => s.weight!))
                : 0
            const bestSet = completed.find(s => s.weight === maxWeight)
            const volume = calcTotalVolume(completed)

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
                totalSets: completed.length,
                estimated1RM: bestSet ? calc1RM(bestSet.weight!, bestSet.reps!) : 0,
                isPR
            }
        })
}
