import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Dumbbell, Copy, Trash2, ChevronRight, RotateCcw, Pencil, X, Zap, ArrowUp, ArrowDown } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'

// ── Module-level flag so the banner survives route changes within the session ──
// Set to true when coming from onboarding, set to false when dismissed.
let _showOnboardingBanner = false

export function RoutinesPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const {
        days, addDay, deleteDay, duplicateDay, updateDay, reorderDays, showToast,
        currentDayIndex, resetRotation, setCurrentDayIndex, getCurrentDay,
        activeProgram,
    } = useWorkoutContext()

    // Detect fresh arrival from onboarding and arm the banner
    if (location.state?.fromOnboarding === true) {
        _showOnboardingBanner = true
        // Clear the state so a back-navigation doesn't re-arm it
        window.history.replaceState({}, '')
    }

    const [showAddModal, setShowAddModal] = useState(false)
    const [newDayName, setNewDayName] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [renameDay, setRenameDay] = useState<{ id: string; name: string } | null>(null)
    const [bannerVisible, setBannerVisible] = useState(() => _showOnboardingBanner)

    const dismissBanner = () => {
        _showOnboardingBanner = false
        setBannerVisible(false)
    }

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

    const handleReset = () => {
        resetRotation()
        setShowResetConfirm(false)
        showToast('Rotación reiniciada al Día 1', 'info')
    }

    const handleRename = () => {
        if (!renameDay) return
        const name = renameDay.name.trim()
        if (!name) return
        updateDay(renameDay.id, { name })
        showToast('Nombre actualizado', 'success')
        setRenameDay(null)
    }

    // Navigate to a day and dismiss banner (counts as first interaction)
    const handleNavigateToDay = (dayId: string) => {
        dismissBanner()
        navigate(`/day/${dayId}`)
    }

    const moveDay = (idx: number, direction: 'up' | 'down') => {
        const ids = days.map(d => d.id)
        if (direction === 'up' && idx <= 0) return
        if (direction === 'down' && idx >= ids.length - 1) return
        const swapWith = direction === 'up' ? idx - 1 : idx + 1
            ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]
        reorderDays(ids)
    }

    const activeDayIndex = days.length > 0 ? currentDayIndex % days.length : 0
    const currentDay = getCurrentDay(days)

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white">Rutinas</h1>
                        {activeProgram && (
                            <button
                                onClick={() => navigate('/programs')}
                                className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-none"
                            >
                                {activeProgram.name} →
                            </button>
                        )}
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-6 pb-24 max-w-lg mx-auto">
                {/* Subtitle */}
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-5">
                    {days.length === 0
                        ? 'Crea tu primer día de entrenamiento'
                        : `${days.length} día${days.length !== 1 ? 's' : ''} · rotación ${activeDayIndex + 1}/${days.length}`}
                </p>

                {/* ── Post-onboarding banner ─────────────────────────────── */}
                {bannerVisible && days.length > 0 && currentDay && (
                    <div className="relative mb-4 rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/25 p-5 overflow-hidden">


                        {/* Dismiss button */}
                        <button
                            onClick={dismissBanner}
                            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-xl text-blue-400 dark:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={14} />
                        </button>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-3 pr-6">
                            <span className="text-base font-bold text-blue-900 dark:text-blue-100">
                                Tu rutina está lista 💪
                            </span>
                        </div>

                        {/* Tips */}
                        <ul className="space-y-1.5 text-sm text-blue-800/80 dark:text-blue-200/70 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-blue-500">•</span>
                                <span>Renombra los días (Push, Pull, Piernas…)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-blue-500">•</span>
                                <span>Reordénalos con las flechas ↑↓</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-blue-500">•</span>
                                <span>Añade ejercicios a cada día</span>
                            </li>
                        </ul>

                        {/* Today CTA */}
                        <div className="border-t border-blue-200/50 dark:border-blue-500/20 pt-3">
                            <p className="text-xs text-blue-700/70 dark:text-blue-300/60 mb-2">
                                Hoy te toca: <span className="font-semibold text-blue-800 dark:text-blue-200">{currentDay.name}</span>
                            </p>
                            <button
                                onClick={() => handleNavigateToDay(currentDay.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all duration-150"
                            >
                                <Zap size={14} />
                                Empezar entrenamiento
                            </button>
                        </div>
                    </div>
                )}

                {days.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin rutinas"
                        description="Añade tus días de entrenamiento y configura los ejercicios"
                        action={
                            <Button onClick={() => setShowAddModal(true)} icon={<Plus size={16} />} size="lg">
                                Añadir día
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {days.map((day, i) => {
                            const isActive = i === activeDayIndex
                            return (
                                <div
                                    key={day.id}
                                    className={[
                                        'border rounded-3xl overflow-hidden transition-all duration-200',
                                        isActive
                                            ? 'bg-blue-50/80 dark:bg-blue-500/8 border-blue-300/60 dark:border-blue-500/30'
                                            : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-blue-500/30',
                                    ].join(' ')}
                                >
                                    <button
                                        className="w-full text-left px-5 pt-4 pb-3"
                                        onClick={() => handleNavigateToDay(day.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Number badge */}
                                            <div className={[
                                                'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5',
                                                isActive
                                                    ? 'bg-blue-600 dark:bg-blue-500'
                                                    : 'bg-blue-600/10 dark:bg-blue-500/15',
                                            ].join(' ')}>
                                                <span className={[
                                                    'text-sm font-bold',
                                                    isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400',
                                                ].join(' ')}>
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {day.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isActive && (
                                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                                                                HOY
                                                            </span>
                                                        )}
                                                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                    <Badge variant={isActive ? 'blue' : 'gray'}>
                                                        {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Actions */}
                                    <div className={[
                                        'flex items-center gap-1 px-3 pb-3 pt-2 border-t',
                                        isActive
                                            ? 'border-blue-200/40 dark:border-blue-500/15'
                                            : 'border-gray-100/80 dark:border-white/5',
                                    ].join(' ')}>
                                        {/* Reorder arrows */}
                                        <div className="flex gap-0.5 mr-auto">
                                            <IconButton
                                                onClick={() => moveDay(i, 'up')}
                                                variant="ghost"
                                                size="sm"
                                                title="Subir"
                                            >
                                                <ArrowUp size={13} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => moveDay(i, 'down')}
                                                variant="ghost"
                                                size="sm"
                                                title="Bajar"
                                            >
                                                <ArrowDown size={13} />
                                            </IconButton>
                                        </div>
                                        {/* Jump to this day in rotation */}
                                        {!isActive && (
                                            <button
                                                onClick={() => {
                                                    setCurrentDayIndex(i)
                                                    showToast(`Rotación → ${day.name}`, 'success')
                                                }}
                                                className="text-xs font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                            >
                                                Empezar aquí
                                            </button>
                                        )}
                                        <IconButton onClick={() => setRenameDay({ id: day.id, name: day.name })} variant="ghost" size="sm" title="Renombrar">
                                            <Pencil size={14} />
                                        </IconButton>
                                        <IconButton onClick={() => handleDuplicate(day.id)} variant="ghost" size="sm" title="Copiar día">
                                            <Copy size={14} />
                                        </IconButton>
                                        <IconButton onClick={() => setDeleteConfirm(day.id)} variant="danger" size="sm" title="Eliminar día">
                                            <Trash2 size={14} />
                                        </IconButton>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Add day */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                        >
                            <Plus size={18} />
                            Añadir día
                        </button>

                        {/* Reset rotation */}
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs font-medium"
                        >
                            <RotateCcw size={13} />
                            Reiniciar rotación al Día 1
                        </button>
                    </div>
                )}
            </div>

            {/* Add Day Modal */}
            <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setNewDayName('') }} title="Nuevo día">
                <div className="space-y-4">
                    <Input
                        label="Nombre del día"
                        placeholder="ej: Push — Empuje"
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

            {/* Delete confirm */}
            <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="¿Eliminar día?">
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

            {/* Rename modal */}
            <Modal open={renameDay !== null} onClose={() => setRenameDay(null)} title="Renombrar día">
                <div className="space-y-4">
                    <Input
                        label="Nombre del día"
                        value={renameDay?.name ?? ''}
                        onChange={e => setRenameDay(prev => prev ? { ...prev, name: e.target.value } : null)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
                        autoFocus
                    />
                    <Button fullWidth size="lg" onClick={handleRename} disabled={!renameDay?.name.trim()}>
                        Guardar
                    </Button>
                </div>
            </Modal>

            {/* Reset rotation confirm */}
            <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="¿Reiniciar rotación?">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        El índice volverá al Día 1. El historial de sesiones no se borra.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setShowResetConfirm(false)}>Cancelar</Button>
                        <Button variant="danger" fullWidth onClick={handleReset}>Reiniciar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
