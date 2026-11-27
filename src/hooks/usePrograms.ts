import { useCallback, useMemo } from 'react'
import type { TrainingProgram, WorkoutDay } from '../types'
import { isProgram, migrateLegacyDays } from '../utils/backup'
import { generateId } from '../utils/helpers'
import { useLocalStorage } from './useLocalStorage'

const PROGRAMS_KEY = 'gymlab_programs'
const ACTIVE_PROGRAM_KEY = 'gymlab_active_program_id'
const LEGACY_DAYS_KEY = 'gymlab_days'

export function loadPrograms(storage: Pick<Storage, 'getItem'>): TrainingProgram[] {
    const raw = storage.getItem(PROGRAMS_KEY)
    if (raw !== null) {
        const programs: unknown = JSON.parse(raw)
        if (!Array.isArray(programs) || !programs.every(isProgram)) throw new Error('Programas guardados inválidos')
        return programs
    }

    const legacyRaw = storage.getItem(LEGACY_DAYS_KEY)
    if (legacyRaw === null) return []
    const days = migrateLegacyDays(JSON.parse(legacyRaw))
    if (days.length === 0) return []
    return [{
        // A stable ID keeps legacy rotation linked even if the first save fails.
        id: 'legacy-program',
        name: 'Mi programa',
        createdAt: new Date().toISOString(),
        isArchived: false,
        days,
    }]
}

export function loadActiveProgramId(programs: TrainingProgram[], stored: string | null): string {
    let decoded: unknown
    if (stored !== null) {
        try {
            decoded = JSON.parse(stored)
        } catch {
            decoded = stored
        }
    }
    return resolveActiveProgramId(programs, typeof decoded === 'string' ? decoded : stored)
}

export function resolveActiveProgramId(programs: TrainingProgram[], requested: string | null): string {
    const available = programs.filter(program => !program.isArchived && !program.isDeleted)
    return available.find(program => program.id === requested)?.id ?? available[0]?.id ?? ''
}

export function changeProgram(
    programs: TrainingProgram[], id: string,
    updates: Partial<Pick<TrainingProgram, 'name' | 'isArchived' | 'isDeleted'>>,
): TrainingProgram[] {
    return programs.map(program => program.id === id ? { ...program, ...updates } : program)
}

export function getActiveDays(program: TrainingProgram): WorkoutDay[] {
    return program.days.filter(day => !day.isDeleted).map(day => ({
        ...day, exercises: day.exercises.filter(exercise => !exercise.isDeleted),
    }))
}

/** Keep removed entries in the same storage write as the visible routine edit. */
export function updateProgramDays(program: TrainingProgram, updater: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])): TrainingProgram {
    const visibleDays = getActiveDays(program)
    const updated = typeof updater === 'function' ? updater(visibleDays) : updater
    const updatedById = new Map(updated.map(day => [day.id, day]))
    const originalById = new Map(program.days.map(day => [day.id, day]))
    const days = updated.map(day => {
        const previous = originalById.get(day.id)
        if (!previous) return day
        const exerciseIds = new Set(day.exercises.map(exercise => exercise.id))
        return {
            ...day,
            exercises: [
                ...day.exercises,
                ...previous.exercises.filter(exercise => !exerciseIds.has(exercise.id))
                    .map(exercise => ({ ...exercise, isDeleted: true })),
            ],
        }
    })
    for (const previous of program.days) {
        if (!updatedById.has(previous.id)) days.push({ ...previous, isDeleted: true })
    }
    return { ...program, days }
}

export function usePrograms() {
    const [programs, setPrograms] = useLocalStorage<TrainingProgram[]>(
        PROGRAMS_KEY, [], () => loadPrograms(localStorage)
    )
    const [storedId, setActiveProgramIdRaw] = useLocalStorage<string>(
        ACTIVE_PROGRAM_KEY, '', () => loadActiveProgramId(programs, localStorage.getItem(ACTIVE_PROGRAM_KEY))
    )
    const activeProgramId = resolveActiveProgramId(programs, storedId)
    const activeProgram = programs.find(program => program.id === activeProgramId) ?? null
    const days = useMemo(() => activeProgram ? getActiveDays(activeProgram) : [], [activeProgram])

    const setDays = useCallback((updater: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])) => {
        setPrograms(prev => prev.map(program =>
            program.id === activeProgramId ? updateProgramDays(program, updater) : program
        ))
    }, [setPrograms, activeProgramId])

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

    const updateProgram = useCallback((id: string, updates: Partial<Pick<TrainingProgram, 'name' | 'isArchived' | 'isDeleted'>>) => {
        setPrograms(prev => changeProgram(prev, id, updates))
        if ((updates.isArchived || updates.isDeleted) && id === activeProgramId) {
            setActiveProgramIdRaw(resolveActiveProgramId(changeProgram(programs, id, updates), id))
        }
    }, [programs, activeProgramId, setPrograms, setActiveProgramIdRaw])

    const archiveProgram = useCallback((id: string) => {
        updateProgram(id, { isArchived: true })
    }, [updateProgram])

    const deleteProgram = useCallback((id: string) => {
        updateProgram(id, { isArchived: true, isDeleted: true })
    }, [updateProgram])

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
