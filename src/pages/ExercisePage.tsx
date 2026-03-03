import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, Trash2, Dumbbell, TrendingUp, ChevronRight, BarChart2 } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { calcTotalVolume, getCompletedSets, getExerciseProgress } from '../utils/helpers'
import type { TrainingWeek } from '../types'

export function ExercisePage() {
    const { dayId, exerciseId } = useParams<{ dayId: string; exerciseId: string }>()
    const navigate = useNavigate()
    const { days, addWeek, deleteWeek, showToast } = useWorkoutContext()

    const day = days.find(d => d.id === dayId)
    const exercise = day?.exercises.find(e => e.id === exerciseId)

    if (!day || !exercise) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
                <p className="text-gray-500">Ejercicio no encontrado</p>
                <Button onClick={() => navigate('/')} variant="ghost">Volver</Button>
            </div>
        )
    }

    const progress = getExerciseProgress(exercise)
    // Semanas ordenadas: la más reciente (mayor weekNumber) primero
    const sortedWeeks = [...exercise.weeks].sort((a, b) => b.weekNumber - a.weekNumber)

    const handleAddWeek = () => {
        const newWeek = addWeek(day.id, exercise.id)
        showToast(`Semana ${newWeek.weekNumber} creada`, 'success')
        // Navegar directamente a la nueva semana
        navigate(`/day/${day.id}/exercise/${exercise.id}/week/${newWeek.id}`)
    }

    const handleDeleteWeek = (week: TrainingWeek, e: React.MouseEvent) => {
        e.stopPropagation()
        deleteWeek(day.id, exercise.id, week.id)
        showToast(`Semana ${week.weekNumber} eliminada`, 'info')
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
                    <IconButton onClick={() => navigate(`/day/${day.id}`)} variant="ghost">
                        <ChevronLeft size={22} />
                    </IconButton>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{exercise.name}</h1>
                        {exercise.muscleGroup && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">{exercise.muscleGroup}</span>
                        )}
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="flex-1 px-5 pt-5 pb-8 max-w-lg mx-auto w-full space-y-4">

                {/* Gráfica de progresión (solo si hay ≥2 semanas con datos) */}
                {progress.filter(p => p.maxWeight > 0).length >= 2 && (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-3xl px-5 py-4 border border-gray-200/60 dark:border-white/8">
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart2 size={14} className="text-blue-500" />
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Peso máximo por semana
                            </span>
                        </div>
                        <div className="flex items-end gap-1.5 h-14">
                            {progress.map((p, i) => {
                                const max = Math.max(...progress.map(x => x.maxWeight), 1)
                                const heightPct = max > 0 ? (p.maxWeight / max) * 100 : 0
                                const isLast = i === progress.length - 1
                                return (
                                    <div key={p.weekNumber} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                                        <div className="w-full flex items-end justify-center" style={{ height: '44px' }}>
                                            <div
                                                className={`w-full rounded-t-lg transition-all duration-300 ${isLast ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-500/30'}`}
                                                style={{ height: `${Math.max(heightPct, 8)}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-gray-400 truncate w-full text-center">{p.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">S1: {progress[0]?.maxWeight ?? 0} kg</span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Actual: {progress.at(-1)?.maxWeight ?? 0} kg
                            </span>
                        </div>
                    </div>
                )}

                {/* Lista de semanas */}
                {exercise.weeks.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin semanas"
                        description="Crea tu primera semana de entrenamiento"
                        action={
                            <Button onClick={handleAddWeek} icon={<Plus size={16} />}>
                                Nueva semana
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-2.5">
                        {sortedWeeks.map(week => {
                            const allSets = week.sets
                            const completed = getCompletedSets(allSets)
                            const weekVolume = calcTotalVolume(allSets)
                            const maxWeight = allSets.filter(s => s.weight !== null).length > 0
                                ? Math.max(...allSets.filter(s => s.weight !== null).map(s => s.weight!))
                                : 0
                            const isFullyDone = allSets.length > 0 && completed === allSets.length

                            return (
                                <button
                                    key={week.id}
                                    className={[
                                        'w-full text-left flex items-center gap-3 px-5 py-4 rounded-3xl border transition-all duration-200',
                                        isFullyDone
                                            ? 'bg-blue-50/80 dark:bg-blue-500/8 border-blue-200/60 dark:border-blue-500/20 hover:border-blue-400/60'
                                            : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/20',
                                    ].join(' ')}
                                    onClick={() => navigate(`/day/${day.id}/exercise/${exercise.id}/week/${week.id}`)}
                                >
                                    {/* Número de semana */}
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isFullyDone ? 'bg-blue-500/20 dark:bg-blue-500/25' : 'bg-blue-600/10 dark:bg-blue-500/15'}`}>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {week.weekNumber}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {week.label ?? `Semana ${week.weekNumber}`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {allSets.length === 0 ? (
                                                <Badge variant="gray">Sin series</Badge>
                                            ) : (
                                                <>
                                                    <Badge variant={isFullyDone ? 'green' : 'gray'}>
                                                        {completed}/{allSets.length} series
                                                    </Badge>
                                                    {maxWeight > 0 && (
                                                        <Badge variant="blue">{maxWeight} kg max</Badge>
                                                    )}
                                                    {weekVolume > 0 && (
                                                        <span className="text-xs text-gray-400">{weekVolume} kg vol.</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <IconButton
                                            onClick={e => handleDeleteWeek(week, e)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            <Trash2 size={13} />
                                        </IconButton>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </div>
                                </button>
                            )
                        })}

                        {/* Botón nueva semana */}
                        <button
                            onClick={handleAddWeek}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                        >
                            <TrendingUp size={18} />
                            Nueva semana
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
