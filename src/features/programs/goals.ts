import type { ExerciseGoals } from '../../types'

export const DEFAULT_GOALS: ExerciseGoals = {
    sets: 3, minReps: 8, maxReps: 12, targetRir: 2, restSeconds: 120, incrementKg: 2.5,
}

export const GOAL_FIELDS = [
    { key: 'sets', label: 'Series', min: 1, max: 30, step: 1 },
    { key: 'minReps', label: 'Reps mínimas', min: 1, max: 100, step: 1 },
    { key: 'maxReps', label: 'Reps máximas', min: 1, max: 100, step: 1 },
    { key: 'targetRir', label: 'RIR objetivo', min: 0, max: 10, step: 0.5 },
    { key: 'restSeconds', label: 'Descanso (s)', min: 0, max: 1800, step: 1 },
    { key: 'incrementKg', label: 'Incremento (kg)', min: 0, max: 100, step: 0.01 },
] as const

export function isExerciseGoals(value: unknown): value is ExerciseGoals {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const goals = value as Record<keyof ExerciseGoals, unknown>
    return GOAL_FIELDS.every(({ key, min, max, step }) => {
        const entry = goals[key]
        return typeof entry === 'number' && entry >= min && entry <= max
            && Math.abs(entry / step - Math.round(entry / step)) < 1e-8
    }) && Number(goals.minReps) <= Number(goals.maxReps)
}

export function goalLabel({ sets, minReps, maxReps, targetRir }: ExerciseGoals): string {
    return `${sets} × ${minReps === maxReps ? maxReps : `${minReps}–${maxReps}`} reps · RIR ${targetRir}`
}
