import { useState, useCallback, useEffect, useRef } from 'react'
import { generateId } from '../utils/helpers'

export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>())

    useEffect(() => {
        const timers = timeouts.current
        return () => {
            timers.forEach(clearTimeout)
            timers.clear()
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        clearTimeout(timeouts.current.get(id))
        timeouts.current.delete(id)
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
        const id = generateId()
        setToasts(prev => [...prev, { id, message, type }])
        timeouts.current.set(id, setTimeout(() => removeToast(id), 2500))
    }, [removeToast])

    return { toasts, showToast, removeToast }
}
