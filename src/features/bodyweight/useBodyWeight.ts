import { useCallback } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { generateId } from '../../utils/helpers'
import type { BodyWeightEntry } from './types'

const STORAGE_KEY = 'gymlab_bodyweight'

function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
}

export function useBodyWeight() {
    const [entries, setEntries] = useLocalStorage<BodyWeightEntry[]>(STORAGE_KEY, [])

    /**
     * Añade o actualiza la entrada del día indicado.
     * Si `date` se omite, usa la fecha de hoy.
     */
    const addOrUpdateEntry = useCallback(
        (weight: number, date: string = todayStr()) => {
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

    // --- Derived values ---

    /** Peso del día de hoy (si existe) */
    const todayEntry = entries.find(e => e.date === todayStr())

    /** Último peso registrado (más reciente) */
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null

    /** Diferencia respecto a hace ~7 días (entrada más cercana entre 5-9 días atrás) */
    const sevenDaysAgo = (() => {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        return d.toISOString().slice(0, 10)
    })()
    const weekAgoEntry = [...entries]
        .reverse()
        .find(e => e.date <= sevenDaysAgo) ?? null

    const weekDelta =
        lastEntry && weekAgoEntry && lastEntry.id !== weekAgoEntry.id
            ? Math.round((lastEntry.weight - weekAgoEntry.weight) * 10) / 10
            : null

    return {
        /** Entradas ordenadas por fecha ascendente */
        entries,
        todayEntry,
        lastEntry,
        weekDelta,
        addOrUpdateEntry,
        deleteEntry,
    }
}
