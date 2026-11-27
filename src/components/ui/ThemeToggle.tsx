import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import type { ThemeMode } from '../../types'
import { IconButton } from './IconButton'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    return <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
}

export function ThemeToggleButton({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
    const icon =
        theme === 'dark' ? <Moon size={18} /> :
            theme === 'light' ? <Sun size={18} /> :
                <Monitor size={18} />

    const label =
        theme === 'dark' ? 'Modo oscuro' :
            theme === 'light' ? 'Modo claro' :
                'Modo sistema'

    return (
        <IconButton type="button" onClick={onToggle} title={label} aria-label={`${label}. Cambiar tema`} variant="ghost" className="min-h-11 min-w-11 shrink-0">
            {icon}
        </IconButton>
    )
}
