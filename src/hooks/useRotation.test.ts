import { describe, expect, it } from 'vitest'
import { parseWorkoutState } from './useRotation'

describe('rotation state migration', () => {
    it('creates an empty v2 state when storage is missing or invalid', () => {
        expect(parseWorkoutState(null)).toEqual({
            version: 2,
            currentDayIndexByProgram: {},
            sessions: [],
        })
        expect(parseWorkoutState('{invalid')).toEqual({
            version: 2,
            currentDayIndexByProgram: {},
            sessions: [],
        })
    })

    it('moves the legacy current index to the active program', () => {
        const migrated = parseWorkoutState(JSON.stringify({
            currentDayIndex: 2,
            sessions: [{ id: 'session-1', dayId: 'day-1', completedAt: '2026-01-01T00:00:00.000Z' }],
        }), 'program-1')

        expect(migrated.currentDayIndexByProgram).toEqual({ 'program-1': 2 })
        expect(migrated.sessions).toHaveLength(1)
        expect(migrated.sessions[0]?.programId).toBe('program-1')
    })

    it('preserves indexes already stored in v2 format', () => {
        const state = parseWorkoutState(JSON.stringify({
            version: 2,
            currentDayIndexByProgram: { first: 1, second: 3 },
            sessions: [],
        }), 'first')

        expect(state.currentDayIndexByProgram).toEqual({ first: 1, second: 3 })
    })
})
