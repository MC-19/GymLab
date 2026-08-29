import { useEffect } from 'react'
import { useWorkoutContext } from '../../context/WorkoutContext'
import { STORAGE_ERROR_EVENT } from '../../services/storageErrors'

export function StorageErrorNotifier() {
    const { showToast } = useWorkoutContext()

    useEffect(() => {
        let lastNotification = 0
        const handleStorageError = (event: Event) => {
            const now = Date.now()
            if (now - lastNotification < 5000) return
            lastNotification = now
            const message = (event as CustomEvent<{ message?: string }>).detail?.message
            showToast(message ?? 'No se han podido guardar los cambios.', 'error')
        }
        window.addEventListener(STORAGE_ERROR_EVENT, handleStorageError)
        return () => window.removeEventListener(STORAGE_ERROR_EVENT, handleStorageError)
    }, [showToast])

    return null
}
