import type { Exercise, ExerciseGoals, SetType, TrainingProgram, WorkoutDay } from '../../types'
import { isExerciseGoals } from '../programs/goals'
import { generateId, getLatestTrainingWeek, meetsProgressionTarget } from '../../utils/helpers'

export interface SessionSet {
    id: string
    type: SetType
    weight: number | null
    reps: number | null
    rir: number | null
    completed: boolean
    workingOrder?: number // Original working-set position on completion, including skipped slots.
}

export interface SessionExercise {
    id: string
    exerciseId: string
    catalogId?: string
    name: string
    goals?: ExerciseGoals
    sets: SessionSet[]
}

export interface WorkoutSession {
    id: string
    programId: string
    programName: string
    dayId: string
    dayName: string
    startedAt: string
    updatedAt: string
    exercises: SessionExercise[]
    status: 'active' | 'completed'
    completedAt: string | null
    records: string[]
}

export type SetFields = Pick<SessionSet, 'weight' | 'reps' | 'rir'>

export function emptySessionSet(type: SetType = 'normal'): SessionSet {
    return { id: generateId(), type, weight: null, reps: null, rir: null, completed: false }
}

function plannedSessionSets(exercise: Exercise): SessionSet[] {
    const planned = getLatestTrainingWeek(exercise)?.sets ?? []
    const goals = exercise.goals
    if (!goals) return planned.length ? planned.map(set => emptySessionSet(set.type)) : [emptySessionSet()]
    let working = 0
    const sets = planned.flatMap(set => {
        if (!set.type || set.type === 'normal') {
            if (working >= goals.sets) return []
            working++
        }
        return [emptySessionSet(set.type)]
    })
    const lastWorking = sets.reduce((last, set, index) => set.type === 'normal' ? index : last, -1)
    const firstDropset = sets.findIndex(set => set.type === 'dropset')
    const insertion = lastWorking >= 0 ? lastWorking + 1 : firstDropset >= 0 ? firstDropset : sets.length
    sets.splice(insertion, 0, ...Array.from({ length: goals.sets - working }, () => emptySessionSet()))
    return sets
}

export function createSession(program: TrainingProgram, day: WorkoutDay, now = new Date()): WorkoutSession {
    if (program.isArchived || program.isDeleted || day.isDeleted || !day.exercises.some(exercise => !exercise.isDeleted)) {
        throw new Error('Añade un ejercicio a la rutina antes de entrenar.')
    }
    const startedAt = now.toISOString()
    return {
        id: generateId(), programId: program.id, programName: program.name, dayId: day.id, dayName: day.name,
        startedAt, updatedAt: startedAt, exercises: day.exercises.filter(exercise => !exercise.isDeleted).map(exercise => ({
            id: generateId(), exerciseId: exercise.id, catalogId: exercise.catalogId, name: exercise.name,
            goals: exercise.goals && { ...exercise.goals },
            sets: plannedSessionSets(exercise),
        })),
        status: 'active', completedAt: null, records: [],
    }
}

function validNumber(value: unknown, minimum: number, maximum: number, integer = false): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
        && (!integer || Number.isInteger(value))
}

export function validSetFields(values: SetFields): boolean {
    return (values.weight === null || validNumber(values.weight, 0, 100_000))
        && (values.reps === null || validNumber(values.reps, 0, 100_000, true))
        && (values.rir === null || validNumber(values.rir, 0, 10))
}

export function canCompleteSet(set: SetFields): boolean {
    return validSetFields(set) && set.weight !== null && set.reps !== null && set.reps > 0
}

export function sameExercise(a: SessionExercise, b: SessionExercise): boolean {
    return a.catalogId && b.catalogId ? a.catalogId === b.catalogId : a.exerciseId === b.exerciseId
}

export function chronological(sessions: WorkoutSession[]): WorkoutSession[] {
    return sessions.filter(session => session.status === 'completed')
        .sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!) || b.id.localeCompare(a.id))
}

export function previousExercise(exercise: SessionExercise, history: WorkoutSession[]) {
    for (const session of history) {
        const matches = session.exercises.filter(candidate =>
            sameExercise(exercise, candidate) && candidate.sets.some(set => set.completed))
        const matching = matches.find(candidate => candidate.exerciseId === exercise.exerciseId) ?? matches[0]
        if (matching) return { completedAt: session.completedAt!, sets: matching.sets.filter(set => set.completed) }
    }
    return null
}

/** Evaluate the first prescribed working sets, so extra sets cannot hide a missed target. */
export function recommendedIncrement(goals: ExerciseGoals | undefined, previous: SessionSet[]): number | null {
    if (!goals?.incrementKg) return null
    const working = previous.filter(set => set.type === 'normal').slice(0, goals.sets)
    return working.length === goals.sets && working.every((set, index) =>
        set.completed && (set.workingOrder === undefined || set.workingOrder === index + 1)
        && meetsProgressionTarget(set, goals.maxReps, goals.targetRir))
        ? goals.incrementKg : null
}

export function summarizeSession(session: WorkoutSession) {
    const exercises = session.exercises.filter(exercise => exercise.sets.some(set => set.completed))
    const sets = exercises.flatMap(exercise => exercise.sets.filter(set => set.completed))
    return {
        duration: Math.max(0, Math.floor((Date.parse(session.completedAt ?? session.updatedAt) - Date.parse(session.startedAt)) / 1000)),
        exercises: exercises.length,
        sets: sets.length,
        volume: sets.reduce((total, set) => total + (set.type === 'warmup' ? 0 : (set.weight ?? 0) * (set.reps ?? 0)), 0),
    }
}

export function finishSession(session: WorkoutSession, history: WorkoutSession[], now = new Date()): WorkoutSession {
    if (session.status !== 'active') return session
    const exercises = session.exercises.map(exercise => {
        let workingOrder = 0
        const sets = exercise.sets.flatMap(set => {
            if (set.type === 'normal') workingOrder++
            if (!set.completed) return []
            return set.type === 'normal' ? [{ ...set, workingOrder }] : [set]
        })
        return { ...exercise, sets }
    }).filter(exercise => exercise.sets.length > 0)
    if (!exercises.length || exercises.some(exercise => exercise.sets.some(set => !canCompleteSet(set)))) {
        throw new Error('Completa al menos una serie con peso y repeticiones para finalizar.')
    }
    const maxWeight = (sets: SessionSet[]) => sets.reduce((max, set) =>
        set.completed && set.type !== 'warmup' ? Math.max(max, set.weight ?? 0) : max, 0)
    const records = exercises.flatMap(exercise => {
        const previous = history.flatMap(item => item.exercises)
            .filter(candidate => sameExercise(exercise, candidate))
            .reduce((max, candidate) => Math.max(max, maxWeight(candidate.sets)), 0)
        return previous > 0 && maxWeight(exercise.sets) > previous ? [exercise.id] : []
    })
    const completedAt = new Date(Math.max(now.getTime(), Date.parse(session.updatedAt), Date.parse(session.startedAt))).toISOString()
    return { ...session, exercises, records, completedAt, updatedAt: completedAt, status: 'completed' }
}

function object(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}
function date(value: unknown): value is string {
    return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
function uniqueIds(entries: Array<{ id: string }>): boolean {
    return new Set(entries.map(entry => entry.id)).size === entries.length
}
function isSet(value: unknown): value is SessionSet {
    if (!object(value) || typeof value.id !== 'string' || typeof value.completed !== 'boolean'
        || (value.type !== 'normal' && value.type !== 'warmup' && value.type !== 'dropset')) return false
    if (value.workingOrder !== undefined && (value.type !== 'normal'
        || !value.completed || !validNumber(value.workingOrder, 1, Number.MAX_SAFE_INTEGER, true))) return false
    const fields = value as unknown as SetFields
    return validSetFields(fields) && (!value.completed || canCompleteSet(fields))
}
function validWorkingOrder(sets: SessionSet[]): boolean {
    const working = sets.filter(set => set.type === 'normal')
    if (working.every(set => set.workingOrder === undefined)) return true // Phase 1 backup.
    let last = 0
    return working.every(set => {
        if (set.workingOrder === undefined || set.workingOrder <= last) return false
        last = set.workingOrder
        return true
    })
}

function isExercise(value: unknown): value is SessionExercise {
    return object(value) && typeof value.id === 'string' && typeof value.exerciseId === 'string'
        && typeof value.name === 'string' && (value.catalogId === undefined || typeof value.catalogId === 'string')
        && (value.goals === undefined || isExerciseGoals(value.goals))
        && Array.isArray(value.sets) && value.sets.every(isSet) && uniqueIds(value.sets) && validWorkingOrder(value.sets)
}
function isSession(value: unknown): value is WorkoutSession {
    if (!object(value) || !['id', 'programId', 'programName', 'dayId', 'dayName'].every(key => typeof value[key] === 'string')
        || !date(value.startedAt) || !date(value.updatedAt) || Date.parse(value.updatedAt) < Date.parse(value.startedAt)
        || !Array.isArray(value.exercises) || !value.exercises.length || !value.exercises.every(isExercise) || !uniqueIds(value.exercises)
        || !Array.isArray(value.records)) return false
    if (value.status === 'active') return value.completedAt === null && value.records.length === 0
    const exercises: SessionExercise[] = value.exercises
    return value.status === 'completed' && date(value.completedAt) && Date.parse(value.completedAt) >= Date.parse(value.startedAt)
        && exercises.every(exercise => exercise.sets.length > 0 && exercise.sets.every(set => set.completed))
        && value.records.every(id => exercises.some(exercise => exercise.id === id))
}

export function validateSessions(value: unknown): WorkoutSession[] {
    if (!Array.isArray(value) || !value.every(isSession) || !uniqueIds(value)
        || value.filter(session => session.status === 'active').length > 1) {
        throw new Error('El archivo contiene sesiones de entrenamiento inválidas.')
    }
    return value
}
