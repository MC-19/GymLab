import { describe, expect, it } from 'vitest'
import type { TrainingProgram, WorkoutDay } from '../types'
import { copyWorkoutDay } from '../utils/helpers'
import { changeProgram, getActiveDays, loadActiveProgramId, loadPrograms, resolveActiveProgramId, updateProgramDays } from './usePrograms'

const day: WorkoutDay = {
    id: 'day', name: 'Torso', order: 0, createdAt: '2026-01-01',
    exercises: [{
        id: 'press', name: 'Press', catalogId: 'bench', notes: 'Ajustar el banco',
        weeks: [
            { id: 'old', weekNumber: 1, sets: [{ id: 'old-set', weight: 70, reps: 8, rir: 3 }] },
            { id: 'latest', weekNumber: 4, label: 'Descarga', sets: [
                { id: 'last-set', type: 'warmup', weight: 80, reps: 8, rir: 2, notes: 'Registro' },
            ] },
        ],
    }],
}
const program: TrainingProgram = { id: 'one', name: 'Uno', isArchived: false, createdAt: day.createdAt, days: [day] }
const other: TrainingProgram = { ...program, id: 'two', name: 'Dos', days: [] }

describe('stored programs', () => {
    it('restores selection across reload for old raw and current JSON identifiers', () => {
        const storage = { getItem: (key: string) => key === 'gymlab_programs' ? JSON.stringify([program, other]) : null }
        const loaded = loadPrograms(storage)
        const selected = resolveActiveProgramId(loaded, 'two')
        expect(loadActiveProgramId(loadPrograms(storage), JSON.stringify(selected))).toBe('two')
        expect(loadActiveProgramId(loaded, 'two')).toBe('two')
        expect(loadActiveProgramId(loaded, '"missing"')).toBe('one')
    })

    it('falls back on archive or removal and preserves the unmodified training tree', () => {
        const archived = changeProgram([program, other], 'one', { isArchived: true })
        expect(loadActiveProgramId(archived, '"one"')).toBe('two')
        const deleted = changeProgram(archived, 'two', { isArchived: true, isDeleted: true })
        expect(loadActiveProgramId(deleted, '"two"')).toBe('')
        const restored = changeProgram(deleted, 'one', { isArchived: false })
        expect(loadActiveProgramId(restored, 'one')).toBe('one')
        expect(restored[0].days).toEqual([day])
    })

    it('wraps legacy routines without rewriting data during load', () => {
        const raw = JSON.stringify([day])
        const storage = { getItem: (key: string) => key === 'gymlab_days' ? raw : null }
        const [migrated] = loadPrograms(storage)
        expect(migrated.id).toBe(loadPrograms(storage)[0].id)
        expect(migrated.days).toEqual([day])
        expect(() => loadPrograms({ getItem: () => '{bad' })).toThrow()
    })
})

describe('routine structure', () => {
    it('duplicates only the latest set structure with independent identifiers', () => {
        const legacyDay = { ...day, lastPerformed: '2026-03-04T08:00:00Z' }
        const copy = copyWorkoutDay(legacyDay)
        expect(copy).not.toHaveProperty('lastPerformed')
        expect(copy).toMatchObject({
            name: day.name,
            exercises: [{
                name: 'Press', catalogId: 'bench', notes: 'Ajustar el banco',
                weeks: [{ weekNumber: 1, sets: [{ type: 'warmup', weight: null, reps: null, rir: null }] }],
            }],
        })
        const week = copy.exercises[0].weeks[0]
        expect(week.label).toBeUndefined()
        expect(week.sets[0].notes).toBeUndefined()
        expect([copy.id, copy.exercises[0].id, week.id, week.sets[0].id]).not.toContain('last-set')
        expect(copy.id).not.toBe(day.id)
        expect(copy.exercises[0].id).not.toBe(day.exercises[0].id)
        expect(week.id).not.toBe('latest')
        week.sets[0].weight = 10
        expect(day.exercises[0].weeks[1].sets[0].weight).toBe(80)
    })

    it('keeps removed exercises and days through subsequent edits and reorder', () => {
        const copy = copyWorkoutDay(day)
        const reordered = updateProgramDays({ ...program, days: [day, copy] }, [copy, day])
        expect(getActiveDays(reordered).map(item => item.id)).toEqual([copy.id, day.id])
        const removedExercise = updateProgramDays(reordered, days => days.map(item =>
            item.id === day.id ? { ...item, exercises: [] } : item))
        const removedDay = updateProgramDays(removedExercise, days => days.filter(item => item.id !== day.id))
        const edited = updateProgramDays(removedDay, days => days.map(item => ({ ...item, name: 'Nuevo' })))
        expect(getActiveDays(edited).map(item => item.name)).toEqual(['Nuevo'])
        expect(edited.days.find(item => item.id === day.id)).toMatchObject({
            isDeleted: true, exercises: [{ ...day.exercises[0], isDeleted: true }],
        })
    })
})
