import { describe, expect, it, vi } from 'vitest'
import type { Exercise, LoggedSet } from '../types'
import {
    calc1RM,
    generateId,
    calcTotalVolume,
    getEstimated1RM,
    incrementPreparedWeek,
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
            sets: [makeSet({ rir: 2 })],
        })).toBe(true)

        expect(shouldSuggestWeightIncrease({
            id: 'week-2',
            weekNumber: 2,
            sets: [makeSet({ rir: 1 })],
        })).toBe(false)

        expect(shouldSuggestWeightIncrease({ id: 'empty', weekNumber: 3, sets: [] })).toBe(false)
    })
})

describe('effective sets', () => {
    it('uses the highest valid Epley estimate instead of the heaviest load', () => {
        expect(getEstimated1RM([
            makeSet({ weight: 100, reps: 1 }),
            makeSet({ weight: 90, reps: 8 }),
            makeSet({ weight: 130, reps: 1, type: 'warmup' }),
            makeSet({ weight: 140, reps: 40 }),
            makeSet({ weight: 150, reps: null }),
            makeSet({ weight: null, reps: 5 }),
            makeSet({ weight: Infinity, reps: 4 }),
            makeSet({ weight: 150, reps: 2.5 }),
        ])).toBe(114)
        expect(calc1RM(-10, 5)).toBe(0)
    })

    it('requires valid RIR and completed data for every working set', () => {
        const week = (sets: LoggedSet[]) => ({ id: 'week', weekNumber: 1, sets })
        const working = makeSet({ rir: 3 })
        const warmup = makeSet({ type: 'warmup', rir: null })
        expect(shouldSuggestWeightIncrease(week([working, warmup]))).toBe(true)
        expect(shouldSuggestWeightIncrease(week([warmup]))).toBe(false)
        for (const invalid of [{ rir: null }, { reps: null }, { weight: -1 }, { rir: NaN }, { rir: 11 }]) {
            expect(shouldSuggestWeightIncrease(week([working, makeSet(invalid)]))).toBe(false)
        }
    })

    it('only increments planned normal sets and preserves the previous recorded week', () => {
        const source = {
            id: 'week-1', weekNumber: 1,
            sets: [makeSet(), makeSet({ type: 'warmup', weight: 40 }), makeSet({ type: 'dropset', weight: 60 })],
        }
        const prepared = createTrainingWeekFromPrevious(makeExercise([source]))
        const incremented = incrementPreparedWeek(prepared, 2.5)
        expect(incremented.sets.map(set => set.weight)).toEqual([82.5, 40, 60])
        expect(source.sets.map(set => set.weight)).toEqual([80, 40, 60])
        expect(incrementPreparedWeek(source, 5)).toBe(source)
        expect(incrementPreparedWeek(prepared, Infinity)).toBe(prepared)
        expect(incrementPreparedWeek(prepared, Number.MAX_VALUE).sets[0].weight).toBe(80)
    })
})


it('generates unique v4 identifiers without randomUUID in a mobile HTTP context', () => {
    const random = globalThis.crypto
    vi.stubGlobal('crypto', { getRandomValues: random.getRandomValues.bind(random) })
    try {
        const ids = Array.from({ length: 12 }, generateId)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
    } finally {
        vi.unstubAllGlobals()
    }
})
