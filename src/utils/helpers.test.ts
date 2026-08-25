import { describe, expect, it } from 'vitest'
import type { Exercise, LoggedSet } from '../types'
import {
    calc1RM,
    calcTotalVolume,
    createEmptyTrainingWeek,
    createTrainingWeekFromPrevious,
    findExercise,
    findTrainingWeek,
    getCompletedSets,
    getExerciseProgress,
    shouldSuggestWeightIncrease,
} from './helpers'

function makeSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
    return {
        id: crypto.randomUUID(),
        weight: 80,
        reps: 8,
        rir: 2,
        ...overrides,
    }
}

function makeExercise(weeks: Exercise['weeks']): Exercise {
    return {
        id: 'exercise-1',
        name: 'Press banca',
        weeks,
    }
}

describe('training helpers', () => {
    it('counts only complete sets', () => {
        expect(getCompletedSets([
            makeSet(),
            makeSet({ weight: null }),
            makeSet({ reps: null }),
        ])).toBe(1)
    })

    it('ignores warmup sets when calculating volume', () => {
        expect(calcTotalVolume([
            makeSet({ type: 'warmup', weight: 40, reps: 10 }),
            makeSet({ type: 'normal', weight: 80, reps: 8 }),
        ])).toBe(640)
    })

    it('calculates estimated one rep max with Epley', () => {
        expect(calc1RM(80, 8)).toBe(101)
        expect(calc1RM(80, 1)).toBe(80)
        expect(calc1RM(80, 0)).toBe(0)
    })

    it('sorts progress and marks new personal records', () => {
        const exercise = makeExercise([
            { id: 'week-2', weekNumber: 2, sets: [makeSet({ weight: 85 })] },
            { id: 'week-1', weekNumber: 1, sets: [makeSet({ weight: 80 })] },
            { id: 'week-3', weekNumber: 3, sets: [makeSet({ weight: 90 })] },
        ])

        expect(getExerciseProgress(exercise).map(week => week.weekNumber)).toEqual([1, 2, 3])
        expect(getExerciseProgress(exercise).map(week => week.isPR)).toEqual([false, true, true])
    })

    it('finds an exercise and its week from the workout tree', () => {
        const exercise = makeExercise([
            { id: 'week-1', weekNumber: 1, sets: [] },
        ])
        const days = [{
            id: 'day-1',
            name: 'Día A',
            exercises: [exercise],
            createdAt: '2026-01-01T00:00:00.000Z',
            order: 0,
        }]

        expect(findExercise(days, 'day-1', 'exercise-1')).toBe(exercise)
        expect(findTrainingWeek(days, 'day-1', 'exercise-1', 'week-1')).toBe(exercise.weeks[0])
        expect(findExercise(days, 'missing', 'exercise-1')).toBeUndefined()
    })

    it('creates the first empty week and increments the next week number', () => {
        const exercise = makeExercise([])
        const firstWeek = createEmptyTrainingWeek(exercise)

        expect(firstWeek.weekNumber).toBe(1)
        expect(firstWeek.sets).toEqual([])

        const nextWeek = createEmptyTrainingWeek(makeExercise([firstWeek]))
        expect(nextWeek.weekNumber).toBe(2)
    })

    it('copies weights and set types while clearing reps and RIR', () => {
        const previousWeek = {
            id: 'week-1',
            weekNumber: 1,
            sets: [
                makeSet({ type: 'warmup', weight: 40, reps: 10, rir: 4 }),
                makeSet({ type: 'normal', weight: 80, reps: 8, rir: 1 }),
            ],
        }
        const copiedWeek = createTrainingWeekFromPrevious(makeExercise([previousWeek]))

        expect(copiedWeek.weekNumber).toBe(2)
        expect(copiedWeek.sets).toMatchObject([
            { type: 'warmup', weight: 40, reps: null, rir: null },
            { type: 'normal', weight: 80, reps: null, rir: null },
        ])
        expect(copiedWeek.sets[0]?.id).not.toBe(previousWeek.sets[0]?.id)
    })

    it('suggests a weight increase only when the previous week qualifies', () => {
        expect(shouldSuggestWeightIncrease({
            id: 'week-1',
            weekNumber: 1,
            sets: [makeSet({ rir: 1 })],
        })).toBe(true)

        expect(shouldSuggestWeightIncrease({
            id: 'week-2',
            weekNumber: 2,
            sets: [makeSet({ rir: 3 })],
        })).toBe(false)

        expect(shouldSuggestWeightIncrease({ id: 'empty', weekNumber: 3, sets: [] })).toBe(false)
    })
})
