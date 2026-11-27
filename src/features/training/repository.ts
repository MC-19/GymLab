import { assertCurrentStorageGeneration } from '../../services/storageGeneration'
import { chronological, finishSession, type WorkoutSession } from './session'

const SESSIONS = 'sessions'
const META = 'meta'
const RESTORE = 'restore'
type StorageSnapshot = Record<string, string>
interface RestoreJournal {
    id: string
    previous: StorageSnapshot
}
type SessionEdit = (session: WorkoutSession) => WorkoutSession

export interface TrainingRepository {
    list(): Promise<WorkoutSession[]>
    start(session: WorkoutSession, expectedCompletedCount?: number): Promise<WorkoutSession>
    edit(id: string, edit: SessionEdit): Promise<WorkoutSession>
    finish(id: string): Promise<WorkoutSession>
    cancel(id: string): Promise<void>
}

export class IndexedTrainingRepository implements TrainingRepository {
    private connection?: Promise<IDBDatabase>

    private readonly name: string

    constructor(name = 'gymlab-training') {
        this.name = name
    }

    private open(): Promise<IDBDatabase> {
        if (this.connection) return this.connection
        const connection = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.name, 1)
            let blocked = false
            request.onupgradeneeded = () => {
                const sessions = request.result.createObjectStore(SESSIONS, { keyPath: 'id' })
                sessions.createIndex('status', 'status')
                request.result.createObjectStore(META)
            }
            request.onblocked = () => {
                blocked = true
                reject(new Error('Cierra las otras pestañas de GymLab y vuelve a intentarlo.'))
            }
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const database = request.result
                if (blocked) {
                    database.close()
                    return
                }
                database.onversionchange = () => {
                    database.close()
                    if (this.connection === connection) this.connection = undefined
                }
                resolve(database)
            }
        })
        this.connection = connection
        void connection.catch(() => { if (this.connection === connection) this.connection = undefined })
        return connection
    }

    async close(): Promise<void> {
        const database = await this.connection
        database?.close()
        this.connection = undefined
    }

    // Resolve only after commit. Keep all requests inside IndexedDB callbacks so Safari
    // does not auto-close the transaction between a read and its dependent write.
    private async transaction<T>(
        mode: IDBTransactionMode,
        run: (sessions: IDBObjectStore, meta: IDBObjectStore, result: (value: T) => void, fail: (error: unknown) => void) => void,
    ): Promise<T> {
        const database = await this.open()
        return new Promise((resolve, reject) => {
            const transaction = mode === 'readwrite'
                ? database.transaction([SESSIONS, META], mode, { durability: 'strict' })
                : database.transaction([SESSIONS, META], mode)
            let value: T
            let error: unknown
            const fail = (cause: unknown) => {
                error = cause
                transaction.abort()
            }
            transaction.oncomplete = () => resolve(value)
            transaction.onabort = () => reject(error ?? transaction.error ?? new Error('No se pudo guardar el entrenamiento.'))
            try {
                run(transaction.objectStore(SESSIONS), transaction.objectStore(META), next => { value = next }, fail)
            } catch (cause) {
                fail(cause)
            }
        })
    }

    private mutate<T>(run: (store: IDBObjectStore, result: (value: T) => void, fail: (error: unknown) => void) => void): Promise<T> {
        return this.transaction('readwrite', (store, meta, result, fail) => {
            const pending = meta.get(RESTORE)
            pending.onsuccess = () => {
                if (pending.result) {
                    fail(new Error('Hay una restauración en curso. Recarga antes de entrenar.'))
                    return
                }
                try {
                    if (typeof localStorage !== 'undefined') assertCurrentStorageGeneration(localStorage)
                    run(store, result, fail)
                } catch (error) {
                    fail(error)
                }
            }
        })
    }

    list(): Promise<WorkoutSession[]> {
        return this.transaction('readonly', (sessions, _meta, result) => {
            const request = sessions.getAll()
            request.onsuccess = () => result(request.result)
        })
    }

    start(session: WorkoutSession, expectedCompletedCount?: number): Promise<WorkoutSession> {
        if (session.status !== 'active') return Promise.reject(new Error('El entrenamiento ya está finalizado.'))
        return this.mutate((store, result, fail) => {
            const status = store.index('status')
            const request = status.get('active')
            request.onsuccess = () => {
                const active: WorkoutSession | undefined = request.result
                if (active) {
                    result(active)
                    return
                }
                const create = () => {
                    try {
                        store.add(session)
                        result(session)
                    } catch (error) {
                        fail(error)
                    }
                }
                if (expectedCompletedCount === undefined) {
                    create()
                    return
                }
                const count = status.count('completed')
                count.onsuccess = () => {
                    if (count.result !== expectedCompletedCount) {
                        fail(new Error('La rotación cambió en otra pestaña. Vuelve a intentarlo.'))
                    } else create()
                }
            }
        })
    }

    edit(id: string, edit: SessionEdit): Promise<WorkoutSession> {
        return this.mutate((store, result, fail) => {
            const request = store.get(id)
            request.onsuccess = () => {
                const current: WorkoutSession | undefined = request.result
                if (current?.status !== 'active') {
                    fail(new Error('Este entrenamiento ya no está activo.'))
                    return
                }
                try {
                    const next = edit(current)
                    const saved = { ...next, updatedAt: new Date(Math.max(Date.now(), Date.parse(current.updatedAt))).toISOString() }
                    store.put(saved)
                    result(saved)
                } catch (error) {
                    fail(error)
                }
            }
        })
    }

    finish(id: string): Promise<WorkoutSession> {
        return this.mutate((store, result, fail) => {
            const request = store.getAll()
            request.onsuccess = () => {
                const sessions: WorkoutSession[] = request.result
                const current = sessions.find(session => session.id === id)
                if (!current) {
                    fail(new Error('No se encontró el entrenamiento.'))
                    return
                }
                try {
                    const completed = finishSession(current, chronological(sessions))
                    if (current.status === 'active') store.put(completed)
                    result(completed)
                } catch (error) {
                    fail(error)
                }
            }
        })
    }

    cancel(id: string): Promise<void> {
        return this.mutate((store, result, fail) => {
            const request = store.get(id)
            request.onsuccess = () => {
                const current: WorkoutSession | undefined = request.result
                if (current?.status === 'completed') {
                    fail(new Error('El entrenamiento ya está finalizado.'))
                    return
                }
                if (current) store.delete(id)
                result()
            }
        })
    }

    coordinateRotation<T>(write: () => T): Promise<T> {
        return this.mutate((_store, result) => result(write()))
    }

    backupSnapshot<T>(readStorage: () => T): Promise<{ sessions: WorkoutSession[]; storage: T }> {
        return this.transaction('readonly', (store, meta, result, fail) => {
            const pending = meta.get(RESTORE)
            pending.onsuccess = () => {
                if (pending.result) {
                    fail(new Error('Hay una restauración en curso. Reintenta la copia después.'))
                    return
                }
                const request = store.getAll()
                request.onsuccess = () => {
                    try {
                        result({ sessions: request.result, storage: readStorage() })
                    } catch (error) {
                        fail(error)
                    }
                }
            }
        })
    }

    beginRestore(id: string, readStorage: () => StorageSnapshot): Promise<StorageSnapshot> {
        return this.transaction('readwrite', (_store, meta, result) => {
            const previous = readStorage()
            meta.add({ id, previous } satisfies RestoreJournal, RESTORE)
            result(previous)
        })
    }

    commitRestore(id: string, writeStorage: () => void, sessions?: WorkoutSession[]): Promise<void> {
        return this.transaction('readwrite', (store, meta, result, fail) => {
            const pending = meta.get(RESTORE)
            pending.onsuccess = () => {
                const journal: RestoreJournal | undefined = pending.result
                if (journal?.id !== id) {
                    fail(new Error('Otra pestaña interrumpió la restauración. Vuelve a intentarlo.'))
                    return
                }
                try {
                    if (sessions !== undefined) {
                        store.clear()
                        for (const session of sessions) store.add(session)
                    }
                    writeStorage()
                    meta.delete(RESTORE)
                    result()
                } catch (error) {
                    fail(error)
                }
            }
        })
    }

    recoverRestore(restoreStorage: (previous: StorageSnapshot) => void, id?: string): Promise<void> {
        return this.transaction('readwrite', (_store, meta, result, fail) => {
            const pending = meta.get(RESTORE)
            pending.onsuccess = () => {
                const journal = pending.result as RestoreJournal | StorageSnapshot | undefined
                if (journal && (id === undefined || journal.id === id)) {
                    try {
                        // Earlier Phase 1 builds stored the snapshot directly.
                        const previous = typeof journal.previous === 'object' ? journal.previous : journal as StorageSnapshot
                        restoreStorage(previous)
                        meta.delete(RESTORE)
                    } catch (error) {
                        fail(error)
                        return
                    }
                }
                result()
            }
        })
    }
}

export const trainingRepository = new IndexedTrainingRepository()
