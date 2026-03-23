import { NavLink } from 'react-router-dom'
import { Home, ListChecks, ClockFading, Settings, Scale } from 'lucide-react'

const tabs = [
    { to: '/', label: 'Hoy', icon: Home },
    { to: '/routines', label: 'Rutinas', icon: ListChecks },
    { to: '/history', label: 'Historial', icon: ClockFading },
    { to: '/weight', label: 'Peso', icon: Scale },
    { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10">
            <div className="flex items-center justify-around max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
                {tabs.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            [
                                'flex flex-col items-center gap-1 py-3 px-5 rounded-2xl transition-all duration-150',
                                'text-xs font-medium min-w-[64px]',
                                isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400',
                            ].join(' ')
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    size={22}
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
