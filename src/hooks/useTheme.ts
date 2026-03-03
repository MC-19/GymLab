import { useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { ThemeMode } from '../types'

export function useTheme() {
    const [theme, setTheme] = useLocalStorage<ThemeMode>('gymlab_theme', 'system')

    const applyTheme = useCallback((mode: ThemeMode) => {
        const root = document.documentElement
        if (mode === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', prefersDark)
        } else {
            root.classList.toggle('dark', mode === 'dark')
        }
    }, [])

    useEffect(() => {
        applyTheme(theme)
        if (theme !== 'system') return

        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme('system')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme, applyTheme])

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            if (prev === 'system') return 'dark'
            if (prev === 'dark') return 'light'
            return 'system'
        })
    }, [setTheme])

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    return { theme, isDark, setTheme, toggleTheme }
}
