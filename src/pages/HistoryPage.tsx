import { useState } from 'react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { TrendingUp, BarChart2, ChevronRight, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getExerciseProgress, calcTotalVolume } from '../utils/helpers'
import { ExerciseMiniChart } from '../components/ui/ExerciseMiniChart'

export function HistoryPage() {
    const { days } = useWorkoutContext()
    const navigate = useNavigate()

    const [timeFilter, setTimeFilter] = useState<'semanal' | 'mensual' | 'trimestral' | 'general'>('general')
    const [dayFilter, setDayFilter] = useState<string>('all')

    const filteredDays = days.filter(day => dayFilter === 'all' || day.id === dayFilter)

    // Estadísticas globales filtradas
    const totalExercises = filteredDays.reduce((sum, d) => sum + d.exercises.length, 0)
    const totalWeeks = filteredDays.reduce((sum, d) =>
        sum + d.exercises.reduce((es, e) => es + e.weeks.length, 0), 0
    )
    const totalVolume = filteredDays.reduce((sum, d) =>
        sum + d.exercises.reduce((es, e) =>
            es + e.weeks.reduce((ws, w) => ws + calcTotalVolume(w.sets), 0), 0
        ), 0
    )

    const filterLimit: Record<typeof timeFilter, number> = {
        semanal: 1,
        mensual: 4,
        trimestral: 12,
        general: Infinity
    }

    // Ejercicios con al menos 1 semana (para poder ver aunque sea el dato de la semana actual)
    const exercisesWithProgress = filteredDays.flatMap(day =>
        day.exercises
            .filter(ex => ex.weeks.length >= 1)
            .map(ex => {
                const fullProgress = getExerciseProgress(ex)
                const limit = filterLimit[timeFilter]
                const progress = fullProgress.slice(-limit)
                
                const first = progress[0]
                const last = progress.at(-1)!
                
                let delta = last.maxWeight - first.maxWeight
                // Si es vista semanal, el progress solo tiene 1 punto, así que comparamos con el penúltimo del histórico global
                if (timeFilter === 'semanal' && fullProgress.length >= 2) {
                    delta = last.maxWeight - fullProgress[fullProgress.length - 2].maxWeight
                }

                return { day, ex, progress, delta, first, last }
            })
    )

    const globalHasAnyData = days.some(d => d.exercises.some(e => e.weeks.length > 0))
    const filteredHasAnyData = filteredDays.some(d => d.exercises.some(e => e.weeks.length > 0))

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
                {!globalHasAnyData ? (
                    <EmptyState
                        icon={<TrendingUp size={28} />}
                        title="Sin datos aún"
                        description="Registra series en tus ejercicios para ver tu progresión aquí"
                    />
                ) : (
                    <>
                        {/* Stats globales (siempre visibles, incluso si es 0 por el filtro) */}
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

                        {/* Filtros de Rutina (Pills) NUNCA desaparecen */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-5 px-5">
                            <button
                                onClick={() => setDayFilter('all')}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                    dayFilter === 'all' 
                                        ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black' 
                                        : 'bg-white border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300'
                                }`}
                            >
                                Todas
                            </button>
                            {days.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setDayFilter(d.id)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        dayFilter === d.id 
                                            ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black' 
                                            : 'bg-white border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300'
                                    }`}
                                >
                                    {d.name}
                                </button>
                            ))}
                        </div>

                        {!filteredHasAnyData ? (
                            <EmptyState
                                icon={<TrendingUp size={28} />}
                                title="Sin datos"
                                description="Esta rutina aún no tiene series completadas."
                            />
                        ) : (
                            <>

                        {/* Filtros de tiempo */}
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-4">
                            {(['semanal', 'mensual', 'trimestral', 'general'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTimeFilter(f)}
                                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg capitalize transition-all duration-200 ${
                                        timeFilter === f 
                                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {f === 'general' ? 'Todo' : f}
                                </button>
                            ))}
                        </div>

                        {/* Progresión por ejercicio */}
                        {exercisesWithProgress.length > 0 ? (
                            <div className="space-y-4">
                                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest">
                                    Evolución por ejercicio
                                </h2>
                                {exercisesWithProgress.map(({ day, ex, progress, delta, first, last }) => {
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

                                            {/* Gráfica de área suavizada */}
                                            <div className="mt-4 mb-2">
                                                <ExerciseMiniChart progress={progress} />
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
                                Añade al menos 1 semana a un ejercicio para ver su historial
                            </div>
                        )}
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
                <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
            </div>
        </div>
    )
}
