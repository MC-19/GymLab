import { generateId } from '../../utils/helpers'
import { assertCurrentStorageGeneration, initializeStorageGeneration, STORAGE_GENERATION_KEY } from '../../services/storageGeneration'
import { isWorkoutState, readGymLabStorage, replaceGymLabStorage } from '../../utils/backup'
import { trainingRepository, type IndexedTrainingRepository } from './repository'
import type { WorkoutSession } from './session'

const LOCK = 'gymlab-training-restore'
let pending: Promise<unknown> = Promise.resolve()

async function withRestoreLock<T>(operation: () => Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(LOCK, operation)
    const next = pending.then(operation)
    pending = next.catch(() => undefined)
    return next
}

export class TrainingRecoveryError extends Error {}

async function recover(storage: Storage, repository: IndexedTrainingRepository, id?: string): Promise<void> {
    await repository.recoverRestore(previous => {
        try {
            replaceGymLabStorage(storage, previous)
        } catch (cause) {
            throw new TrainingRecoveryError('No se pudo recuperar la copia anterior.', { cause })
        }
    }, id)
}

function storedRotation(raw: string | undefined) {
    try {
        const value: unknown = raw === undefined ? {} : JSON.parse(raw)
        if (isWorkoutState(value)) return value
    } catch {
        // An earlier invalid local record must not prevent restoring a validated backup.
    }
    return {}
}

function keepAppliedTrainingReceipts(
    previous: Record<string, string>, replacement: Record<string, string>, sessions: WorkoutSession[],
): Record<string, string> {
    const ids = new Set(sessions.filter(session => session.status === 'completed').map(session => session.id))
    const applied = storedRotation(previous.gymlab_state).sessions?.filter(session => ids.has(session.id)) ?? []
    if (!applied.length) return replacement
    const rotation = storedRotation(replacement.gymlab_state)
    const restored = rotation.sessions ?? []
    const restoredIds = new Set(restored.map(session => session.id))
    return { ...replacement, gymlab_state: JSON.stringify({
        ...rotation,
        sessions: [...restored, ...applied.filter(session => !restoredIds.has(session.id))],
    }) }
}

/** Run before React reads the localStorage configuration. */
export function recoverTrainingRestore(storage: Storage, repository = trainingRepository): Promise<void> {
    return withRestoreLock(() => recover(storage, repository))
}

export function restoreTrainingBackup(
    storage: Storage,
    replacement: Record<string, string>,
    sessions?: WorkoutSession[],
    repository = trainingRepository,
): Promise<void> {
    return withRestoreLock(async () => {
        await recover(storage, repository)
        assertCurrentStorageGeneration(storage)
        const id = generateId()
        const previous = await repository.beginRestore(id, () => {
            assertCurrentStorageGeneration(storage)
            return readGymLabStorage(storage)
        })
        try {
            // v1/v2 restore the planned rotation while keeping Training sessions.
            const next = sessions === undefined
                ? keepAppliedTrainingReceipts(previous, replacement, await repository.list())
                : replacement
            await repository.commitRestore(id, () => {
                assertCurrentStorageGeneration(storage)
                replaceGymLabStorage(storage, next)
                // Fence stale tabs before this transaction can release its write lock.
                storage.setItem(STORAGE_GENERATION_KEY, id)
            }, sessions)
        } catch (error) {
            // Session writes are atomic. A failed commit leaves the old sessions
            // and the journal available for another recovery attempt on startup.
            await recover(storage, repository, id)
            if (storage.getItem(STORAGE_GENERATION_KEY) === id) initializeStorageGeneration(storage)
            throw error
        }
    })
}
