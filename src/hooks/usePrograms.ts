import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { TrainingProgram, WorkoutDay } from '../types'
import { generateId } from '../utils/helpers'

const PROGRAMS_KEY = 'gymlab_programs'
const ACTIVE_PROGRAM_KEY = 'gymlab_active_program_id'
const LEGACY_DAYS_KEY = 'gymlab_days'

// ── Migration from legacy gymlab_days ──────────────────────────────────────────
function loadPrograms(): TrainingProgram[] {
    try {
        // If new format already exists, use it
        const raw = localStorage.getItem(PROGRAMS_KEY)
        if (raw) return JSON.parse(raw) as TrainingProgram[]

        // Migration: wrap existing days into a default program
        const legacyRaw = localStorage.getItem(LEGACY_DAYS_KEY)
        if (legacyRaw) {
            const legacyDays = JSON.parse(legacyRaw) as WorkoutDay[]
            if (Array.isArray(legacyDays) && legacyDays.length > 0) {
                const defaultProgram: TrainingProgram = {
                    id: generateId(),
                    name: 'Mi programa',
                    createdAt: new Date().toISOString(),
                    isArchived: false,
                    days: legacyDays,
                }
                // Persist immediately so migration runs only once
                localStorage.setItem(PROGRAMS_KEY, JSON.stringify([defaultProgram]))
                localStorage.setItem(ACTIVE_PROGRAM_KEY, defaultProgram.id)
                return [defaultProgram]
            }
        }

        return []
    } catch {
        return []
    }
}

function loadActiveProgramId(programs: TrainingProgram[]): string {
    try {
        const stored = localStorage.getItem(ACTIVE_PROGRAM_KEY)
        if (stored && programs.some(p => p.id === stored)) return stored
        // Fallback: first non-archived
        const first = programs.find(p => !p.isArchived)
        return first?.id ?? ''
    } catch {
        return ''
    }
}

export function usePrograms() {
    const [programs, setPrograms] = useLocalStorage<TrainingProgram[]>(
        PROGRAMS_KEY,
        [],
        loadPrograms
    )

    const [activeProgramId, setActiveProgramIdRaw] = useLocalStorage<string>(
        ACTIVE_PROGRAM_KEY,
        '',
        () => loadActiveProgramId(programs)
    )

    const activeProgram = programs.find(p => p.id === activeProgramId) ?? null
    const days: WorkoutDay[] = activeProgram?.days ?? []

    /** Update a program's days array (used by useWorkout to persist changes) */
    const setDays = useCallback((updater: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])) => {
        setPrograms(prev => prev.map(p => {
            if (p.id !== activeProgramId) return p
            const newDays = typeof updater === 'function' ? updater(p.days) : updater
            return { ...p, days: newDays }
        }))
    }, [setPrograms, activeProgramId])

    /** Set the active program (also switches the context's days) */
    const setActiveProgram = useCallback((id: string) => {
        setActiveProgramIdRaw(id)
    }, [setActiveProgramIdRaw])

    /** Create a new program and set it as active */
    const createProgram = useCallback((name: string): TrainingProgram => {
        const newProgram: TrainingProgram = {
            id: generateId(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            isArchived: false,
            days: [],
        }
        setPrograms(prev => [...prev, newProgram])
        setActiveProgramIdRaw(newProgram.id)
        return newProgram
    }, [setPrograms, setActiveProgramIdRaw])

    /**
     * Create a program with its initial days in one atomic state update.
     * Use this during onboarding to avoid timing issues between createProgram + addDay.
     */
    const createProgramWithDays = useCallback((name: string, dayNames: string[]): TrainingProgram => {
        const days: WorkoutDay[] = dayNames.map((dayName, i) => ({
            id: generateId(),
            name: dayName,
            exercises: [],
            createdAt: new Date().toISOString(),
            order: i,
        }))
        const newProgram: TrainingProgram = {
            id: generateId(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            isArchived: false,
            days,
        }
        setPrograms(prev => [...prev, newProgram])
        setActiveProgramIdRaw(newProgram.id)
        return newProgram
    }, [setPrograms, setActiveProgramIdRaw])

    /** Rename a program */
    const updateProgram = useCallback((id: string, updates: Partial<Pick<TrainingProgram, 'name' | 'isArchived'>>) => {
        setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    }, [setPrograms])

    /** Archive (or restore) a program */
    const archiveProgram = useCallback((id: string) => {
        setPrograms(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, isArchived: true } : p)
            // If we archived the active one, switch to another active
            if (id === activeProgramId) {
                const next = updated.find(p => !p.isArchived)
                if (next) setActiveProgramIdRaw(next.id)
                else setActiveProgramIdRaw('')
            }
            return updated
        })
    }, [setPrograms, activeProgramId, setActiveProgramIdRaw])

    /** Delete a program permanently */
    const deleteProgram = useCallback((id: string) => {
        setPrograms(prev => {
            const updated = prev.filter(p => p.id !== id)
            if (id === activeProgramId) {
                const next = updated.find(p => !p.isArchived)
                if (next) setActiveProgramIdRaw(next.id)
                else setActiveProgramIdRaw('')
            }
            return updated
        })
    }, [setPrograms, activeProgramId, setActiveProgramIdRaw])

    return {
        programs,
        activeProgramId,
        activeProgram,
        days,
        setDays,
        setActiveProgram,
        createProgram,
        createProgramWithDays,
        updateProgram,
        archiveProgram,
        deleteProgram,
    }
}
