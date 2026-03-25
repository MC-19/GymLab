import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, Trash2, Pencil, ChevronRight, Dumbbell, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Modal } from '../components/ui/Modal'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { getMuscleGroups, getCompletedSets } from '../utils/helpers'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { Exercise } from '../types'

export function WorkoutDayPage() {
    const { dayId } = useParams<{ dayId: string }>()
    const navigate = useNavigate()
    const { days, updateDay, deleteExercise, addExercise, updateExercise, reorderExercises, completeSession, currentDayIndex } = useWorkoutContext()

    const day = days.find(d => d.id === dayId)

    const [showAddSheet, setShowAddSheet] = useState(false)
    const [editExercise, setEditExercise] = useState<Exercise | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [exName, setExName] = useState('')
    const [exMuscle, setExMuscle] = useState('')
    const [editDayName, setEditDayName] = useState(false)
    const [dayNameInput, setDayNameInput] = useState(day?.name ?? '')

    useDocumentTitle(`GymLab — ${day?.name || 'Día'}`)

    if (!day) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
                <p className="text-gray-500">Día no encontrado</p>
                <Button onClick={() => navigate('/')} variant="ghost">Volver</Button>
            </div>
        )
    }

    const handleAddExercise = () => {
        const name = exName.trim()
        if (!name) return
        addExercise(day.id, name, exMuscle || undefined)
        setExName('')
        setExMuscle('')
        setShowAddSheet(false)
    }

    const handleEditExercise = () => {
        if (!editExercise) return
        const name = exName.trim()
        if (!name) return
        updateExercise(day.id, editExercise.id, { name, muscleGroup: exMuscle || undefined })
        setEditExercise(null)
        setExName('')
        setExMuscle('')
    }

    const openEdit = (ex: Exercise) => {
        setEditExercise(ex)
        setExName(ex.name)
        setExMuscle(ex.muscleGroup ?? '')
    }

    const handleDelete = (exId: string) => {
        const ex = day.exercises.find(e => e.id === exId)
        deleteExercise(day.id, exId)
        setDeleteConfirm(null)
    }

    const handleSaveDayName = () => {
        const name = dayNameInput.trim()
        if (name) updateDay(day.id, { name })
        setEditDayName(false)
    }

    const moveExercise = (exId: string, direction: 'up' | 'down') => {
        if (!day) return
        const ids = day.exercises.map(e => e.id)
        const idx = ids.indexOf(exId)
        if (direction === 'up' && idx <= 0) return
        if (direction === 'down' && idx >= ids.length - 1) return
        const swapWith = direction === 'up' ? idx - 1 : idx + 1
            ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]
        reorderExercises(day.id, ids)
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
                    <IconButton onClick={() => navigate('/')} variant="ghost">
                        <ChevronLeft size={22} />
                    </IconButton>
                    <div className="flex-1 min-w-0">
                        {editDayName ? (
                            <input
                                autoFocus
                                value={dayNameInput}
                                onChange={e => setDayNameInput(e.target.value)}
                                onBlur={handleSaveDayName}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveDayName() }}
                                className="text-base font-bold w-full bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-white pb-0.5"
                            />
                        ) : (
                            <button
                                className="flex items-center gap-1.5 text-left group"
                                onClick={() => { setDayNameInput(day.name); setEditDayName(true) }}
                            >
                                <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{day.name}</h1>
                                <Pencil size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
                {/* Summary bar */}
                <div className="flex items-center gap-4 mb-5 bg-gray-50 dark:bg-white/5 rounded-3xl px-4 py-3 border border-gray-200/60 dark:border-white/8">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{day.exercises.length}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">ejercicios</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {day.exercises.reduce((t, e) => t + e.weeks.reduce((wt, w) => wt + w.sets.length, 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">series totales</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {day.exercises.reduce((t, e) => t + e.weeks.reduce((wt, w) => wt + getCompletedSets(w.sets), 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">completadas</p>
                    </div>
                </div>

                {/* Exercises */}
                {day.exercises.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin ejercicios"
                        description="Añade ejercicios a este día"
                        action={
                            <Button onClick={() => setShowAddSheet(true)} icon={<Plus size={16} />}>
                                Añadir ejercicio
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {day.exercises.map(ex => {
                            const allSets = ex.weeks.flatMap(w => w.sets)
                            const completed = getCompletedSets(allSets)
                            const total = allSets.length
                            const progress = total > 0 ? (completed / total) * 100 : 0

                            return (
                                <div
                                    key={ex.id}
                                    className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-3xl hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200"
                                >
                                    <button
                                        className="w-full text-left px-5 pt-4 pb-3"
                                        onClick={() => navigate(`/day/${day.id}/exercise/${ex.id}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white truncate">{ex.name}</span>
                                                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {ex.muscleGroup && <Badge variant="gold">{ex.muscleGroup}</Badge>}
                                                    <Badge variant={completed === total && total > 0 ? 'green' : 'gray'}>
                                                        {total > 0 ? `${completed}/${total} series` : 'Sin series'}
                                                    </Badge>
                                                </div>
                                                {total > 0 && (
                                                    <div className="mt-2.5">
                                                        <ProgressBar value={progress} color={progress === 100 ? 'green' : 'blue'} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                    {/* Actions */}
                                    <div className={[
                                        'flex items-center gap-1 px-3 pb-3 border-t pt-2',
                                        'border-gray-100/80 dark:border-white/5',
                                    ].join(' ')}>
                                        {/* Reorder */}
                                        <div className="flex gap-0.5 mr-auto">
                                            <IconButton
                                                onClick={() => moveExercise(ex.id, 'up')}
                                                variant="ghost"
                                                size="sm"
                                                title="Subir"
                                            >
                                                <ArrowUp size={13} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => moveExercise(ex.id, 'down')}
                                                variant="ghost"
                                                size="sm"
                                                title="Bajar"
                                            >
                                                <ArrowDown size={13} />
                                            </IconButton>
                                        </div>
                                        <IconButton onClick={() => openEdit(ex)} variant="ghost" size="sm">
                                            <Pencil size={14} />
                                        </IconButton>
                                        <IconButton onClick={() => setDeleteConfirm(ex.id)} variant="danger" size="sm">
                                            <Trash2 size={14} />
                                        </IconButton>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Finalizar entrenamiento */}
                        <button
                            onClick={() => {
                                const nextIndex = (currentDayIndex + 1) % days.length
                                const nextDay = days[nextIndex]
                                completeSession(day.id, days.length)
                                navigate('/')
                            }}
                            className="w-full flex items-center justify-center gap-2 py-4 mt-1 rounded-3xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all duration-150 shadow-md shadow-blue-600/25"
                        >
                            <CheckCircle2 size={18} />
                            Finalizar entrenamiento
                        </button>

                        {/* Add exercise button */}
                        <button
                            onClick={() => setShowAddSheet(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium mt-1"
                        >
                            <Plus size={18} />
                            Añadir ejercicio
                        </button>
                    </div>
                )}
            </div>

            {/* Add Exercise Sheet */}
            <BottomSheet open={showAddSheet} onClose={() => { setShowAddSheet(false); setExName(''); setExMuscle('') }} title="Nuevo ejercicio">
                <div className="space-y-4">
                    <Input
                        label="Nombre"
                        placeholder="ej: Press de banca"
                        value={exName}
                        onChange={e => setExName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddExercise() }}
                        autoFocus
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Grupo muscular
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {getMuscleGroups().map(g => (
                                <button
                                    key={g}
                                    onClick={() => setExMuscle(g === exMuscle ? '' : g)}
                                    className={[
                                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                                        exMuscle === g
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15',
                                    ].join(' ')}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button fullWidth size="lg" onClick={handleAddExercise} disabled={!exName.trim()}>
                        Añadir ejercicio
                    </Button>
                </div>
            </BottomSheet>

            {/* Edit Exercise Sheet */}
            <BottomSheet open={editExercise !== null} onClose={() => { setEditExercise(null); setExName(''); setExMuscle('') }} title="Editar ejercicio">
                <div className="space-y-4">
                    <Input
                        label="Nombre"
                        value={exName}
                        onChange={e => setExName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditExercise() }}
                        autoFocus
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Grupo muscular
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {getMuscleGroups().map(g => (
                                <button
                                    key={g}
                                    onClick={() => setExMuscle(g === exMuscle ? '' : g)}
                                    className={[
                                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                                        exMuscle === g
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15',
                                    ].join(' ')}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button fullWidth size="lg" onClick={handleEditExercise} disabled={!exName.trim()}>
                        Guardar cambios
                    </Button>
                </div>
            </BottomSheet>

            {/* Delete Confirm */}
            <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="¿Eliminar ejercicio?">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Se eliminarán todas las series de este ejercicio. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button variant="danger" fullWidth onClick={() => handleDelete(deleteConfirm!)}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
