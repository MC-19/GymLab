import { describe, expect, it } from 'vitest'
import { getStorageErrorMessage } from './storageErrors'

describe('storage errors', () => {
    it('provides a specific message when the storage quota is full', () => {
        const error = new DOMException('Storage full', 'QuotaExceededError')
        expect(getStorageErrorMessage(error)).toContain('No queda espacio')
    })

    it('provides a safe generic message for other failures', () => {
        expect(getStorageErrorMessage(new Error('blocked'))).toContain('No se han podido guardar')
    })
})
