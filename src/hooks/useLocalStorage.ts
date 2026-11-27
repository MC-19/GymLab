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
        const item = localStorage.getItem(key)
        return item === null ? initialValue : JSON.parse(item) as T
    })

    useEffect(() => {
        try {
            const serialized = JSON.stringify(value)
            if (localStorage.getItem(key) !== serialized) localStorage.setItem(key, serialized)
        } catch (error) {
            reportStorageError(error)
        }
    }, [key, value])

    return [value, setValue] as const
}
