export const STORAGE_ERROR_EVENT = 'gymlab:storage-error'

export function isStorageQuotaError(error: unknown): boolean {
    return error instanceof DOMException
        && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
}

export function getStorageErrorMessage(error: unknown): string {
    if (isStorageQuotaError(error)) {
        return 'No queda espacio para guardar los cambios. Exporta un backup y libera almacenamiento.'
    }
    return 'No se han podido guardar los últimos cambios en este dispositivo.'
}

export function reportStorageError(error: unknown) {
    const message = getStorageErrorMessage(error)
    console.error('[GymLab] Error guardando en localStorage:', error)
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message } }))
}
