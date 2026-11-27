import type { CompletedSession, TrainingProgram, TrainingWeek } from '../types'
import { getExerciseProgress } from './helpers'

export const historyWindows = [1, 4, 12, Infinity] as const

function hasRecordedData(week: TrainingWeek): boolean {
    return Boolean(week.label?.trim()) || week.sets.some(set =>
        set.weight !== null || set.reps !== null || set.rir !== null || Boolean(set.notes?.trim())
    )
}

export function getHistory(programs: TrainingProgram[], programId: string, routineId: string, limit: number) {
    const routines = programs.filter(program => !programId || program.id === programId)
        .flatMap(program => program.days.map(day => ({ program, day, id: JSON.stringify([program.id, day.id]) })))
    const rows = routines.filter(routine => !routineId || routine.id === routineId)
        .flatMap(({ program, day }) => day.exercises.flatMap(ex => {
            const recorded = ex.weeks.filter(hasRecordedData)
            if (!recorded.length) return []
            const progress = getExerciseProgress({ ...ex, weeks: recorded }).slice(-limit)
            const first = progress[0]
            const last = progress[progress.length - 1]
            const weeks = recorded.sort((a, b) => a.weekNumber - b.weekNumber).slice(-limit)
            return [{ program, day, ex, progress, first, last, weeks, delta: last.maxWeight - first.maxWeight }]
        }))
    return {
        routines,
        rows,
        totalExercises: rows.length,
        totalWeeks: rows.reduce((total, row) => total + row.progress.length, 0),
        totalVolume: rows.reduce((total, row) => total + row.progress.reduce((sum, week) => sum + week.totalVolume, 0), 0),
    }
}


export function getHistorySessions(sessions: CompletedSession[], programs: TrainingProgram[], programId: string, routineId: string) {
    return sessions.filter(session => {
        let origin = session.programId
        // Older migration assigned every untagged session to the active program.
        if (session.programName === undefined) {
            const owners = programs.filter(program => program.days.some(day => day.id === session.dayId))
            if (owners.length === 1) origin = owners[0].id
        }
        return (!programId || programId === origin)
            && (!routineId || routineId === JSON.stringify([origin, session.dayId]))
    })
}
