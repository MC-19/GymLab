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
            const ids = [...new Set([...orderedIds, ...daysById.keys()])]
            return ids.flatMap(id => {
                const day = daysById.get(id)
                return day ? [day] : []
            }).map((day, order) => ({ ...day, order }))
        })
    }, [setDays])

    const duplicateDay = useCallback((dayId: string) => {
        const day = days.find(item => item.id === dayId)
        if (!day) return undefined

        const copy = copyWorkoutDay(day)
        setDays(previous => [...previous, { ...copy, order: previous.length }])
        return copy
    }, [days, setDays])

    const replaceDay = useCallback((dayId: string, source: WorkoutDay) => {
        const original = days.find(day => day.id === dayId)
        if (!original) return
        const replacement = { ...copyWorkoutDay(source), order: original.order }
        setDays(previous => previous.flatMap(day => day.id === dayId
            ? [replacement, { ...day, isDeleted: true, replacedByDayId: replacement.id }]
            : [day]))
        return replacement
    }, [days, setDays])

    return { addDay, updateDay, deleteDay, reorderDays, duplicateDay, replaceDay }
}
