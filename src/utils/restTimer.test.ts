import { describe, expect, it } from 'vitest'
import { adjustRestTimer, createRestTimer, remainingRest } from './restTimer'

describe('rest timer deadlines', () => {
    it('retains the adjusted duration on reload and catches up after inactivity', () => {
        const started = createRestTimer(60, 1_000)
        expect(remainingRest(started, 60_999)).toBe(1)
        const updated = adjustRestTimer(started, 30)
        const restored = JSON.parse(JSON.stringify(updated)) as typeof updated
        expect(restored.duration).toBe(90)
        expect(remainingRest(restored, 81_000)).toBe(10)
        expect(remainingRest(restored, 110_000)).toBe(0)
    })

    it('expires when subtracting more time than remains and can restart with a new deadline', () => {
        const started = createRestTimer(60, 1_000)
        expect(remainingRest(adjustRestTimer(started, -30), 35_000)).toBe(0)
        expect(remainingRest(createRestTimer(120, 35_000), 35_000)).toBe(120)
    })
})
