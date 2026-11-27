// This key is intentionally outside the backup's gymlab_ prefix.
export const STORAGE_GENERATION_KEY = 'gymlab:storage-generation'

const generations = new WeakMap<Storage, string | null>()

export function initializeStorageGeneration(storage: Storage) {
    generations.set(storage, storage.getItem(STORAGE_GENERATION_KEY))
}

export function assertCurrentStorageGeneration(storage: Storage) {
    const tabGeneration = generations.get(storage)
    if (tabGeneration !== undefined && storage.getItem(STORAGE_GENERATION_KEY) !== tabGeneration) {
        throw new Error('Los datos cambiaron en otra pestaña. Recarga GymLab antes de continuar.')
    }
}
