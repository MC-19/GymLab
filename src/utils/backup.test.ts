import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

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

    it('rejects malformed workout data', () => {
        expect(() => parseBackup(JSON.stringify({ version: 1, days: [{ id: 1 }] }))).toThrow()
    })
})
