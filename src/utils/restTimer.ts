export interface RestTimer {
    end: number
    duration: number
}

export function createRestTimer(seconds: number, now: number): RestTimer {
    const duration = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 180
    return { end: now + duration * 1000, duration }
}

export function remainingRest(timer: RestTimer, now: number): number {
    return Math.max(0, Math.ceil((timer.end - now) / 1000))
}

export function adjustRestTimer(timer: RestTimer, seconds: number): RestTimer {
    if (!Number.isFinite(seconds)) return timer
    return { end: timer.end + seconds * 1000, duration: Math.max(1, timer.duration + seconds) }
}
