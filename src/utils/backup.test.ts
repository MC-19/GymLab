import { describe, expect, it } from 'vitest'
import { backupToStorage, migrateLegacySessions, parseBackup, readGymLabStorage, replaceGymLabStorage } from './backup'
import { loadActiveProgramId, loadPrograms } from '../hooks/usePrograms'
import { parseWorkoutState } from '../hooks/useRotation'

const day = { id: 'day-1', name: 'Día A', createdAt: '2026-01-01', order: 0, exercises: [] }
const program = { id: 'program-1', name: 'Programa', createdAt: '2026-01-01', isArchived: false, days: [day] }

describe('backup validation', () => {
    it('accepts a valid v2 backup', () => {
        const backup = parseBackup(JSON.stringify({
            version: 2,
            days: [day],
            localStorage: { gymlab_programs: JSON.stringify([program]) },
        }))
        expect(backup.version).toBe(2)
    })

    it('rejects foreign storage keys and malformed programs', () => {
        expect(() => parseBackup(JSON.stringify({
            version: 2,
            days: [day],
            localStorage: { gymlab_programs: '[]', foreign_key: 'value' },
        }))).toThrow('claves no permitidas')

        expect(() => parseBackup(JSON.stringify({
            version: 2,
            days: [day],
            localStorage: { gymlab_programs: '[{"id":1}]' },
        }))).toThrow('programas')
    })

    it('rejects an empty v2 container but accepts an explicitly empty program list', () => {
        expect(() => parseBackup(JSON.stringify({ version: 2, days: [], localStorage: {} })))
            .toThrow('programas ni rutinas')
        expect(parseBackup(JSON.stringify({ version: 2, days: [], localStorage: { gymlab_programs: '[]' } })))
            .toMatchObject({ localStorage: { gymlab_programs: '[]' } })
    })

    it('rejects malformed workout data', () => {
        expect(() => parseBackup(JSON.stringify({ version: 1, days: [{ id: 1 }] }))).toThrow()
    })
})

describe('restore and migration', () => {
    const fakeStorage = (initial: Record<string, string>, failKey?: string): Storage => {
        const values = new Map(Object.entries(initial))
        return {
            get length() { return values.size },
            key: index => [...values.keys()][index] ?? null,
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => {
                if (key === failKey) throw new DOMException('Sin espacio', 'QuotaExceededError')
                values.set(key, value)
            },
            removeItem: key => { values.delete(key) },
            clear: () => values.clear(),
        }
    }

    it('restores legacy backups and preserves day IDs, series and dates', () => {
        const legacy = parseBackup(JSON.stringify({ days: [day] }))
        const storage = fakeStorage({})
        replaceGymLabStorage(storage, backupToStorage(legacy, 'new-program', '2026-04-01'))
        const programs = loadPrograms(storage)
        expect(programs[0].days).toEqual([day])
        expect(loadActiveProgramId(programs, storage.getItem('gymlab_active_program_id'))).toBe('new-program')
    })

    it('migrates the original flat exercise format without changing historical identifiers or dates', () => {
        const completedAt = '2026-02-01T13:00:00Z'
        const days = [{ ...day, exercises: [{
            id: 'old-ex', name: 'Press', sets: [{ id: 'old-set', weight: 60, reps: 9, rir: '', completedAt }],
        }] }]
        const oldSession = { id: 'old-session', dayId: day.id, dayName: day.name, date: completedAt, exercises: days[0].exercises }
        const storage = fakeStorage({ gymlab_days: JSON.stringify(days), gymlab_sessions: JSON.stringify([oldSession]) })
        const fromDisk = loadPrograms(storage)[0].days
        const fromBackup = parseBackup(JSON.stringify({ days })).days
        expect(fromDisk).toEqual(fromBackup)
        expect(fromBackup[0].exercises[0].weeks[0].sets[0]).toMatchObject({
            id: 'old-set', weight: 60, reps: 9, rir: null, completedAt,
        })
        expect(migrateLegacySessions([oldSession])).toEqual([{ ...oldSession, completedAt }])
    })

    it('round trips archived and removed records, selected ID, and rotation through v2', () => {
        const archived = { ...program, id: 'archive', isArchived: true, days: [{ ...day, isDeleted: true }] }
        const programs = JSON.stringify([archived, program])
        const rotation = JSON.stringify({
            version: 2, currentDayIndexByProgram: { 'program-1': 0 },
            currentDayIdByProgram: { 'program-1': 'day-1' },
            sessions: [{ id: 'session', programId: 'archive', dayId: 'day-1', completedAt: '2026-03-04T08:00:00Z' }],
        })
        const imported = parseBackup(JSON.stringify({
            version: 2, days: [day],
            localStorage: { gymlab_programs: programs, gymlab_active_program_id: 'program-1', gymlab_state: rotation },
        }))
        const storage = fakeStorage({ external: 'keep', gymlab_theme: '"dark"' })
        replaceGymLabStorage(storage, backupToStorage(imported, '', ''))
        expect(loadPrograms(storage)).toEqual([archived, program])
        expect(loadActiveProgramId(loadPrograms(storage), storage.getItem('gymlab_active_program_id'))).toBe('program-1')
        expect(parseWorkoutState(storage.getItem('gymlab_state')).sessions[0].programId).toBe('archive')
        expect(storage.getItem('external')).toBe('keep')
        expect(storage.getItem('gymlab_theme')).toBeNull()
    })

    it('rejects invalid secondary keys before writing and restores data when a write fails', () => {
        const previous = { gymlab_programs: JSON.stringify([program]), gymlab_theme: '"dark"' }
        const storage = fakeStorage(previous, 'gymlab_bodyweight')
        expect(() => parseBackup(JSON.stringify({
            version: 2, days: [day],
            localStorage: { ...previous, gymlab_state: '{"sessions":[{"id":"bad"}]}' },
        }))).toThrow('rotación')
        expect(() => parseBackup(JSON.stringify({
            version: 2, days: [day],
            localStorage: { ...previous, gymlab_bodyweight: '[null]' },
        }))).toThrow('peso corporal')
        expect(() => replaceGymLabStorage(storage, {
            gymlab_programs: '[]', gymlab_bodyweight: '[]',
        })).toThrow()
        expect(readGymLabStorage(storage)).toEqual(previous)
    })
})
