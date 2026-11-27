import { PROGRAM_TEMPLATES, buildTemplateDays } from '../features/programs/templates'
import { getActiveDays } from '../hooks/usePrograms'
import { Archive, CheckCircle2, ChevronRight, Dumbbell, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useWorkoutContext } from '../context/WorkoutContext'

export function ProgramsPage() {
    const navigate = useNavigate()
    const {
        programs,
        activeProgramId,
        setActiveProgram,
        createProgram,
        updateProgram,
        archiveProgram,
        deleteProgram,
    } = useWorkoutContext()

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [templateId, setTemplateId] = useState('')
    const template = PROGRAM_TEMPLATES.find(item => item.id === templateId)
    const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [archiveTarget, setArchiveTarget] = useState<string | null>(null)
    const [showArchived, setShowArchived] = useState(false)

    const activePrograms = programs.filter(p => !p.isArchived && !p.isDeleted)
    const archivedPrograms = programs.filter(p => p.isArchived && !p.isDeleted)

    const closeCreate = useCallback(() => {
        setShowCreateModal(false)
        setNewName('')
        setTemplateId('')
    }, [])

    const handleCreate = () => {
        const name = newName.trim() || template?.name
        if (!name) return
        createProgram(name, template && buildTemplateDays(template))
        closeCreate()
        navigate('/routines')
    }

    const handleRename = () => {
        if (!renameTarget) return
        const name = renameTarget.name.trim()
        if (!name) return
        updateProgram(renameTarget.id, { name })
        setRenameTarget(null)
    }

    const handleArchive = (id: string) => {
        archiveProgram(id)
        setArchiveTarget(null)
    }

    const handleDelete = (id: string) => {
        deleteProgram(id)
        setDeleteTarget(null)
    }

    const handleRestoreAndActivate = (id: string) => {
        updateProgram(id, { isArchived: false })
        setActiveProgram(id)
    }

    const ProgramCard = ({ program, archived = false }: { program: typeof programs[0]; archived?: boolean }) => {
        const isActive = program.id === activeProgramId
        const routineDays = getActiveDays(program)
        return (
            <div className={[
                'border rounded-3xl overflow-hidden transition-all duration-200',
                isActive
                    ? 'bg-blue-50/80 dark:bg-blue-500/8 border-blue-300/60 dark:border-blue-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10',
            ].join(' ')}>
                <button
                    className="w-full text-left px-5 pt-4 pb-3"
                    onClick={() => {
                        if (!archived) {
                            setActiveProgram(program.id)
                            navigate('/routines')
                        }
                    }}
                    disabled={archived}
                >
                    <div className="flex items-start gap-3">
                        <div className={[
                            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5',
                            isActive ? 'bg-blue-600 dark:bg-blue-500' : 'bg-blue-600/10 dark:bg-blue-500/15',
                        ].join(' ')}>
                            {isActive
                                ? <CheckCircle2 size={18} className="text-white" />
                                : <FolderOpen size={18} className="text-blue-600 dark:text-blue-400" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{program.name}</h3>
                                <div className="flex items-center gap-2 shrink-0">
                                    {isActive && (
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                                            ACTIVO
                                        </span>
                                    )}
                                    {!archived && <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                {routineDays.length} día{routineDays.length !== 1 ? 's' : ''} ·{' '}
                                {routineDays.reduce((s, d) => s + d.exercises.length, 0)} ejercicios
                            </p>
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
                    <div className="flex gap-1 mr-auto">
                        {!archived && (
                            <button
                                onClick={() => setRenameTarget({ id: program.id, name: program.name })}
                                aria-label={`Renombrar ${program.name}`}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>

                    {archived ? (
                        <button
                            onClick={() => handleRestoreAndActivate(program.id)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                            Restaurar y activar
                        </button>
                    ) : (
                        !isActive && (
                            <button
                                onClick={() => { setActiveProgram(program.id); navigate('/routines') }}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            >
                                Activar
                            </button>
                        )
                    )}

                    {!archived && (
                        <button
                            onClick={() => setArchiveTarget(program.id)}
                            aria-label={`Archivar ${program.name}`}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            title="Archivar"
                        >
                            <Archive size={14} />
                        </button>
                    )}

                    <button
                        onClick={() => setDeleteTarget(program.id)}
                        aria-label={`Eliminar ${program.name}`}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Programas</h1>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-6 pb-24 max-w-lg mx-auto">
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-5">
                    {activePrograms.length === 0
                        ? 'Crea tu primer bloque de entrenamiento'
                        : `${activePrograms.length} programa${activePrograms.length !== 1 ? 's' : ''} activos`}
                </p>

                {activePrograms.length + archivedPrograms.length === 0 ? (
                    <EmptyState
                        icon={<Dumbbell size={28} />}
                        title="Sin programas"
                        description="Crea un programa para organizar tus rutinas por bloques (fuerza, hipertrofia, etc.)"
                        action={
                            <Button onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />} size="lg">
                                Nuevo programa
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {activePrograms.map(p => <ProgramCard key={p.id} program={p} />)}

                        {/* Add program button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-600 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm font-medium"
                        >
                            <Plus size={18} />
                            Nuevo programa
                        </button>

                        {/* Archived section */}
                        {archivedPrograms.length > 0 && (
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowArchived(v => !v)}
                                    className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3"
                                >
                                    <Archive size={12} />
                                    Archivados ({archivedPrograms.length})
                                </button>
                                {showArchived && (
                                    <div className="space-y-3 opacity-60">
                                        {archivedPrograms.map(p => <ProgramCard key={p.id} program={p} archived />)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create modal */}
            <Modal open={showCreateModal} onClose={closeCreate} title="Nuevo programa">
                <div className="space-y-4">
                    <label className="block text-sm font-semibold">
                        Plantilla
                        <select value={templateId} onChange={event => setTemplateId(event.target.value)}
                            className="mt-1 block w-full rounded-xl bg-gray-100 dark:bg-white/10 p-3 font-normal">
                            <option value="">Programa vacío</option>
                            {PROGRAM_TEMPLATES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </label>
                    {template && <ul className="space-y-1 text-sm text-gray-500">
                        {template.days.map(day => <li key={day.name}>{day.name} · {day.main.length + day.accessories.length} ejercicios</li>)}
                    </ul>}
                    <Input
                        label="Nombre del programa"
                        placeholder={template?.name ?? "Ej. Fuerza primavera"}
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                        autoFocus
                    />

                    <Button fullWidth size="lg" onClick={handleCreate} disabled={!newName.trim() && !template}>
                        Crear programa
                    </Button>
                </div>
            </Modal>

            {/* Rename modal */}
            <Modal open={renameTarget !== null} onClose={() => setRenameTarget(null)} title="Renombrar programa">
                <div className="space-y-4">
                    <Input
                        label="Nombre"
                        value={renameTarget?.name ?? ''}
                        onChange={e => setRenameTarget(prev => prev ? { ...prev, name: e.target.value } : null)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
                        autoFocus
                    />
                    <Button fullWidth size="lg" onClick={handleRename} disabled={!renameTarget?.name.trim()}>
                        Guardar
                    </Button>
                </div>
            </Modal>

            {/* Archive confirm */}
            <Modal open={archiveTarget !== null} onClose={() => setArchiveTarget(null)} title="¿Archivar programa?">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        El programa y todos sus días quedarán guardados pero no aparecerá como activo. Puedes restaurarlo en cualquier momento.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setArchiveTarget(null)}>Cancelar</Button>
                        <Button variant="primary" fullWidth onClick={() => handleArchive(archiveTarget!)}>Archivar</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete confirm */}
            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="¿Eliminar programa?">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        El programa dejará de aparecer en Programas. Sus registros seguirán disponibles en Progresión.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="danger" fullWidth onClick={() => handleDelete(deleteTarget!)}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
