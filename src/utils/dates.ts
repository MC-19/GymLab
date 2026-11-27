export function shiftLocalDay(date: Date, offset: number): Date {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)
    return day
}

export function localDateKey(date = new Date()): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
        .join('-')
}

export function localMonday(date: Date): Date {
    return shiftLocalDay(date, -((date.getDay() + 6) % 7))
}

export function sessionDates<T extends { completedAt: string }>(
    sessions: T[], period: 'week' | 'previous' | 'recent', now = new Date(), count = 7,
): T[] {
    const monday = localMonday(now)
    const start = period === 'recent' ? shiftLocalDay(now, 1 - count)
        : period === 'previous' ? shiftLocalDay(monday, -7) : monday
    const end = period === 'previous' ? monday
        : period === 'week' ? shiftLocalDay(monday, 7) : shiftLocalDay(now, 1)
    return sessions.filter(session => {
        const time = Date.parse(session.completedAt)
        return time >= start.getTime() && time < end.getTime() && time <= now.getTime()
    })
}
