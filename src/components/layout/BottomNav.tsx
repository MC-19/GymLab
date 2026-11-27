import { NavLink } from 'react-router-dom'
import { Home, Layers, ClockFading, Settings, Scale } from 'lucide-react'

const tabs = [
    { to: '/', label: 'Hoy', icon: Home },
    { to: '/programs', label: 'Programas', icon: Layers },
    { to: '/history', label: 'Historial', icon: ClockFading },
    { to: '/weight', label: 'Peso', icon: Scale },
    { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function BottomNav() {
    return (
        <nav aria-label="Navegación principal" className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10">
            <div className="grid grid-cols-5 max-w-lg mx-auto px-1 pb-[env(safe-area-inset-bottom)]">
                {tabs.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            [
                                'flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-3 text-xs text-center transition-colors',
                                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500',
                                isActive
                                    ? 'font-semibold text-blue-700 dark:text-blue-400'
                                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                            ].join(' ')
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    size={22}
                                    aria-hidden="true"
                                    className={isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}
                                />
                                <span>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
