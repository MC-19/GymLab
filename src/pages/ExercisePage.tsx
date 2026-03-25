import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, Trash2, Dumbbell, TrendingUp, ChevronRight, BarChart2, Zap, Play } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { BottomSheet } from '../components/ui/BottomSheet'
import { calcTotalVolume, getCompletedSets, getExerciseProgress } from '../utils/helpers'
import type { TrainingWeek } from '../types'

export function ExercisePage() {
    const { dayId, exerciseId } = useParams<{ dayId: string; exerciseId: string }>()
    const navigate = useNavigate()
    const { days, addWeekFromPrevious, applyWeightIncrement, deleteWeek } = useWorkoutContext()

    // Estado para el modal de sugerencia de sobrecarga
    const [pendingWeek, setPendingWeek] = useState<TrainingWeek | null>(null)

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

    // Semana activa = la de mayor weekNumber (o null si no hay ninguna)
    const latestWeek = sortedWeeks[0] ?? null
    // Mostrar CTA "Entrenar hoy" si no hay semanas O si la última ya tiene todas las series completadas
    const showStartCTA = latestWeek === null || (
        latestWeek.sets.length > 0 &&
        latestWeek.sets.every(s => s.weight !== null && s.reps !== null)
    )

    const handleAddWeek = () => {
        const { week, shouldSuggestIncrease } = addWeekFromPrevious(day.id, exercise.id)

        if (shouldSuggestIncrease) {
            // Mostrar modal de sugerencia antes de navegar
            setPendingWeek(week)
        } else {
            // Si no hay sugerencia, ir directo a la semana
            navigate(`/day/${day.id}/exercise/${exercise.id}/week/${week.id}`)
        }
    }

    const handleApplyIncrement = (increment: number) => {
        if (!pendingWeek) return
        if (increment > 0) {
            applyWeightIncrement(day.id, exercise.id, pendingWeek.id, increment)
        }
        const weekToNavigate = pendingWeek
        setPendingWeek(null)
        navigate(`/day/${day.id}/exercise/${exercise.id}/week/${weekToNavigate.id}`)
    }

    const handleDeleteWeek = (week: TrainingWeek, e: React.MouseEvent) => {
        e.stopPropagation()
        deleteWeek(day.id, exercise.id, week.id)
    }

    // Semana anterior a la pendiente (para mostrar el peso de referencia en el modal)
    const prevWeek = pendingWeek
        ? exercise.weeks
            .filter(w => w.weekNumber < pendingWeek.weekNumber)
            .sort((a, b) => b.weekNumber - a.weekNumber)[0]
        : null
    const prevMaxWeight = prevWeek
        ? Math.max(...prevWeek.sets.filter(s => s.weight !== null).map(s => s.weight!), 0)
        : 0

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

                {/* ── CTA: Entrenar hoy ────────────────────────────────── */}
                {showStartCTA && (
                    <button
                        onClick={handleAddWeek}
                        className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold rounded-2xl py-4 text-sm transition-all shadow-lg shadow-blue-600/25"
                    >
                        <Play size={16} className="fill-white" />
                        {latestWeek === null ? 'Empezar primera semana' : 'Empezar nueva semana'}
                    </button>
                )}

                {/* Gráfica de progresión */}
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
                                    <div key={p.weekNumber} className="relative flex flex-col items-center gap-1 flex-1 min-w-0 group">
                                        {/* Glow for PR */}
                                        {p.isPR && (
                                            <div className="absolute inset-x-0 bottom-4 -top-2 bg-yellow-400/20 blur-md rounded-t-lg pointer-events-none" />
                                        )}
                                        <div className="w-full flex items-end justify-center z-10" style={{ height: '44px' }}>
                                            <div
                                                className={`w-full rounded-t-lg transition-all duration-300 ${p.isPR ? 'bg-gradient-to-t from-yellow-500 to-yellow-400 shadow-sm shadow-yellow-500/50' : isLast ? 'bg-gradient-to-t from-blue-600 to-blue-500 shadow-sm shadow-blue-500/40' : 'bg-blue-200 dark:bg-blue-500/30'}`}
                                                style={{ height: `${Math.max(heightPct, 8)}%` }}
                                            />
                                        </div>
                                        <span className={`font-display text-[10px] truncate w-full text-center ${p.isPR ? 'text-yellow-600 dark:text-yellow-500 font-bold' : 'text-gray-400 font-medium'}`}>{p.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between mt-3 px-1">
                            <span className="font-display text-xs text-gray-500 font-medium tracking-wide">S1: {progress[0]?.maxWeight ?? 0} kg</span>
                            <span className="font-display text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">
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
                            const isPR = progress.find(p => p.weekNumber === week.weekNumber)?.isPR
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
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isFullyDone ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20 text-white' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                                        <span className="font-display text-lg font-bold">
                                            {week.weekNumber}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display text-base font-bold text-gray-900 dark:text-white mb-1">
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
                                                        <Badge variant="blue">
                                                            {maxWeight} kg max
                                                            {isPR && (
                                                                <span className="ml-1 text-[11px]">👑 PR</span>
                                                            )}
                                                        </Badge>
                                                    )}
                                                    {weekVolume > 0 && (
                                                        <span className="text-xs text-gray-400">{weekVolume} kg vol.</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
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

                        {/* Botón nueva semana — solo si el CTA azul de arriba no está visible */}
                        {!showStartCTA && (
                            <button
                                onClick={handleAddWeek}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                            >
                                <TrendingUp size={18} />
                                Nueva semana
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de sugerencia de sobrecarga progresiva */}
            <BottomSheet
                open={pendingWeek !== null}
                onClose={() => handleApplyIncrement(0)}
                title="¿Subes peso esta semana?"
            >
                <div className="space-y-4">
                    {/* Contexto */}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-500/8 border border-green-200/60 dark:border-green-500/20">
                        <Zap size={16} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                Semana anterior completada con RIR ≤ 1
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                                Estabas cerca del fallo. Puedes subir el peso esta semana.
                                {prevMaxWeight > 0 && (
                                    <> Tu máximo fue <strong>{prevMaxWeight} kg</strong>.</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Opciones de incremento */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleApplyIncrement(2.5)}
                            className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
                        >
                            <span className="text-lg font-bold">+2.5</span>
                            <span className="text-xs opacity-80">kg</span>
                        </button>
                        <button
                            onClick={() => handleApplyIncrement(5)}
                            className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
                        >
                            <span className="text-lg font-bold">+5</span>
                            <span className="text-xs opacity-80">kg</span>
                        </button>
                        <button
                            onClick={() => handleApplyIncrement(0)}
                            className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
                        >
                            <span className="text-lg font-bold">=</span>
                            <span className="text-xs opacity-70">igual</span>
                        </button>
                    </div>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-600">
                        Podrás editarlo manualmente una vez dentro de la semana
                    </p>
                </div>
            </BottomSheet>
        </div>
    )
}
