import { useCallback } from 'react'
import type { WorkoutDay } from '../types'
import { copyWorkoutDay, generateId } from '../utils/helpers'
import type { SetDays } from './workoutTypes'

export function useWorkoutDays(days: WorkoutDay[], setDays: SetDays) {
    const addDay = useCallback((name: string) => {
        const newDay: WorkoutDay = {
            id: generateId(),
            name,
            exercises: [],
            createdAt: new Date().toISOString(),
            order: days.length,
        }
        setDays(previous => [...previous, newDay])
        return newDay
    }, [days.length, setDays])

    const updateDay = useCallback((dayId: string, updates: Partial<WorkoutDay>) => {
        setDays(previous => previous.map(day => day.id === dayId ? { ...day, ...updates } : day))
    }, [setDays])

    const deleteDay = useCallback((dayId: string) => {
        setDays(previous => previous.filter(day => day.id !== dayId))
    }, [setDays])

    const reorderDays = useCallback((orderedIds: string[]) => {
        setDays(previous => {
            const daysById = new Map(previous.map(day => [day.id, day]))
            return orderedIds.map((id, order) => ({ ...daysById.get(id)!, order }))
        })
    }, [setDays])

    const duplicateDay = useCallback((dayId: string) => {
        const day = days.find(item => item.id === dayId)
        if (!day) return undefined

        const copy = copyWorkoutDay(day)
        setDays(previous => [...previous, copy])
        return copy
    }, [days, setDays])

    return { addDay, updateDay, deleteDay, reorderDays, duplicateDay }
}
