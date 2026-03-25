import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, Trash2, Dumbbell, CheckCircle2 } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { NumberInput } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { calcTotalVolume, getCompletedSets } from '../utils/helpers'
import { useTimer } from '../context/TimerContext'
import type { LoggedSet } from '../types'

export function WeekPage() {
    const { dayId, exerciseId, weekId } = useParams<{
        dayId: string
        exerciseId: string
        weekId: string
    }>()
    const navigate = useNavigate()
    const { days, addSet, updateSet, deleteSet } = useWorkoutContext()
    const { startTimer } = useTimer()

    const [deletingSetId, setDeletingSetId] = useState<string | null>(null)

    const day = days.find(d => d.id === dayId)
    const exercise = day?.exercises.find(e => e.id === exerciseId)
    const week = exercise?.weeks.find(w => w.id === weekId)

    if (!day || !exercise || !week) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
                <p className="text-gray-500">Semana no encontrada</p>
                <Button onClick={() => navigate(-1)} variant="ghost">Volver</Button>
            </div>
        )
    }

    const completed = getCompletedSets(week.sets)
    const total = week.sets.length
    const progress = total > 0 ? (completed / total) * 100 : 0
    const volume = calcTotalVolume(week.sets)

    const handleAddSet = () => {
        addSet(day.id, exercise.id, week.id)
    }

    const isSetComplete = (s: LoggedSet) => s.weight !== null && s.reps !== null

    const handleUpdateSet = (setId: string, updates: Partial<LoggedSet>) => {
        const targetSet = week.sets.find(s => s.id === setId)
        const wasComplete = targetSet ? isSetComplete(targetSet) : false

        updateSet(day.id, exercise.id, week.id, setId, updates)

        if (targetSet && !wasComplete) {
            const tempSet = { ...targetSet, ...updates }
            if (isSetComplete(tempSet)) {
                startTimer()
            }
        }
    }

    const handleDeleteSet = (setId: string) => {
        deleteSet(day.id, exercise.id, week.id, setId)
        setDeletingSetId(null)
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
                    <IconButton onClick={() => navigate(`/day/${day.id}/exercise/${exercise.id}`)} variant="ghost">
                        <ChevronLeft size={22} />
                    </IconButton>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {week.label ?? `Semana ${week.weekNumber}`}
                        </h1>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{exercise.name}</span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="flex-1 px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
                {/* Stats bar */}
                <div className="mb-5 bg-gray-50 dark:bg-white/5 rounded-3xl px-5 py-4 border border-gray-200/60 dark:border-white/8">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-4">
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
                                <p className="text-xs text-gray-500">series</p>
                            </div>
                            <div className="w-px bg-gray-200 dark:bg-white/10" />
                            <div>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{completed}</p>
                                <p className="text-xs text-gray-500">completadas</p>
                            </div>
                            <div className="w-px bg-gray-200 dark:bg-white/10" />
                            <div>
                                <p className="text-xl font-bold text-amber-500">{volume > 0 ? volume : '—'}</p>
                                <p className="text-xs text-gray-500">vol. kg</p>
                            </div>
                        </div>
                        {progress === 100 && total > 0 && (
                            <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 size={18} className="fill-green-500/20" />
                                <span className="text-xs font-semibold">¡Completo!</span>
                            </div>
                        )}
                    </div>
                    <ProgressBar value={progress} color={progress === 100 ? 'green' : 'blue'} />
                </div>

                {/* Column headers */}
                {week.sets.length > 0 && (
                    <div className="flex gap-3 px-2 mb-2">
                        <div className="w-8 shrink-0" />
                        <div className="flex gap-2 flex-1">
                            <div className="flex-1 text-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Peso</span>
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Reps</span>
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">RIR</span>
                            </div>
                        </div>
                        <div className="w-10 shrink-0" />
                    </div>
                )}

                {/* Sets */}
                {week.sets.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin series"
                        description="Añade tu primera serie para esta semana"
                        action={
                            <Button onClick={handleAddSet} icon={<Plus size={16} />}>
                                Añadir serie
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-2.5">
                        {week.sets.map((set, i) => {
                            const complete = isSetComplete(set)
                            const isDeleting = deletingSetId === set.id
                            return (
                                <div
                                    key={set.id}
                                    className={[
                                        'flex items-center gap-3 p-3 rounded-3xl border transition-all duration-200',
                                        complete
                                            ? 'bg-blue-50/80 dark:bg-blue-500/8 border-blue-200/60 dark:border-blue-500/20'
                                            : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/10',
                                    ].join(' ')}
                                >
                                    {/* Set number */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${complete ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-gray-200/80 dark:bg-white/10'}`}>
                                        {complete
                                            ? <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400 animate-bounce-in" />
                                            : <span className="font-display text-base font-bold text-gray-600 dark:text-gray-400">{i + 1}</span>
                                        }
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex gap-2 flex-1">
                                        <NumberInput
                                            label="kg"
                                            value={set.weight}
                                            onChange={v => handleUpdateSet(set.id, { weight: v })}
                                            min={0}
                                            step={0.5}
                                        />
                                        <NumberInput
                                            label="reps"
                                            value={set.reps}
                                            onChange={v => handleUpdateSet(set.id, { reps: v })}
                                            min={0}
                                            step={1}
                                        />
                                        <NumberInput
                                            label="rir"
                                            value={set.rir}
                                            onChange={v => handleUpdateSet(set.id, { rir: v })}
                                            min={0}
                                            max={10}
                                            step={1}
                                        />
                                    </div>

                                    {/* Delete */}
                                    {isDeleting ? (
                                        <button
                                            onClick={() => handleDeleteSet(set.id)}
                                            className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white animate-bounce-in shrink-0"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    ) : (
                                        <IconButton
                                            onClick={() => setDeletingSetId(set.id)}
                                            variant="danger"
                                            size="md"
                                        >
                                            <Trash2 size={15} />
                                        </IconButton>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Add set button */}
                {week.sets.length > 0 && (
                    <button
                        onClick={handleAddSet}
                        className="w-full flex items-center justify-center gap-2 py-4 mt-3 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                    >
                        <Plus size={18} />
                        Añadir serie
                    </button>
                )}

                {/* RIR hint */}
                {week.sets.length > 0 && (
                    <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-500/20">
                        <div className="flex items-center gap-2">
                            <Dumbbell size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                <span className="font-semibold">RIR:</span> 0 = al fallo · 1 = 1 rep en reserva · 2 = 2 reps…
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
