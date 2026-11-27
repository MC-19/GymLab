import { useCallback } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { localDateKey } from '../../utils/dates'
import { getWeightSummary } from './weightDates'
import { isBodyWeightEntry } from '../../utils/backup'
import { generateId } from '../../utils/helpers'
import type { BodyWeightEntry } from './types'

const STORAGE_KEY = 'gymlab_bodyweight'

export function useBodyWeight() {
    const [entries, setEntries] = useLocalStorage<BodyWeightEntry[]>(STORAGE_KEY, [], () => {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return []
        const stored: unknown = JSON.parse(raw)
        if (!Array.isArray(stored) || !stored.every(isBodyWeightEntry)) throw new Error('Pesos guardados inválidos')
        return stored
    })

    /**
     * Añade o actualiza la entrada del día indicado.
     * Si `date` se omite, usa la fecha de hoy.
     */
    const addOrUpdateEntry = useCallback(
        (weight: number, date: string = localDateKey()) => {
            if (!Number.isFinite(weight) || weight <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > localDateKey()) return
            const [year, month, day] = date.split('-').map(Number)
            if (localDateKey(new Date(year, month - 1, day)) !== date) return
            setEntries(prev => {
                const exists = prev.some(e => e.date === date)
                const updated = exists
                    ? prev.map(e => e.date === date ? { ...e, weight } : e)
                    : [...prev, { id: generateId(), date, weight }]
                return updated.sort((a, b) => a.date.localeCompare(b.date))
            })
        },
        [setEntries],
    )

    const deleteEntry = useCallback(
        (id: string) => setEntries(prev => prev.filter(e => e.id !== id)),
        [setEntries],
    )

    const sortedEntries = entries.slice().sort((a, b) => a.date.localeCompare(b.date))

    return {
        entries: sortedEntries,
        ...getWeightSummary(sortedEntries),
        addOrUpdateEntry,
        deleteEntry,
    }
}
