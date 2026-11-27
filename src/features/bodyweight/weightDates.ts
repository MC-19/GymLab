import { localDateKey, shiftLocalDay } from '../../utils/dates'
import type { BodyWeightEntry } from './types'

export function getWeightSummary(entries: BodyWeightEntry[], now = new Date()) {
    const today = localDateKey(now)
    const todayEntry = entries.find(entry => entry.date === today)
    const lastEntry = entries.filter(entry => entry.date <= today).at(-1) ?? null
    // Compare today's reading to the nearest reading to seven days ago, within ±2 days.
    const offsets = [7, 8, 6, 9, 5]
    const reference = offsets.map(offset => localDateKey(shiftLocalDay(now, -offset)))
        .map(date => entries.find(entry => entry.date === date)).find(entry => entry !== undefined)
    const weekDelta = todayEntry && reference
        ? Math.round((todayEntry.weight - reference.weight) * 10) / 10
        : null
    return { todayEntry, lastEntry, weekDelta }
}
