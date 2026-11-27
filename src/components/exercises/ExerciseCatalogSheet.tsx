import { ChevronDown, Dumbbell, Search, X } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog'
import type { CatalogExercise, MuscleGroup } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { searchExerciseCatalog } from './catalogSearch'

type Mode = 'add' | 'replace' | 'link'

interface ExerciseCatalogSheetProps {
    open: boolean
    onClose: () => void
    onSelect: (name: string, muscleGroup?: MuscleGroup, catalogId?: string) => void
    mode?: Mode
}

const modes = {
    add: { title: 'Añadir ejercicio', action: 'Añadir' },
    replace: { title: 'Sustituir ejercicio', action: 'Sustituir' },
    link: { title: 'Vincular ejercicio del catálogo', action: 'Vincular' },
} satisfies Record<Mode, { title: string; action: string }>

const muscleGroups = [...new Set(EXERCISE_CATALOG.map(exercise => exercise.muscleGroup))]
    .sort((first, second) => first.localeCompare(second, 'es'))

function ExerciseMedia({ src, alt, className, fallback }: {
    src?: string
    alt: string
    className: string
    fallback: ReactNode
}) {
    const [failed, setFailed] = useState(false)
    return src && !failed
        ? <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
        : fallback
}

function CatalogPicker({ mode, onSelect }: {
    mode: Mode
    onSelect: ExerciseCatalogSheetProps['onSelect']
}) {
    const [search, setSearch] = useState('')
    const [group, setGroup] = useState<MuscleGroup>()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [customName, setCustomName] = useState<string | null>(null)
    const searchInput = useRef<HTMLInputElement>(null)
    const { action } = modes[mode]

    const results = useMemo(() => searchExerciseCatalog(search, group), [search, group])

    const chooseExercise = (exercise: CatalogExercise) => {
        onSelect(exercise.name, exercise.muscleGroup, exercise.id)
    }

    return (
        <>
            {mode === 'replace' && <p className="px-4 pt-3 text-sm text-gray-600 dark:text-gray-400">El historial del ejercicio anterior se conserva.</p>}

            <div className="sticky top-0 z-10 space-y-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900">
                {customName === null && (
                    <>
                        <div className="relative">
                            <Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                            <input
                                ref={searchInput}
                                type="search"
                                aria-label="Buscar ejercicio"
                                placeholder="Buscar ejercicio"
                                enterKeyHint="search"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                className="min-h-11 w-full rounded-xl bg-gray-100 pl-10 pr-12 text-base text-gray-900 placeholder:text-gray-600 focus-visible:outline-2 focus-visible:outline-blue-500 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('')
                                        searchInput.current?.focus()
                                    }}
                                    aria-label="Limpiar búsqueda"
                                    className="absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-gray-600 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-gray-400"
                                >
                                    <X size={18} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Grupo muscular
                            <select
                                value={group ?? ''}
                                onChange={event => setGroup((event.target.value as MuscleGroup | '') || undefined)}
                                className="min-h-11 min-w-0 flex-1 rounded-xl bg-gray-100 px-2 text-base text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Todos</option>
                                {muscleGroups.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                    </>
                )}
                {mode !== 'link' && (
                    <Button variant="ghost" className="min-h-11" type="button" onClick={() => setCustomName(customName === null ? search.trim() : null)}>
                        {customName === null ? 'Crear ejercicio personalizado' : 'Volver al catálogo'}
                    </Button>
                )}
            </div>

            {customName !== null ? (
                <form className="space-y-3 p-4" onSubmit={event => {
                    event.preventDefault()
                    if (customName.trim()) onSelect(customName.trim())
                }}>
                    <Input autoFocus label="Nombre del ejercicio" value={customName} onChange={event => setCustomName(event.target.value)} />
                    <Button fullWidth size="lg" type="submit" disabled={!customName.trim()}>
                        {mode === 'replace' ? 'Sustituir por personalizado' : 'Crear y añadir'}
                    </Button>
                </form>
            ) : results.length ? (
                <ul role="list" className="divide-y divide-gray-200 px-4 dark:divide-white/10">
                    {results.map(exercise => {
                        const expanded = expandedId === exercise.id
                        return (
                            <li key={exercise.id} className="py-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-expanded={expanded}
                                        onClick={() => setExpandedId(expanded ? null : exercise.id)}
                                        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left focus-visible:outline-2 focus-visible:outline-blue-500"
                                    >
                                        <ExerciseMedia
                                            src={exercise.imageUrl}
                                            alt=""
                                            className="size-9 shrink-0 rounded-lg bg-gray-100 object-cover dark:bg-white/10"
                                            fallback={<Dumbbell className="size-9 shrink-0 rounded-lg bg-gray-100 p-2 text-gray-600 dark:bg-white/10 dark:text-gray-400" aria-hidden="true" />}
                                        />
                                        <div className="min-w-0 wrap-break-word">
                                            <span className="block text-sm font-semibold">{exercise.name}</span>
                                            <span className="block text-xs text-gray-600 dark:text-gray-400">{exercise.muscleGroup} · {exercise.equipment}</span>
                                        </div>
                                        <ChevronDown size={15} className={`shrink-0 text-gray-600 dark:text-gray-400 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`${action} ${exercise.name}`}
                                        className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:bg-white/10"
                                        onClick={() => chooseExercise(exercise)}
                                    >
                                        {action}
                                    </button>
                                </div>
                                {expanded && (
                                    <div className="py-2">
                                        <ExerciseMedia
                                            src={exercise.gifUrl}
                                            alt={`Demostración de ${exercise.name}`}
                                            className="mx-auto w-full max-w-[280px] rounded-xl bg-white object-cover"
                                            fallback={<p className="text-sm text-gray-600 dark:text-gray-400">Demostración no disponible.</p>}
                                        />
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <div className="space-y-1 p-4">
                    <p role="status" className="text-sm font-semibold">
                        {search.trim() ? `No encontramos «${search.trim()}».` : 'No hay ejercicios para este grupo muscular.'}
                    </p>
                    {group && (
                        <Button variant="ghost" type="button" className="min-h-11" onClick={() => setGroup(undefined)}>
                            Quitar filtro
                        </Button>
                    )}
                </div>
            )}
        </>
    )
}

export function ExerciseCatalogSheet({ open, onClose, onSelect, mode = 'add' }: ExerciseCatalogSheetProps) {
    return (
        <BottomSheet open={open} onClose={onClose} title={modes[mode].title} className="mx-auto h-[92dvh] max-w-lg" noPadding>
            {open && <CatalogPicker mode={mode} onSelect={(name, group, catalogId) => {
                onSelect(name, group, catalogId)
                onClose()
            }} />}
        </BottomSheet>
    )
}
