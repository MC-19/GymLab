import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { HistoryNavigation } from '../../components/layout/HistoryNavigation'
import { PageHeader } from '../../components/layout/PageHeader'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTraining } from './TrainingContext'
import { goalLabel } from '../programs/goals'
import { summarizeSession } from './session'

function durationLabel(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours ? `${hours} h ${minutes} min` : `${minutes} min ${seconds % 60} s`
}

export function SessionHistoryPage() {
    const { sessionId } = useParams()
    const { history, loading, error } = useTraining()
    const session = sessionId ? history.find(item => item.id === sessionId) : undefined
    const summary = session && summarizeSession(session)

    if (!sessionId) {
        return (
            <>
                <HistoryNavigation view="sessions" />
                <div className="mx-auto max-w-lg space-y-3 px-5 py-5">
                    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
                    {loading ? <p role="status" className="text-sm text-gray-600 dark:text-gray-400">Cargando sesiones…</p> : history.length > 0 ? (
                        <ul className="space-y-2" aria-label="Sesiones de entrenamiento">
                            {history.map(item => (
                                <li key={item.id}>
                                    <Link
                                        to={`/history/sessions/${item.id}`}
                                        className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-white/10 dark:bg-white/5"
                                    >
                                        <span className="min-w-0 wrap-break-word">
                                            <span className="block font-semibold">{item.dayName}</span>
                                            <span className="block text-sm text-gray-600 dark:text-gray-400">
                                                <time dateTime={item.completedAt!}>{new Date(item.completedAt!).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</time>
                                                {' · '}{item.programName}
                                            </span>
                                        </span>
                                        <ChevronRight size={18} className="shrink-0" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : !error && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                            <h2 className="font-semibold">Aún no hay sesiones</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Aquí aparecerán los entrenamientos que finalices. Puedes consultar tus registros de ejercicios en Progresión.</p>
                        </div>
                    )}
                </div>
            </>
        )
    }

    return (
        <div>
            <PageHeader>
                <div className="mx-auto flex min-h-14 max-w-lg items-center gap-2 px-4">
                    <Link to="/history" aria-label="Volver a sesiones" className="grid size-11 shrink-0 place-items-center rounded-xl text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400">
                        <ChevronLeft size={22} aria-hidden="true" />
                    </Link>
                    <h1 className="min-w-0 flex-1 truncate font-bold">{session?.dayName ?? 'Sesiones de entrenamiento'}</h1>
                    <ThemeToggle />
                </div>
            </PageHeader>
            <div className="mx-auto max-w-lg px-5 pt-5 pb-8 space-y-4">
                {loading || error ? <p className="text-sm text-gray-500">{error ?? 'Cargando sesiones…'}</p> : session && summary ? (
                    <>
                        <p className="text-sm text-gray-500">{session.programName} · {new Date(session.completedAt!).toLocaleString('es-ES')}</p>
                        <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 dark:bg-white/5 p-4">
                            {[
                                ['Duración', durationLabel(summary.duration)],
                                ['Ejercicios', summary.exercises],
                                ['Series', summary.sets],
                                ['Volumen efectivo', `${summary.volume.toLocaleString('es-ES', { maximumFractionDigits: 2 })} kg`],
                            ].map(([label, value]) => (
                                <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="font-semibold">{value}</dd></div>
                            ))}
                        </dl>
                        {session.exercises.map(exercise => (
                            <section key={exercise.id} className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 space-y-2">
                                <h2 className="font-semibold">{exercise.name}</h2>
                                {exercise.goals && <p className="text-xs text-gray-500">Objetivo de la sesión · {goalLabel(exercise.goals)}</p>}
                                {session.records.includes(exercise.id) && (
                                    <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                                        <Trophy size={16} /> Récord de peso
                                    </p>
                                )}
                                <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    {exercise.sets.map((set, index) => (
                                        <li key={set.id}>
                                            {index + 1}. {set.weight} kg × {set.reps} reps{set.rir !== null ? ` · RIR ${set.rir}` : ''}
                                            {set.type === 'warmup' ? ' · Calentamiento' : set.type === 'dropset' ? ' · Dropset' : ''}
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ))}
                        <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-600 dark:text-blue-400">Volver a Inicio</Link>
                    </>
                ) : <p className="text-sm text-gray-600 dark:text-gray-400">No se encontró esta sesión.</p>}
            </div>
        </div>
    )
}
