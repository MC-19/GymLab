import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Trophy } from 'lucide-react'
import { useTraining } from './TrainingContext'
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

    return (
        <div className="mx-auto max-w-lg px-5 pt-5 pb-8 space-y-4">
            <Link to={sessionId ? '/history/sessions' : '/history'} className="inline-flex items-center min-h-11 text-sm text-blue-600 dark:text-blue-400">
                {sessionId ? 'Volver a sesiones' : 'Volver a Progresión'}
            </Link>
            <h1 className="text-2xl font-bold">{session ? session.dayName : 'Sesiones de entrenamiento'}</h1>
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
            ) : sessionId ? <p className="text-sm text-gray-500">No se encontró esta sesión.</p> : history.length ? (
                <ul className="space-y-2">
                    {history.map(item => (
                        <li key={item.id}>
                            <Link to={`/history/sessions/${item.id}`} className="flex items-center justify-between gap-2 rounded-2xl p-4 bg-gray-50 dark:bg-white/5">
                                <span>
                                    <span className="block font-semibold">{item.dayName}</span>
                                    <span className="block text-sm text-gray-500">{item.programName} · {new Date(item.completedAt!).toLocaleDateString('es-ES')}</span>
                                </span>
                                <ChevronRight size={18} />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500">Aquí aparecerán los entrenamientos que finalices.</p>}
        </div>
    )
}
