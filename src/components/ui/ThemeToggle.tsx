import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { IconButton } from './IconButton'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    const icon =
        theme === 'dark' ? <Moon size={18} /> :
            theme === 'light' ? <Sun size={18} /> :
                <Monitor size={18} />

    const label =
        theme === 'dark' ? 'Modo oscuro' :
            theme === 'light' ? 'Modo claro' :
                'Modo sistema'

    return (
        <IconButton onClick={toggleTheme} title={label} variant="ghost">
            {icon}
        </IconButton>
    )
}
