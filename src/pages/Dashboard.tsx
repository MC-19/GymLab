import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Dumbbell, Copy, Trash2, ChevronRight } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { getRelativeDate } from '../utils/helpers'

export function Dashboard() {
    const { days, addDay, deleteDay, duplicateDay, showToast } = useWorkoutContext()
    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)
    const [newDayName, setNewDayName] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const handleAddDay = () => {
        const name = newDayName.trim()
        if (!name) return
        addDay(name)
        setNewDayName('')
        setShowAddModal(false)
        showToast(`"${name}" añadido`, 'success')
    }

    const handleDelete = (dayId: string) => {
        const day = days.find(d => d.id === dayId)
        deleteDay(dayId)
        setDeleteConfirm(null)
        showToast(`"${day?.name}" eliminado`, 'info')
    }

    const handleDuplicate = (dayId: string) => {
        const copy = duplicateDay(dayId)
        if (copy) showToast(`"${copy.name}" creado`, 'success')
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <img
                        src="/icons/icon-512.png"
                        alt="GymLab"
                        className="h-30 w-auto object-contain"
                    />
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
                {/* Hero */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis entrenamientos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                        {days.length === 0
                            ? 'Crea tu primer día de entrenamiento'
                            : `${days.length} día${days.length !== 1 ? 's' : ''} configurados`}
                    </p>
                </div>

                {/* Days list */}
                {days.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin entrenamientos"
                        description="Añade tu primer día para empezar"
                        action={
                            <Button onClick={() => setShowAddModal(true)} icon={<Plus size={16} />} size="lg">
                                Añadir día
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {days.map((day, i) => (
                            <div
                                key={day.id}
                                className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/40 dark:hover:border-blue-500/30 transition-all duration-200"
                            >
                                <button
                                    className="w-full text-left px-5 pt-4 pb-3"
                                    onClick={() => navigate(`/day/${day.id}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Number badge */}
                                        <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 justify-between">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{day.name}</h3>
                                                <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <Badge variant="blue">
                                                    {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                                                </Badge>

                                            </div>
                                        </div>
                                    </div>
                                </button>
                                {/* Actions — always visible for touch devices */}
                                <div className="flex items-center justify-end gap-1 px-3 pb-3 border-t border-gray-100/80 dark:border-white/5 pt-2">
                                    <IconButton
                                        onClick={() => handleDuplicate(day.id)}
                                        variant="ghost"
                                        size="sm"
                                        title="Copiar día"
                                    >
                                        <Copy size={14} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setDeleteConfirm(day.id)}
                                        variant="danger"
                                        size="sm"
                                        title="Eliminar día"
                                    >
                                        <Trash2 size={14} />
                                    </IconButton>
                                </div>
                            </div>
                        ))}

                        {/* Add button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                        >
                            <Plus size={18} />
                            Añadir día de entrenamiento
                        </button>
                    </div>
                )}
            </div>

            {/* Add Day Modal */}
            <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setNewDayName('') }} title="Nuevo día">
                <div className="space-y-4">
                    <Input
                        label="Nombre del día"
                        placeholder="ej: Día 1 — Push"
                        value={newDayName}
                        onChange={e => setNewDayName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddDay() }}
                        autoFocus
                    />
                    <Button fullWidth size="lg" onClick={handleAddDay} disabled={!newDayName.trim()}>
                        Crear día
                    </Button>
                </div>
            </Modal>

            {/* Delete confirm modal */}
            <Modal
                open={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                title="¿Eliminar día?"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Se eliminarán todos los ejercicios y series de este día. Esta acción no se puede deshacer.
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
