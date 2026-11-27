import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingProgram, WorkoutDay } from '../../types'
import { updateProgramDays } from '../../hooks/usePrograms'
import { parseWorkoutState, pointRotationAt, readRotation, replaceRotationDay } from '../../hooks/useRotation'
import { parseBackup } from '../../utils/backup'
import { copyExercisePlan, copyWorkoutDay } from '../../utils/helpers'
import { chronological, createSession, finishSession, previousExercise, recommendedIncrement, type SessionSet } from '../training/session'
import { DEFAULT_GOALS, isExerciseGoals } from './goals'
import { PROGRAM_TEMPLATES, buildTemplateDays } from './templates'

const goals = { ...DEFAULT_GOALS, sets: 2, restSeconds: 75, incrementKg: 1.25 }
const exercise: Exercise = {
    id: 'press', catalogId: 'press_banca_plano', name: 'Banca', goals,
    weeks: [{ id: 'week', weekNumber: 4, sets: [
        { id: 'warmup', type: 'warmup', weight: 30, reps: 12, rir: 3 },
        { id: 'working', weight: 60, reps: 12, rir: 2 },
        { id: 'dropset', type: 'dropset', weight: 40, reps: 15, rir: 1 },
    ] }],
}
const day: WorkoutDay = { id: 'day', name: 'Torso', createdAt: '2024-01-01', order: 0, exercises: [exercise] }
const another: WorkoutDay = { ...day, id: 'another', order: 1 }
const program: TrainingProgram = { id: 'program', name: 'Fuerza', createdAt: day.createdAt, isArchived: false, days: [day, another] }
const series = (id: string, patch: Partial<SessionSet> = {}): SessionSet => ({
    id, type: 'normal', completed: true, weight: 60, reps: 12, rir: 2, ...patch,
})

describe('program planning', () => {
    it('creates the five editable templates with independent days, exercises and goals', () => {
        expect(PROGRAM_TEMPLATES.map(template => template.days.length)).toEqual([3, 4, 3, 6, 4])
        for (const template of PROGRAM_TEMPLATES) {
            const first = buildTemplateDays(template)
            const second = buildTemplateDays(template)
            const exerciseIds = [...first, ...second].flatMap(item => item.exercises.map(entry => entry.id))
            expect(new Set([...first, ...second].map(item => item.id)).size).toBe(first.length * 2)
            expect(new Set(exerciseIds).size).toBe(exerciseIds.length)
            expect(first.flatMap(item => item.exercises).every(entry =>
                entry.catalogId && isExerciseGoals(entry.goals) && !entry.weeks.length)).toBe(true)
            expect(first[0].exercises[0].goals).not.toBe(second[0].exercises[0].goals)
        }
        expect(buildTemplateDays(PROGRAM_TEMPLATES[4])[0].exercises[0].goals?.maxReps).toBe(5)
    })

    it('validates goal inputs while permitting zero rest or increment', () => {
        expect(isExerciseGoals({ ...goals, restSeconds: 0, incrementKg: 0 })).toBe(true)
        expect(isExerciseGoals({ ...goals, sets: 0 })).toBe(false)
        expect(isExerciseGoals({ ...goals, minReps: 13 })).toBe(false)
        expect(isExerciseGoals({ ...goals, targetRir: 11 })).toBe(false)
        expect(isExerciseGoals({ ...goals, restSeconds: 120.5 })).toBe(false)
        expect(isExerciseGoals({ ...goals, incrementKg: 0.001 })).toBe(false)
    })

    it('duplicates planning only and keeps archived results and rotation when substituting', () => {
        const duplicate = copyExercisePlan(exercise)
        expect(duplicate.id).not.toBe(exercise.id)
        expect(duplicate.goals).toEqual(exercise.goals)
        expect(duplicate.goals).not.toBe(exercise.goals)
        expect(duplicate.weeks[0].sets.every(set => set.weight === null && set.reps === null)).toBe(true)
        const next = updateProgramDays(program, previous => previous.map(item =>
            item.id === day.id ? { ...item, exercises: [duplicate] } : item))
        expect(next.days[0].exercises[1]).toMatchObject({ id: exercise.id, isDeleted: true, weeks: exercise.weeks })

        const replacement = copyWorkoutDay(another)
        const after = updateProgramDays(program, [replacement, another])
        expect(after.days.find(item => item.id === day.id)).toMatchObject({ isDeleted: true, exercises: day.exercises })
        const initial = pointRotationAt(parseWorkoutState(null), program.id, program.days, 0)
        expect(replaceRotationDay(initial, program.id, program.days, day.id, replacement).currentDayIdByProgram?.[program.id])
            .toBe(replacement.id)
        expect(replaceRotationDay(initial, program.id, program.days, another.id, replacement)).toBe(initial)
    })

    it('recovers the scheduled replacement if the routine is committed before the rotation write', () => {
        const scheduled = pointRotationAt(parseWorkoutState(null), program.id, program.days, 1)
        const replacement = copyWorkoutDay(day)
        const latest = copyWorkoutDay(day)
        const savedProgram = {
            ...program,
            days: [
                day, latest,
                { ...another, isDeleted: true, replacedByDayId: replacement.id },
                { ...replacement, isDeleted: true, replacedByDayId: latest.id },
            ],
        }
        const restored = parseBackup(JSON.stringify({
            version: 2, days: [day, latest], localStorage: {
                gymlab_programs: JSON.stringify([savedProgram]),
                gymlab_state: JSON.stringify(scheduled),
            },
        }))
        const programs: TrainingProgram[] = JSON.parse(restored.localStorage!.gymlab_programs)
        const rotation = readRotation({ getItem: key => restored.localStorage?.[key] ?? null }, program.id, programs)
        expect(rotation.currentDayIdByProgram?.[program.id]).toBe(latest.id)
        expect(rotation.currentDayIndexByProgram[program.id]).toBe(1)
        expect(savedProgram.days[2].id).toBe(another.id)
    })

})

describe('double progression and session snapshots', () => {
    it('evaluates the required completed working sets without recommending from warmups, dropsets or missing RIR', () => {
        const warmup = series('warm', { type: 'warmup', weight: 100 })
        const drop = series('drop', { type: 'dropset' })
        expect(recommendedIncrement(goals, [warmup, series('1'), drop, series('2', { rir: 3 })])).toBe(1.25)
        for (const failed of [{ reps: 11 }, { rir: 1 }, { rir: null }, { completed: false }, { weight: 0 }]) {
            expect(recommendedIncrement(goals, [series('1', failed), series('2')])).toBeNull()
        }
        expect(recommendedIncrement(goals, [warmup, series('1'), drop])).toBeNull()
        expect(recommendedIncrement(goals, [series('1', { reps: 11 }), series('2'), series('extra')])).toBeNull()
        expect(recommendedIncrement(goals, [series('1', { completed: false }), series('2'), series('extra')])).toBeNull()
        expect(recommendedIncrement({ ...goals, incrementKg: 0 }, [series('1'), series('2')])).toBeNull()
        expect(recommendedIncrement(undefined, [series('1'), series('2')])).toBeNull()
    })

    it('stores a copy of the goal, keeps old planning compatible and preserves backup snapshots', () => {
        const oldExercise: Exercise = { ...exercise, goals: undefined }
        const draft = createSession(program, day, new Date('2026-01-01T12:00:00Z'))
        expect(draft.exercises[0].sets.map(set => set.type)).toEqual(['warmup', 'normal', 'normal', 'dropset'])
        expect(draft.exercises[0].sets.every(set => set.weight === null)).toBe(true)
        expect(draft.exercises[0].goals).toEqual(goals)
        expect(draft.exercises[0].goals).not.toBe(goals)

        const legacyDay = { ...day, exercises: [oldExercise] }
        const oldDraft = createSession(program, legacyDay)
        expect(oldDraft.exercises[0].sets.map(set => set.type)).toEqual(['warmup', 'normal', 'dropset'])
        const finish = finishSession({ ...draft, exercises: [{ ...draft.exercises[0], sets: [series('1'), series('2')] }] }, [])
        const newDay = { ...day, exercises: [{ ...exercise, goals: { ...goals, sets: 5 } }] }
        const updated = createSession(program, newDay)
        expect(updated.exercises[0].sets.filter(set => set.type === 'normal')).toHaveLength(5)
        expect(finish.exercises[0].goals?.sets).toBe(2)
        const restored = parseBackup(JSON.stringify({
            version: 3, days: [newDay], localStorage: { gymlab_programs: JSON.stringify([{ ...program, days: [newDay] }]) },
            trainingSessions: [finish, oldDraft],
        }))
        expect(restored.trainingSessions?.[0].exercises[0].goals?.sets).toBe(2)
        expect(restored.trainingSessions?.[1].exercises[0].goals).toBeUndefined()
        expect(restored.days[0].exercises[0].goals?.sets).toBe(5)
        expect(parseBackup(JSON.stringify({ days: [legacyDay] })).days[0].exercises[0].goals).toBeUndefined()
    })

    it('finds previous Training results for the same movement and excludes changed catalog identities', () => {
        const draft = createSession(program, day)
        const done = finishSession({ ...draft, exercises: [{ ...draft.exercises[0], sets: [series('1'), series('2')] }] }, [])
        const candidate = draft.exercises[0]
        const history = chronological([done])
        expect(previousExercise({ ...candidate, exerciseId: 'copy' }, history)?.sets).toEqual(done.exercises[0].sets)
        expect(previousExercise({ ...candidate, catalogId: 'remo_barra' }, history)).toBeNull()
    })
})
