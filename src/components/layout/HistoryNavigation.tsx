import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PageHeader } from './PageHeader'

const views = [
    { to: '/history', label: 'Sesiones', id: 'sessions' },
    { to: '/history/progression', label: 'Progresión', id: 'progression' },
] as const

export function HistoryNavigation({ view }: { view: typeof views[number]['id'] }) {
    return (
        <>
            <PageHeader>
                <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
                    <h1 className="font-bold">Historial</h1>
                    <ThemeToggle />
                </div>
            </PageHeader>
            <nav aria-label="Vistas del historial" className="mx-auto flex max-w-lg gap-2 px-5 pt-4">
                {views.map(({ to, label, id }) => (
                    <Link
                        key={id}
                        to={to}
                        aria-current={id === view ? 'page' : undefined}
                        className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-500 ${id === view
                            ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10'}`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </>
    )
}
