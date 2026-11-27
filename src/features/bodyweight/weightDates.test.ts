import { describe, expect, it } from 'vitest'
import { localDateKey } from '../../utils/dates'
import { getWeightSummary } from './weightDates'

const now = new Date(2026, 2, 30, 0, 15)
const entry = (date: string, weight: number) => ({ id: date, date, weight })

describe('bodyweight calendar', () => {
    it('uses local midnight and chooses the closest reading to seven calendar days ago', () => {
        const today = entry('2026-03-30', 80)
        expect(localDateKey(now)).toBe(today.date)
        const entries = [entry('2026-03-22', 81), entry('2026-03-26', 95), today, entry('2026-03-31', 5)]
        expect(getWeightSummary(entries, now)).toEqual({ todayEntry: today, lastEntry: today, weekDelta: -1 })
    })

    it('leaves the comparison empty for stale references or when there is no reading today', () => {
        const old = entry('2026-03-20', 83)
        expect(getWeightSummary([old, entry('2026-03-30', 80)], now).weekDelta).toBeNull()
        expect(getWeightSummary([entry('2026-03-23', 82), entry('2026-03-29', 80)], now).weekDelta).toBeNull()
        expect(getWeightSummary([], now).lastEntry).toBeNull()
    })
})
