import { describe, expect, it } from 'vitest'
import type { CompletedSession, WorkoutDay } from '../types'
import { advanceRotation, getRotationIndex, parseWorkoutState, pointRotationAt, removeDayFromRotation } from './useRotation'

const days: WorkoutDay[] = ['a', 'b', 'c'].map((id, order) => ({
    id, order, name: id, exercises: [], createdAt: '2026-01-01',
}))
const session: CompletedSession = { id: 'session-1', dayId: 'b', completedAt: '2026-01-01T00:00:00.000Z' }
const currentId = (state: ReturnType<typeof parseWorkoutState>, program: string, routine = days) =>
    routine[getRotationIndex(state, program, routine)]?.id

describe('rotation and migration', () => {
    it('starts at the first day with no state and rejects invalid data', () => {
        expect(currentId(parseWorkoutState(null), 'one')).toBe('a')
        expect(() => parseWorkoutState('{invalid')).toThrow()
        expect(() => parseWorkoutState('{"sessions":[null]}')).toThrow()
    })

    it('maps the legacy index while retaining session records without inventing their program', () => {
        const state = parseWorkoutState(JSON.stringify({ currentDayIndex: 1, sessions: [session] }), 'one')
        expect(currentId(state, 'one')).toBe('b')
        expect(state.sessions).toEqual([session])
    })

    it('keeps the same day through move, add, duplicate and reload', () => {
        const old = parseWorkoutState('{"version":2,"currentDayIndexByProgram":{"one":1,"two":2}}')
        const state = pointRotationAt(old, 'one', days, getRotationIndex(old, 'one', days))
        const reloaded = parseWorkoutState(JSON.stringify(state))
        const reordered = [days[1], days[2], days[0], { ...days[1], id: 'copy' }]
        expect(currentId(reloaded, 'one', reordered)).toBe('b')
        expect(currentId(reloaded, 'two')).toBe('c')
    })

    it('keeps a surviving day and moves to the next if the current day is removed', () => {
        const state = pointRotationAt(parseWorkoutState(null), 'one', days, 1)
        const removeOther = removeDayFromRotation(state, 'one', days, 'a')
        expect(currentId(removeOther, 'one', days.slice(1))).toBe('b')
        const removeCurrent = removeDayFromRotation(state, 'one', days, 'b')
        expect(currentId(removeCurrent, 'one', [days[0], days[2]])).toBe('c')
    })

    it('advances from the completed day, wraps, and resets without deleting any session', () => {
        const state = pointRotationAt(parseWorkoutState(null), 'two', days, 1)
        const advanced = advanceRotation(state, 'one', days, session)
        expect(currentId(advanced, 'one')).toBe('c')
        const wrapped = advanceRotation(advanced, 'one', days, { ...session, id: 'session-2', dayId: 'c' })
        expect(currentId(wrapped, 'one')).toBe('a')
        const reset = pointRotationAt(wrapped, 'two', days, 0)
        expect(currentId(reset, 'two')).toBe('a')
        expect(reset.sessions.map(item => item.id)).toEqual(['session-1', 'session-2'])
        expect(advanceRotation(reset, 'one', days, { ...session, dayId: 'missing' })).toBe(reset)
    })
})
