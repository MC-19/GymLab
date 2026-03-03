import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { Dumbbell, TrendingUp, BarChart2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getExerciseProgress, calcTotalVolume } from '../utils/helpers'

export function HistoryPage() {
    const { days } = useWorkoutContext()
    const navigate = useNavigate()

    // Estadísticas globales
    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
    const totalWeeks = days.reduce((sum, d) =>
        sum + d.exercises.reduce((es, e) => es + e.weeks.length, 0), 0
    )
    const totalVolume = days.reduce((sum, d) =>
        sum + d.exercises.reduce((es, e) =>
            es + e.weeks.reduce((ws, w) => ws + calcTotalVolume(w.sets), 0), 0
        ), 0
    )

    // Ejercicios con al menos 2 semanas (tienen progresión que enseñar)
    const exercisesWithProgress = days.flatMap(day =>
        day.exercises
            .filter(ex => ex.weeks.length >= 2)
            .map(ex => ({ day, ex, progress: getExerciseProgress(ex) }))
    )

    const hasAnyData = days.some(d => d.exercises.some(e => e.weeks.length > 0))

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Progresión</h1>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
                {!hasAnyData ? (
                    <EmptyState
                        icon={<TrendingUp size={28} />}
                        title="Sin datos aún"
                        description="Registra series en tus ejercicios para ver tu progresión aquí"
                    />
                ) : (
                    <>
                        {/* Stats globales */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard label="Ejercicios" value={String(totalExercises)} icon={<Dumbbell size={16} />} />
                            <StatCard label="Semanas" value={String(totalWeeks)} icon={<BarChart2 size={16} />} />
                            <StatCard
                                label="Vol. total"
                                value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '—'}
                                icon={<TrendingUp size={16} />}
                                color="gold"
                            />
                        </div>

                        {/* Progresión por ejercicio */}
                        {exercisesWithProgress.length > 0 ? (
                            <div className="space-y-4">
                                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest">
                                    Evolución por ejercicio
                                </h2>
                                {exercisesWithProgress.map(({ day, ex, progress }) => {
                                    const first = progress[0]
                                    const last = progress.at(-1)!
                                    const delta = last.maxWeight - first.maxWeight
                                    const deltaSign = delta > 0 ? '+' : ''

                                    return (
                                        <button
                                            key={ex.id}
                                            className="w-full text-left bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-3xl px-5 py-4 hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200"
                                            onClick={() => navigate(`/day/${day.id}/exercise/${ex.id}`)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{ex.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{day.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {delta !== 0 && (
                                                        <Badge variant={delta > 0 ? 'green' : 'gray'}>
                                                            {deltaSign}{delta} kg
                                                        </Badge>
                                                    )}
                                                    <ChevronRight size={14} className="text-gray-400" />
                                                </div>
                                            </div>

                                            {/* Mini gráfica de barras */}
                                            <div className="flex items-end gap-1 h-10">
                                                {progress.map((p, i) => {
                                                    const max = Math.max(...progress.map(x => x.maxWeight), 1)
                                                    const heightPct = max > 0 ? (p.maxWeight / max) * 100 : 0
                                                    const isLast = i === progress.length - 1
                                                    return (
                                                        <div key={p.weekNumber} className="flex flex-col items-center flex-1 min-w-0" style={{ height: '40px' }}>
                                                            <div className="w-full flex items-end" style={{ height: '32px' }}>
                                                                <div
                                                                    className={`w-full rounded-t transition-all ${isLast ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-500/30'}`}
                                                                    style={{ height: `${Math.max(heightPct, 10)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[8px] text-gray-400 w-full text-center">{p.label}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="flex justify-between mt-2">
                                                <span className="text-xs text-gray-500">{first.maxWeight} kg</span>
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                    {last.maxWeight} kg max
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
                                Añade al menos 2 semanas a un ejercicio para ver su progresión
                            </div>
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
                <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
            </div>
        </div>
    )
}
