import { useState, useEffect } from 'react'

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
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(value))
            } catch (e) {
                if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                    console.error('[GymLab] localStorage lleno. Considera limpiar el historial.')
                } else {
                    console.error('[GymLab] Error guardando en localStorage:', e)
                }
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [key, value])

    return [value, setValue] as const
}
