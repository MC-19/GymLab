import { describe, expect, it } from 'vitest'
import type { TrainingProgram } from '../types'
import { getHistory, getHistorySessions } from './history'
import { sessionDates } from './dates'
import { calculateWeeklyStreak } from './helpers'

const now = new Date(2026, 2, 30, 12)
const completed = (id: string, date: Date, programId?: string) => ({ id, completedAt: date.toISOString(), dayId: 'day', programId })
const old = completed('old', new Date(2026, 2, 23), 'archived')
const sunday = completed('sunday', new Date(2026, 2, 29, 23, 59))
const monday = completed('monday', new Date(2026, 2, 30), 'archived')
const future = completed('future', new Date(2026, 2, 30, 13), 'archived')
const archived: TrainingProgram = {
    id: 'archived', name: 'Archivado', isArchived: true, createdAt: '2026-01-01',
    days: [{
        id: 'day', name: 'Día A', order: 0, createdAt: '2026-01-01', isDeleted: true,
        exercises: [{
            id: 'ex', name: 'Press', isDeleted: true,
            weeks: [8, 1, 3, 10, 7].map(weekNumber => ({
                id: String(weekNumber), weekNumber,
                sets: [{ id: `set-${weekNumber}`, weight: weekNumber * 10, reps: 2, rir: 2 }],
            })),
        }],
    }],
}

describe('progress and sessions', () => {
    it('uses the same registered weeks for charts and totals, including removed records', () => {
        const selected = getHistory([archived], archived.id, JSON.stringify(['archived', 'day']), 4)
        expect(selected.rows[0].progress.map(row => row.weekNumber)).toEqual([3, 7, 8, 10])
        expect(selected.rows[0].weeks.map(row => row.weekNumber)).toEqual([3, 7, 8, 10])
        expect(selected).toMatchObject({ totalExercises: 1, totalWeeks: 4, totalVolume: 560 })
        expect(getHistory([archived], '', '', Infinity).totalVolume).toBe(580)
        expect(getHistory([archived], '', '', 1).totalVolume).toBe(200)
    })

    it('excludes blank planned weeks and duplicate routines without logged performance', () => {
        const base = archived.days[0].exercises[0]
        const blank = { id: 'planned', weekNumber: 12, sets: [{ id: 'blank', weight: null, reps: null, rir: null }] }
        const program = { ...archived, days: [{ ...archived.days[0], exercises: [
            { ...base, weeks: [...base.weeks, blank] }, { ...base, id: 'copy', weeks: [blank] },
        ] }] }
        const result = getHistory([program], '', '', 1)
        expect(result.totalExercises).toBe(1)
        expect(result.rows[0].last.weekNumber).toBe(10)
        expect(result.totalVolume).toBe(200)
    })

    it('includes archived sessions and attributes unassigned legacy sessions by their original day', () => {
        expect(getHistorySessions([sunday, monday], [archived], 'archived', JSON.stringify(['archived', 'day'])))
            .toEqual([sunday, monday])
        expect(getHistorySessions([sunday, monday], [archived], 'other', '')).toEqual([])
    })

    it('corrects old misattribution with a unique day owner and keeps explicit session snapshots', () => {
        const legacy = { ...monday, programId: 'wrong' }
        const snapshot = { ...legacy, id: 'snapshot', programName: 'Programa original' }
        expect(getHistorySessions([legacy, snapshot], [archived], 'archived', '')).toEqual([legacy])
        expect(getHistorySessions([legacy, snapshot], [archived], 'wrong', '')).toEqual([snapshot])
    })

    it('distinguishes the natural week, previous week and last seven local days across DST', () => {
        const sessions = [old, sunday, monday, future]
        expect(sessionDates(sessions, 'week', now)).toEqual([monday])
        expect(sessionDates(sessions, 'previous', now)).toEqual([old, sunday])
        expect(sessionDates(sessions, 'recent', now)).toEqual([sunday, monday])
        expect(calculateWeeklyStreak([old, sunday, monday], now)).toBe(2)
        expect(calculateWeeklyStreak([old], now)).toBe(1)
    })
})
