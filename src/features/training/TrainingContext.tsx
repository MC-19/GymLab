/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getActiveDays, loadPrograms } from '../../hooks/usePrograms'
import { getRotationIndex, readRotation } from '../../hooks/useRotation'
import { useWorkoutContext } from '../../context/WorkoutContext'
import type { CompletedSession, TrainingProgram, WorkoutDay } from '../../types'
import { trainingRepository } from './repository'
import { canCompleteSet, chronological, createSession, emptySessionSet, validSetFields, type SessionSet, type SetFields, type WorkoutSession } from './session'

interface TrainingState {
    loading: boolean
    error: string | null
    rotationError: string | null
    active: WorkoutSession | undefined
    history: WorkoutSession[]
    start: (program: TrainingProgram, day: WorkoutDay, followRotation: boolean) => Promise<WorkoutSession>
    changeSet: (id: string, exerciseId: string, setId: string, fields: Partial<SetFields>) => Promise<void>
    markSet: (id: string, exerciseId: string, setId: string, completed: boolean) => Promise<boolean>
    addSet: (id: string, exerciseId: string) => Promise<void>
    finish: (id: string) => Promise<WorkoutSession>
    cancel: (id: string) => Promise<void>
}

const TrainingContext = createContext<TrainingState | null>(null)
const rotationFailure = 'No se pudo guardar la rotación. Los entrenamientos guardados se conservan. Libera espacio si es necesario y recarga GymLab.'

function receipt(session: WorkoutSession): CompletedSession {
    return {
        id: session.id, programId: session.programId, programName: session.programName,
        dayId: session.dayId, dayName: session.dayName, completedAt: session.completedAt!,
    }
}

export function TrainingProvider({ children }: { children: ReactNode }) {
    const { recordTrainingCompletions } = useWorkoutContext()
    const [sessions, setSessions] = useState<WorkoutSession[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [rotationError, setRotationError] = useState<string | null>(null)
    const channel = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        let mounted = true
        let request = 0
        const refresh = async () => {
            const currentRequest = ++request
            try {
                const items = await trainingRepository.list()
                if (!mounted || currentRequest !== request) return
                setSessions(items)
                setError(null)
                try {
                    await recordTrainingCompletions(chronological(items).reverse().map(receipt))
                    if (mounted && currentRequest === request) setRotationError(null)
                } catch {
                    if (mounted && currentRequest === request) setRotationError(rotationFailure)
                }
            } catch {
                if (mounted && currentRequest === request) setError('No se pudo abrir el historial local. Recarga la aplicación para reintentar.')
            }
        }
        const onVisible = () => {
            if (!document.hidden) void refresh()
        }
        if (typeof BroadcastChannel !== 'undefined') {
            channel.current = new BroadcastChannel('gymlab-training')
            channel.current.onmessage = () => void refresh()
        }
        void refresh()
        window.addEventListener('focus', onVisible)
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            mounted = false
            channel.current?.close()
            channel.current = null
            window.removeEventListener('focus', onVisible)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [recordTrainingCompletions])

    const save = (session: WorkoutSession) => {
        setSessions(previous => [...(previous ?? []).filter(item => item.id !== session.id), session])
        channel.current?.postMessage('changed')
    }
    const edit = async (id: string, exerciseId: string, change: (sets: SessionSet[]) => SessionSet[]) => {
        const next = await trainingRepository.edit(id, session => ({
            ...session,
            exercises: session.exercises.map(exercise =>
                exercise.id === exerciseId ? { ...exercise, sets: change(exercise.sets) } : exercise),
        }))
        save(next)
        return next
    }

    return (
        <TrainingContext.Provider value={{
            loading: sessions === null && error === null,
            error,
            rotationError,
            active: sessions?.find(session => session.status === 'active'),
            history: chronological(sessions ?? []),
            start: async (program, day, followRotation) => {
                const items = await trainingRepository.list()
                const completed = chronological(items)
                try {
                    await recordTrainingCompletions(completed.slice().reverse().map(receipt))
                    setRotationError(null)
                } catch {
                    setRotationError(rotationFailure)
                    throw new Error(rotationFailure)
                }
                if (followRotation && !items.some(item => item.status === 'active')) {
                    const latest = loadPrograms(localStorage).find(item =>
                        item.id === program.id && !item.isArchived && !item.isDeleted)
                    const days = latest ? getActiveDays(latest) : []
                    const rotation = readRotation(localStorage, program.id, latest ? [latest] : [])
                    if (days[getRotationIndex(rotation, program.id, days)]?.id !== day.id) {
                        throw new Error('La rotación cambió. Vuelve a intentarlo desde Inicio.')
                    }
                }
                const session = await trainingRepository.start(createSession(program, day), followRotation ? completed.length : undefined)
                save(session)
                return session
            },
            changeSet: async (id, exerciseId, setId, fields) => {
                await edit(id, exerciseId, sets => sets.map(set => {
                    if (set.id !== setId) return set
                    const updated = { ...set, ...fields }
                    if (!validSetFields(updated)) throw new Error('Revisa los valores de la serie.')
                    return { ...updated, completed: set.completed && canCompleteSet(updated) }
                }))
            },
            markSet: async (id, exerciseId, setId, completed) => {
                let changed = false
                await edit(id, exerciseId, sets => sets.map(set => {
                    if (set.id !== setId || set.completed === completed) return set
                    if (completed && !canCompleteSet(set)) throw new Error('Indica el peso y las repeticiones de la serie.')
                    changed = true
                    return { ...set, completed }
                }))
                return changed && completed
            },
            addSet: async (id, exerciseId) => {
                const set = emptySessionSet()
                await edit(id, exerciseId, sets => [...sets, set])
            },
            finish: async id => {
                const completed = await trainingRepository.finish(id)
                try {
                    const items = await trainingRepository.list()
                    await recordTrainingCompletions(chronological(items).reverse().map(receipt))
                    setRotationError(null)
                } catch {
                    // IndexedDB already committed. Keep the summary and replay on the next refresh.
                    setRotationError(rotationFailure)
                }
                save(completed)
                return completed
            },
            cancel: async id => {
                await trainingRepository.cancel(id)
                setSessions(previous => previous?.filter(session => session.id !== id) ?? [])
                channel.current?.postMessage('changed')
            },
        }}>
            {children}
        </TrainingContext.Provider>
    )
}

export function useTraining(): TrainingState {
    const context = useContext(TrainingContext)
    if (!context) throw new Error('TrainingProvider is missing')
    return context
}
