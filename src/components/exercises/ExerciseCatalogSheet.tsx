import { useState, useMemo } from 'react'
import { Plus, Search, Dumbbell, Play, X, ChevronRight, Check } from 'lucide-react'
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog'
import type { MuscleGroup, CatalogExercise } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

interface ExerciseCatalogSheetProps {
    open: boolean
    onClose: () => void
    onSelect: (name: string, muscleGroup?: MuscleGroup, catalogId?: string) => void
    title?: string
    actionLabel?: string
}

const MUSCLE_GROUPS: (MuscleGroup | 'Todos')[] = [
    'Todos',
    'Pecho',
    'Espalda',
    'Hombros',
    'Bíceps',
    'Tríceps',
    'Antebrazos',
    'Trapecios',
    'Cuádriceps',
    'Femorales',
    'Glúteos',
    'Gemelos',
    'Lumbares',
    'Aductores',
    'Abductores',
    'Abdomen',
    'Cardio',
    'Cuerpo completo'
]

export function ExerciseCatalogSheet({ open, onClose, onSelect, title = "Añadir Ejercicio", actionLabel = "Añadir a mi rutina" }: ExerciseCatalogSheetProps) {
    const [search, setSearch] = useState('')
    const [filterGroup, setFilterGroup] = useState<MuscleGroup | 'Todos'>('Todos')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [customName, setCustomName] = useState('')

    // Reset state when opening/closing
    useMemo(() => {
        if (!open) {
            setTimeout(() => {
                setSearch('')
                setFilterGroup('Todos')
                setExpandedId(null)
                setCustomName('')
            }, 300)
        }
    }, [open])

    const filteredExercises = useMemo(() => {
        return EXERCISE_CATALOG.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
            const matchesGroup = filterGroup === 'Todos' || ex.muscleGroup === filterGroup
            return matchesSearch && matchesGroup
        })
    }, [search, filterGroup])

    const handleSelect = (ex: CatalogExercise) => {
        onSelect(ex.name, ex.muscleGroup, ex.id)
        onClose()
    }

    const handleAddCustom = () => {
        if (!customName.trim()) return
        onSelect(customName.trim())
        onClose()
    }

    return (
        <BottomSheet
            open={open}
            onClose={onClose}
            className="h-[95vh]"
            noPadding
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-4">
                {/* Fixed Search and Filter Header */}
                <div className="px-4 pb-3 pt-3 space-y-3 shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200/60 dark:border-white/5">
                    
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={title ? `${title}...` : "Buscar ejercicio..."}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 bg-gray-100 dark:bg-white/5 border border-transparent rounded-2xl text-[15px] focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500/40 focus:shadow-sm transition-all outline-none text-gray-900 dark:text-white"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1.5 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 snap-x">
                        {MUSCLE_GROUPS.map(group => (
                            <button
                                key={group}
                                onClick={() => setFilterGroup(group)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all snap-start ${filterGroup === group
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                {group}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Catalog List */}
                <div className="overflow-y-auto px-4 py-2 space-y-2">
                    {filteredExercises.length > 0 ? (
                        filteredExercises.map(ex => {
                            const isExpanded = expandedId === ex.id
                            return (
                                <div
                                    key={ex.id}
                                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded
                                            ? 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20'
                                            : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                                        className="w-full flex items-center gap-3 p-3 text-left"
                                    >
                                        {/* Thumbnail Placeholder */}
                                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                                            {ex.imageUrl ? (
                                                <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                                            ) : (
                                                <Dumbbell size={20} className="text-gray-400 dark:text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-[15px] truncate mb-0.5">
                                                {ex.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{ex.muscleGroup}</span>
                                                <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-white/10">
                                                    {ex.equipment}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center">
                                            {isExpanded ? (
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <ChevronRight size={18} className="rotate-90 transition-transform" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold transition-all">
                                                    <Plus size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="p-4 pt-0 animate-slide-up border-t border-blue-100 dark:border-blue-900/30 mt-2">
                                            <div className="py-4 flex justify-center">
                                                {ex.gifUrl ? (
                                                    <img src={ex.gifUrl} alt={ex.name} className="rounded-xl w-full max-w-[280px] object-cover bg-white" loading="lazy" />
                                                ) : (
                                                    <div className="w-full max-w-[280px] aspect-video rounded-2xl bg-gray-200 dark:bg-white/10 flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-300/50 dark:border-white/10">
                                                        <Play size={24} className="opacity-50" />
                                                        <span className="text-xs font-semibold">GIF no disponible</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleSelect(ex)}
                                                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[15px] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <Plus size={18} />
                                                {actionLabel}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="py-8 text-center px-4">
                            <Dumbbell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-900 dark:text-white font-semibold">No hemos encontrado "{search}"</p>
                            <p className="text-sm text-gray-500 mt-1 mb-6">Puedes crearlo como ejercicio personalizado.</p>

                            <Input
                                placeholder="Ej: Curl Araña"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                            />
                            <button
                                onClick={handleAddCustom}
                                disabled={!customName.trim()}
                                className="w-full mt-3 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-[15px] disabled:opacity-50 active:scale-95 transition-all"
                            >
                                Crear "{customName || '...'}"
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </BottomSheet>
    )
}
