import { useState } from 'react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { HistoryNavigation } from '../components/layout/HistoryNavigation'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { TrendingUp, BarChart2, ChevronRight, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getHistory, historyWindows, getHistorySessions } from '../utils/history'
import { sessionDates } from '../utils/dates'
import { ExerciseMiniChart } from '../components/ui/ExerciseMiniChart'

export function HistoryPage() {
    const { programs, activeProgramId, allSessions } = useWorkoutContext()
    const navigate = useNavigate()
    const [limit, setLimit] = useState<number>(Infinity)
    const [programFilter, setProgramFilter] = useState('')
    const [dayFilter, setDayFilter] = useState('')
    const { routines, rows, totalExercises, totalWeeks, totalVolume } = getHistory(programs, programFilter, dayFilter, limit)

    const weekSessions = sessionDates(getHistorySessions(allSessions, programs, programFilter, dayFilter), 'week')

    return (
        <div className="page-enter">
            <HistoryNavigation view="progression" />

            <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Esta semana · {weekSessions.length} {weekSessions.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </p>
                {!programs.length ? (
                    <EmptyState
                        icon={<TrendingUp size={28} />}
                        title="Sin datos aún"
                        description="Registra series en tus ejercicios para ver tu progresión aquí"
                    />
                ) : (
                    <>
                        <label className="block mb-4 text-sm">
                            Programa
                            <select
                                className="block w-full mt-1 p-2 rounded-xl bg-gray-100 dark:bg-white/10"
                                value={programFilter}
                                onChange={event => {
                                    setProgramFilter(event.target.value)
                                    setDayFilter('')
                                }}
                            >
                                <option value="">Todos los programas</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}{program.isDeleted ? ' (eliminado)' : program.isArchived ? ' (archivado)' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard label="Ejercicios" value={String(totalExercises)} icon={<Dumbbell size={16} />} />
                            <StatCard label="Semanas por ejercicio" value={String(totalWeeks)} icon={<BarChart2 size={16} />} />
                            <StatCard
                                label="Vol. total"
                                value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '—'}
                                icon={<TrendingUp size={16} />}
                                color="gold"
                            />
                        </div>

                        {/* Filtros de Rutina (Pills) NUNCA desaparecen */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-5 px-5">
                            <button
                                onClick={() => setDayFilter('')}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                    dayFilter === ''
                                        ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black'
                                        : 'bg-white border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300'
                                }`}
                            >
                                Todas
                            </button>
                            {routines.map(({ day, program, id }) => (
                                <button
                                    key={id}
                                    onClick={() => setDayFilter(id)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        dayFilter === id
                                            ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black'
                                            : 'bg-white border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300'
                                    }`}
                                >
                                    {programFilter ? day.name : `${program.name} · ${day.name}`}{day.isDeleted ? ' (retirado)' : ''}
                                </button>
                            ))}
                        </div>

                        {rows.length === 0 ? (
                            <EmptyState
                                icon={<TrendingUp size={28} />}
                                title="Sin datos"
                                description="Selecciona otro programa o rutina para consultar sus registros."
                            />
                        ) : (
                            <>

                            {/* Filtros de tiempo */}
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-4">
                                {historyWindows.map(window => (
                                    <button
                                        key={window}
                                        onClick={() => setLimit(window)}
                                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg capitalize transition-all duration-200 ${
                                            limit === window
                                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {window === Infinity ? 'Todo' : `${window} últ.`}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 mb-4">
                                Últimas semanas registradas por ejercicio. Las series antiguas solo se pueden filtrar por número de semana.
                            </p>

                            {/* Progresión por ejercicio */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                    Evolución por ejercicio
                                </h2>
                                {rows.map(({ program, day, ex, progress, delta, first, last, weeks }) => {
                                    const canEdit = program.id === activeProgramId && !day.isDeleted && !ex.isDeleted
                                    return (
                                        <article key={JSON.stringify([program.id, day.id, ex.id])} className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-3xl px-5 py-4">
                                            <header>
                                                <span className="font-semibold">{ex.name}</span>
                                                {delta !== 0 && (
                                                    <span className="ml-2"><Badge variant={delta > 0 ? 'green' : 'gray'}>{delta > 0 ? '+' : ''}{delta} kg</Badge></span>
                                                )}
                                                <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                                                    {program.name} · {day.name}{ex.isDeleted ? ' · Retirado' : ''}
                                                </span>
                                            </header>
                                            <div className="mt-4">
                                                <ExerciseMiniChart progress={progress} />
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span>{first.maxWeight} kg</span>
                                                    <span>{last.maxWeight} kg máx.</span>
                                                </div>
                                            </div>
                                            {canEdit ? (
                                                <button className="flex gap-1 items-center text-sm text-blue-600 dark:text-blue-400 mt-3"
                                                    onClick={() => navigate(`/day/${day.id}/exercise/${ex.id}`)}>
                                                    Abrir ejercicio <ChevronRight size={14} />
                                                </button>
                                            ) : (
                                                <details className="mt-3 text-sm">
                                                    <summary className="cursor-pointer">Ver series</summary>
                                                    <ul className="mt-2 space-y-2">
                                                        {weeks.map(week => (
                                                            <li key={week.id}>
                                                                <strong>Semana {week.weekNumber}{week.label ? ` · ${week.label}` : ''}</strong>
                                                                <ul className="text-xs mt-1">
                                                                    {week.sets.map(set => (
                                                                        <li key={set.id}>
                                                                            {set.type === 'warmup' ? 'Calentamiento · ' : set.type === 'dropset' ? 'Descendente · ' : ''}
                                                                            {set.weight ?? '—'} kg × {set.reps ?? '—'} reps · RIR {set.rir ?? '—'}
                                                                            {set.notes ? ` · ${set.notes}` : ''}
                                                                        </li>
                                                                    ))}
                                                                    {week.sets.length === 0 && <li>Sin series</li>}
                                                                </ul>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({
    label, value, icon, color = 'blue',
}: { label: string; value: string; icon: React.ReactNode; color?: 'blue' | 'gold' }) {
    return (
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-3xl p-4 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color === 'gold' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'}`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
            </div>
        </div>
    )
}
