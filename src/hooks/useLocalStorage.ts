import { useState, useEffect } from 'react'
import { reportStorageError } from '../services/storageErrors'

/**
 * Hook de almacenamiento local con soporte para función inicializadora externa.
 * El parámetro `loader` permite inyectar lógica de migración/validación.
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    loader?: () => T
) {
    const [value, setValue] = useState<T>(() => {
        if (loader) return loader()
        try {
            const item = localStorage.getItem(key)
            return item ? (JSON.parse(item) as T) : initialValue
        } catch {
            return initialValue
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            reportStorageError(error)
        }
    }, [key, value])

    return [value, setValue] as const
}
