import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeStorageGeneration, STORAGE_GENERATION_KEY } from '../../services/storageGeneration'
import type { TrainingProgram, WorkoutDay } from '../../types'
import { advanceRotation, parseWorkoutState, reconcileTrainingCompletions, writeRotation } from '../../hooks/useRotation'
import { backupToStorage, parseBackup, readGymLabStorage } from '../../utils/backup'
import { recoverTrainingRestore, restoreTrainingBackup } from './backup'
import { IndexedTrainingRepository } from './repository'
import { DEFAULT_GOALS } from '../programs/goals'
import { chronological, createSession, emptySessionSet, previousExercise, recommendedIncrement, summarizeSession, type WorkoutSession } from './session'

const day: WorkoutDay = {
    id: 'a', name: 'Torso', order: 0, createdAt: '2024-01-01',
    exercises: [{
        id: 'press', catalogId: 'bench', name: 'Press banca',
        weeks: [{ id: 'old-week', weekNumber: 7, sets: [
            { id: 'old-set', type: 'warmup', weight: 70, reps: 6, rir: 2 },
            { id: 'old-effective', weight: 95, reps: 5, rir: 1 },
        ] }],
    }],
}
const second: WorkoutDay = { ...day, id: 'b', name: 'Pierna', order: 1 }
const program: TrainingProgram = { id: 'program', name: 'Fuerza', createdAt: day.createdAt, isArchived: false, days: [day, second] }

class MemoryStorage implements Storage {
    private values = new Map<string, string>()
    failValue?: string
    get length() { return this.values.size }
    key(index: number) { return [...this.values.keys()][index] ?? null }
    getItem(key: string) { return this.values.get(key) ?? null }
    setItem(key: string, value: string) {
        if (value === this.failValue) throw new DOMException('Sin espacio', 'QuotaExceededError')
        this.values.set(key, value)
    }
    removeItem(key: string) { this.values.delete(key) }
    clear() { this.values.clear() }
}

const log = (session: WorkoutSession, weight: number) => ({
    ...session,
    exercises: session.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map((set, i) => ({
            ...set, weight: i ? weight : 40, reps: i ? 5 : 8, rir: 2, completed: true,
        })),
    })),
})

describe('GymLab Training persistence', () => {
    let repository: IndexedTrainingRepository
    let name: string
    beforeEach(() => {
        name = `training-${crypto.randomUUID()}`
        repository = new IndexedTrainingRepository(name)
    })
    afterEach(async () => {
        await repository.close()
    })

    it('commits each edit, recovers the same draft after reopening, and allows only one draft across connections', async () => {
        const planned = createSession(program, day)
        const other = new IndexedTrainingRepository(name)
        try {
            const [first, recovered] = await Promise.all([repository.start(planned), other.start(createSession(program, second))])
            expect(first.id).toBe(recovered.id)
            expect(first.exercises[0].sets[0]).toMatchObject({ type: 'warmup', weight: null, reps: null, rir: null })
            await Promise.all([
                repository.edit(first.id, draft => log(draft, 100)),
                other.edit(first.id, draft => ({ ...draft, dayName: 'Nombre conservado' })),
            ])
        } finally {
            await other.close()
        }
        await repository.close()
        repository = new IndexedTrainingRepository(name)
        const [restored] = await repository.list()
        expect(restored.exercises[0].sets[1]).toMatchObject({ weight: 100, reps: 5, rir: 2, completed: true })
        expect(restored.status).toBe('active')
        expect(day.exercises[0].weeks[0].sets[1].weight).toBe(95)
    })

    it('rejects empty completion, cancels without history, and snapshots completed rows independently of planning', async () => {
        const draft = await repository.start(createSession(program, day))
        await expect(repository.finish(draft.id)).rejects.toThrow('al menos una serie')
        expect((await repository.list())[0].status).toBe('active')
        await repository.cancel(draft.id)
        expect(await repository.list()).toEqual([])

        const fresh = await repository.start(createSession(program, day, new Date('2025-01-02T12:00:00Z')))
        await repository.edit(fresh.id, item => log(item, 100))
        const done = await repository.finish(fresh.id)
        expect(summarizeSession(done)).toMatchObject({ exercises: 1, sets: 2, volume: 500 })
        expect(await repository.finish(fresh.id)).toEqual(done)
        await expect(repository.cancel(fresh.id)).rejects.toThrow('finalizado')
        await expect(repository.edit(fresh.id, item => log(item, 120))).rejects.toThrow('ya no está activo')
        expect((await repository.list())[0].exercises[0].name).toBe('Press banca')
    })

    it('rejects a stale start from the rotation after another connection completes a session', async () => {
        const draft = await repository.start(createSession(program, day))
        const other = new IndexedTrainingRepository(name)
        try {
            await other.edit(draft.id, item => log(item, 100))
            await other.finish(draft.id)
            await expect(repository.start(createSession(program, day), 0)).rejects.toThrow('rotación cambió')
            expect((await repository.list()).map(item => item.status)).toEqual(['completed'])
            await expect(repository.start(createSession(program, second), 1)).resolves.toMatchObject({ dayId: second.id })
        } finally {
            await other.close()
        }
    })

    it('orders history, reuses the latest result and sets a personal record on improvement', async () => {
        const first = await repository.start(createSession(program, day))
        await repository.edit(first.id, item => log(item, 90))
        const completed = await repository.finish(first.id)
        const renamed = { ...second, exercises: [{ ...day.exercises[0], id: 'different-id', name: 'Banca' }] }
        const next = await repository.start(createSession(program, renamed))
        expect(previousExercise(next.exercises[0], [completed])?.sets[1].weight).toBe(90)
        await repository.edit(next.id, item => log(item, 95))
        const record = await repository.finish(next.id)
        expect(record.records).toEqual([next.exercises[0].id])
        expect(chronological([{ ...completed, completedAt: '2024-01-01T00:00:00Z' }, record])[0].id).toBe(record.id)
    })

    it('round trips a completed session and an active draft, while legacy backups preserve IndexedDB', async () => {
        const first = await repository.start(createSession(program, day))
        await repository.edit(first.id, item => log(item, 100))
        const done = await repository.finish(first.id)
        const active = await repository.start(createSession(program, second))
        const storage = new MemoryStorage()
        storage.setItem('gymlab_programs', JSON.stringify([program]))
        const snapshot = { version: 3, days: [day], localStorage: readGymLabStorage(storage), trainingSessions: await repository.list() }
        await restoreTrainingBackup(storage, {}, [], repository)
        expect(await repository.list()).toEqual([])
        const parsed = parseBackup(JSON.stringify(snapshot))
        await restoreTrainingBackup(storage, backupToStorage(parsed, '', ''), parsed.trainingSessions, repository)
        expect(await repository.list()).toEqual(expect.arrayContaining([done, active]))
        const legacy = parseBackup(JSON.stringify({ days: [day] }))
        await restoreTrainingBackup(storage, backupToStorage(legacy, 'import', '2024-01-01'), legacy.trainingSessions, repository)
        expect(await repository.list()).toEqual(expect.arrayContaining([done, active]))
        expect(legacy.days[0].exercises[0].weeks[0]).not.toHaveProperty('completedAt')
        expect(() => parseBackup(JSON.stringify({ ...snapshot, trainingSessions: [active, { ...active, id: 'other' }] }))).toThrow('inválidas')
    })

    it('keeps skipped working slots and historical goals through IndexedDB and a v3 restore', async () => {
        const goals = { ...DEFAULT_GOALS, sets: 2 }
        const plannedDay = { ...day, exercises: [{ ...day.exercises[0], goals }] }
        const draft = await repository.start(createSession(program, plannedDay))
        await repository.edit(draft.id, session => ({
            ...session,
            exercises: session.exercises.map(exercise => ({
                ...exercise,
                sets: [...exercise.sets, emptySessionSet()].map((set, i) => i === 1 || i === 3
                    ? { ...set, weight: 80, reps: 12, rir: 2, completed: true }
                    : set),
            })),
        }))
        const done = await repository.finish(draft.id)
        expect(done.exercises[0].sets.map(set => set.workingOrder)).toEqual([1, 3])
        expect(recommendedIncrement(goals, done.exercises[0].sets)).toBeNull()

        const updatedDay = { ...plannedDay, exercises: [{ ...plannedDay.exercises[0], goals: { ...goals, sets: 4 } }] }
        const snapshot = {
            version: 3, days: [updatedDay],
            localStorage: { gymlab_programs: JSON.stringify([{ ...program, days: [updatedDay] }]) },
            trainingSessions: await repository.list(),
        }
        const storage = new MemoryStorage()
        const parsed = parseBackup(JSON.stringify(snapshot))
        await restoreTrainingBackup(storage, {}, [], repository)
        await restoreTrainingBackup(storage, backupToStorage(parsed, '', ''), parsed.trainingSessions, repository)
        const [restored] = await repository.list()
        expect(restored).toEqual(done)
        expect(restored.exercises[0].goals?.sets).toBe(2)
        expect(recommendedIncrement(goals, restored.exercises[0].sets)).toBeNull()

        snapshot.trainingSessions[0].exercises[0].sets[1].workingOrder = 1
        expect(() => parseBackup(JSON.stringify(snapshot))).toThrow('sesiones de entrenamiento inválidas')
    })

    it('preserves the imported rotation when keeping existing Training sessions from a legacy backup', async () => {
        const session = await repository.start(createSession(program, day))
        await repository.edit(session.id, item => log(item, 100))
        const done = await repository.finish(session.id)
        const receipt = { id: done.id, dayId: done.dayId, programId: done.programId, completedAt: done.completedAt! }
        const storage = new MemoryStorage()
        storage.setItem('gymlab_state', JSON.stringify(reconcileTrainingCompletions(parseWorkoutState(null), [program], [receipt])))
        await restoreTrainingBackup(storage, {
            gymlab_state: JSON.stringify({ version: 2, currentDayIndexByProgram: { program: 0 }, sessions: [] }),
        }, undefined, repository)
        const restored = parseWorkoutState(storage.getItem('gymlab_state'))
        expect(restored.currentDayIndexByProgram[program.id]).toBe(0)
        expect(reconcileTrainingCompletions(restored, [program], [receipt])).toBe(restored)
        expect(await repository.list()).toEqual([done])
    })

    it('rolls back a restore write failure and recovers an interrupted restore before reading preferences', async () => {
        const storage = new MemoryStorage()
        storage.setItem('gymlab_theme', '"dark"')
        const draft = await repository.start(createSession(program, day))
        const previous = readGymLabStorage(storage)
        storage.failValue = '"light"'
        await expect(restoreTrainingBackup(storage, { gymlab_theme: '"light"' }, [], repository)).rejects.toThrow()
        expect(readGymLabStorage(storage)).toEqual(previous)
        expect(await repository.list()).toEqual([draft])
        await expect(repository.backupSnapshot(() => readGymLabStorage(storage))).resolves.toMatchObject({ sessions: [draft] })

        await repository.beginRestore('interrupted', () => previous)
        await expect(repository.cancel(draft.id)).rejects.toThrow('restauración')
        storage.setItem('gymlab_theme', '"system"')
        await repository.close()
        repository = new IndexedTrainingRepository(name)
        await recoverTrainingRestore(storage, repository)
        expect(readGymLabStorage(storage)).toEqual(previous)
        expect(await repository.list()).toEqual([draft])
    })

    it('does not let a stale restore write after another connection recovers the journal', async () => {
        const storage = new MemoryStorage()
        storage.setItem('gymlab_theme', '"dark"')
        const draft = await repository.start(createSession(program, day))
        const other = new IndexedTrainingRepository(name)
        try {
            await repository.beginRestore('stale', () => readGymLabStorage(storage))
            await recoverTrainingRestore(storage, other)
            await expect(repository.commitRestore('stale', () => storage.setItem('gymlab_theme', '"light"'), []))
                .rejects.toThrow('Otra pestaña')
            expect(storage.getItem('gymlab_theme')).toBe('"dark"')
            expect(await repository.list()).toEqual([draft])
        } finally {
            await other.close()
        }
    })

    it('preserves the durable draft and rejects completion when IndexedDB runs out of quota', async () => {
        const draft = await repository.start(createSession(program, day))
        const saved = await repository.edit(draft.id, item => log(item, 100))
        const put = vi.spyOn(IDBObjectStore.prototype, 'put')
        try {
            put.mockImplementationOnce(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
            await expect(repository.edit(draft.id, item => log(item, 120))).rejects.toMatchObject({ name: 'QuotaExceededError' })
            put.mockImplementationOnce(() => { throw new DOMException('Sin espacio', 'QuotaExceededError') })
            await expect(repository.finish(draft.id)).rejects.toMatchObject({ name: 'QuotaExceededError' })
            expect(await repository.list()).toEqual([saved])
        } finally {
            put.mockRestore()
        }
        expect((await repository.finish(draft.id)).status).toBe('completed')
    })

    it('rolls back both stores when IndexedDB aborts after localStorage has been written', async () => {
        const storage = new MemoryStorage()
        storage.setItem('gymlab_theme', '"dark"')
        const draft = await repository.start(createSession(program, day))
        const replacement = createSession(program, second)
        // A duplicate add fails asynchronously, after the synchronous localStorage update.
        await expect(restoreTrainingBackup(storage, { gymlab_theme: '"light"' }, [replacement, replacement], repository))
            .rejects.toMatchObject({ name: 'ConstraintError' })
        expect(storage.getItem('gymlab_theme')).toBe('"dark"')
        expect(await repository.list()).toEqual([draft])
    })

    it('rejects writes from a tab that still holds a draft from before a restore', async () => {
        const storage = new MemoryStorage()
        vi.stubGlobal('localStorage', storage)
        try {
            initializeStorageGeneration(storage)
            const active = await repository.start(createSession(program, day))
            await restoreTrainingBackup(storage, {}, [active], repository)
            expect(storage.getItem(STORAGE_GENERATION_KEY)).toBeTruthy()
            await expect(repository.edit(active.id, item => log(item, 200))).rejects.toThrow('otra pestaña')
            expect(await repository.list()).toEqual([active])
            initializeStorageGeneration(storage)
            await expect(repository.edit(active.id, item => log(item, 110))).resolves.toMatchObject({ status: 'active' })
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it('serializes receipts across tabs and retries a quota failure without double-advancing', async () => {
        const storage = new MemoryStorage()
        const other = new IndexedTrainingRepository(name)
        const first = { id: 'first', dayId: day.id, programId: program.id, completedAt: '2025-01-01T00:00:00Z' }
        const secondReceipt = { ...first, id: 'second', dayId: second.id, completedAt: '2025-01-02T00:00:00Z' }
        const record = (repo: IndexedTrainingRepository, ...receipts: typeof first[]) =>
            repo.coordinateRotation(() => writeRotation(storage, program.id, [program],
                state => reconcileTrainingCompletions(state, [program], receipts)))
        try {
            await record(repository, first)
            const prior = parseWorkoutState(storage.getItem('gymlab_state'))
            expect(prior.currentDayIdByProgram?.[program.id]).toBe(second.id)
            storage.failValue = JSON.stringify(reconcileTrainingCompletions(prior, [program], [secondReceipt]))
            await expect(record(other, secondReceipt)).rejects.toMatchObject({ name: 'QuotaExceededError' })
            expect(parseWorkoutState(storage.getItem('gymlab_state'))).toEqual(prior)
            storage.failValue = undefined
            await Promise.all([record(other, first, secondReceipt), record(repository, first)])
            const result = parseWorkoutState(storage.getItem('gymlab_state'))
            expect(result.sessions.map(session => session.id)).toEqual(['first', 'second'])
            expect(result.currentDayIdByProgram?.[program.id]).toBe(day.id)
        } finally {
            await other.close()
        }
    })

    it('replays a committed rotation receipt exactly once and keeps sessions of removed days', () => {
        const initial = parseWorkoutState(null)
        const receipt = { id: 'id', dayId: 'a', programId: program.id, completedAt: '2025-01-01T00:00:00Z' }
        const expected = advanceRotation(initial, program.id, program.days, receipt)
        const once = reconcileTrainingCompletions(initial, [program], [receipt])
        expect(once).toEqual(expected)
        expect(reconcileTrainingCompletions(once, [program], [receipt])).toBe(once)
        const removed = reconcileTrainingCompletions(initial, [{ ...program, days: [second] }], [receipt])
        expect(removed.currentDayIndexByProgram).toEqual({})
        expect(removed.sessions).toEqual([receipt])
    })
})
