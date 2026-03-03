import type { WorkoutDay, WorkoutSet } from '../types'

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
    const copy: WorkoutDay = JSON.parse(JSON.stringify(day))
    copy.id = generateId()
    copy.name = `${day.name} (copia)`
    copy.createdAt = new Date().toISOString()
    copy.lastPerformed = undefined
    copy.exercises = copy.exercises.map(e => ({
        ...e,
        id: generateId(),
        sets: e.sets.map(s => ({ ...s, id: generateId(), weight: s.weight, reps: s.reps, rir: s.rir })),
    }))
    return copy
}

export function calcTotalVolume(sets: WorkoutSet[]): number {
    return sets.reduce((sum, s) => {
        const w = Number(s.weight) || 0
        const r = Number(s.reps) || 0
        return sum + w * r
    }, 0)
}

export function getCompletedSets(sets: WorkoutSet[]): number {
    return sets.filter(s => s.weight !== '' && s.reps !== '').length
}

export function getMuscleGroups(): string[] {
    return [
        'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
        'Piernas', 'Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos',
        'Abdominales', 'Cardio', 'Otro',
    ]
}

export function groupSessionsByWeek<T extends { date: string }>(sessions: T[]): Record<string, T[]> {
    const weeks: Record<string, T[]> = {}
    sessions.forEach(s => {
        const d = new Date(s.date)
        const monday = new Date(d)
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        const key = monday.toISOString().slice(0, 10)
        if (!weeks[key]) weeks[key] = []
        weeks[key].push(s)
    })
    return weeks
}
