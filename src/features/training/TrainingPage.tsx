import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, ChevronDown, LoaderCircle, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TimerWidget } from '../../components/ui/TimerWidget'
import { Modal } from '../../components/ui/Modal'
import { getStorageErrorMessage, isStorageQuotaError } from '../../services/storageErrors'
import { useTimer } from '../../context/TimerContext'
import { useTraining } from './TrainingContext'
import { goalLabel } from '../programs/goals'
import { previousExercise, recommendedIncrement, type SessionSet, type SetFields } from './session'

const fields = [
    { key: 'weight', label: 'kg', min: 0, max: 100000, step: 'any', inputMode: 'decimal' },
    { key: 'reps', label: 'Reps', min: 0, max: 100000, step: 1, inputMode: 'numeric' },
    { key: 'rir', label: 'RIR', min: 0, max: 10, step: 'any', inputMode: 'decimal' },
] as const

function SetInput({ field, value, placeholder, index, disabled, onChange }: {
    field: typeof fields[number]
    value: number | null
    placeholder?: string
    index: number
    disabled: boolean
    onChange: (fields: Partial<SetFields>) => Promise<boolean>
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const savedValue = useRef(value)
    useEffect(() => {
        savedValue.current = value
        const input = inputRef.current
        if (input && document.activeElement !== input) input.value = value?.toString() ?? ''
    }, [value])

    return (
        <label className="min-w-0 text-center text-xs text-gray-600 dark:text-gray-400">
            <span className="block pb-1 font-medium">{field.label}</span>
            <input
                ref={inputRef}
                type="number"
                inputMode={field.inputMode}
                enterKeyHint={field.key === 'rir' ? 'done' : 'next'}
                data-training-input
                min={field.min}
                max={field.max}
                step={field.step}
                aria-label={`${field.label}, serie ${index + 1}`}
                defaultValue={value ?? ''}
                placeholder={placeholder ?? '—'}
                autoComplete="off"
                disabled={disabled}
                className="block w-full min-w-0 h-12 px-0 text-center text-base font-semibold tabular-nums scroll-mt-28 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/15 placeholder:font-normal placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onBlur={event => { event.currentTarget.value = savedValue.current?.toString() ?? '' }}
                onChange={event => {
                    const input = event.currentTarget
                    const raw = input.value
                    const next = raw === '' ? null : input.valueAsNumber
                    void onChange({ [field.key]: next }).then(saved => {
                        if (!saved && input.value === raw) input.value = savedValue.current?.toString() ?? ''
                    })
                }}
            />
        </label>
    )
}

function SetEditor({
    set, last, index, onChange, onToggle, disabled,
}: {
    set: SessionSet
    last?: SessionSet
    index: number
    onChange: (fields: Partial<SetFields>) => Promise<boolean>
    onToggle: () => void
    disabled: boolean
}) {
    const typeLabel = set.type === 'warmup' ? 'Calentamiento' : set.type === 'dropset' ? 'Dropset' : undefined
    return (
        <li
            className={`grid grid-cols-[1.5rem_repeat(3,minmax(0,1fr))_3rem] items-end gap-1.5 rounded-2xl border px-2 py-2.5 sm:grid-cols-[2rem_repeat(3,minmax(0,1fr))_3.5rem] sm:gap-2 sm:px-3 ${set.completed
                ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40'
                : 'border-gray-200/80 bg-white/50 dark:border-white/10 dark:bg-black/20'}`}
            onKeyDown={event => {
                if (event.key !== 'Enter' || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return
                event.preventDefault()
                const inputs = Array.from(event.currentTarget.querySelectorAll('input'))
                const next = inputs[inputs.indexOf(event.target) + 1]
                if (next && !next.disabled) next.focus()
                else event.target.blur()
            }}
        >
            <span className="flex h-12 flex-col items-center justify-center text-xs font-bold tabular-nums text-gray-600 dark:text-gray-400">
                <span className="sr-only">Serie </span>{index + 1}
                {typeLabel && <abbr title={typeLabel} className="text-[10px] no-underline">{typeLabel[0]}</abbr>}
            </span>
            {fields.map(field => (
                <SetInput key={field.key} field={field} value={set[field.key]}
                    placeholder={last?.[field.key]?.toString()} index={index} disabled={disabled} onChange={onChange} />
            ))}
            <button
                type="button"
                aria-label={`Marcar serie ${index + 1} como hecha`}
                aria-pressed={set.completed}
                disabled={disabled}
                onClick={onToggle}
                className={`flex h-12 w-full touch-manipulation flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 ${set.completed
                    ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
                <Check size={18} aria-hidden="true" />
                <span aria-hidden="true">{set.completed ? 'Hecha' : 'Marcar'}</span>
            </button>
        </li>
    )
}

function resultLabel(set: SessionSet) {
    const type = set.type === 'warmup' ? ' · Calentamiento' : set.type === 'dropset' ? ' · Dropset' : ''
    return `${set.weight} kg × ${set.reps} reps${set.rir !== null ? ` · RIR ${set.rir}` : ''}${type}`
}

export function TrainingPage() {
    const navigate = useNavigate()
    const { startTimer, stopTimer } = useTimer()
    const { active, error, loading, history, changeSet, markSet, addSet, finish, cancel } = useTraining()
    const [saving, setSaving] = useState(0)
    const [busy, setBusy] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [message, setMessage] = useState('')
    const perform = async (action: () => Promise<void>): Promise<boolean> => {
        setSaving(count => count + 1)
        setMessage('')
        try {
            await action()
            return true
        } catch (cause) {
            setMessage(isStorageQuotaError(cause) ? getStorageErrorMessage(cause) : cause instanceof Error ? cause.message : 'No se pudo guardar. Vuelve a intentarlo.')
            return false
        } finally {
            setSaving(count => count - 1)
        }
    }

    if (!active || error) {
        return (
            <div className="mx-auto max-w-lg px-5 py-8 space-y-4">
                <h1 className="text-xl font-bold">Entrenamiento</h1>
                <p className="text-sm text-gray-500">{error ?? (loading ? 'Buscando tu entrenamiento…' : 'No hay un entrenamiento activo.')}</p>
                <Link to="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400">Volver a Inicio</Link>
            </div>
        )
    }

    const finishActive = async () => {
        if (busy || saving) return
        setBusy(true)
        await perform(async () => {
            const session = await finish(active.id)
            stopTimer()
            navigate(`/history/sessions/${session.id}`, { replace: true })
        })
        setBusy(false)
    }

    const cancelActive = async () => {
        if (busy || saving) return
        setBusy(true)
        setConfirmCancel(false)
        await perform(async () => {
            await cancel(active.id)
            stopTimer()
            navigate('/', { replace: true })
        })
        setBusy(false)
    }

    return (
        <div key={active.id} className="mx-auto max-w-lg space-y-4 px-3.5 pt-4 pb-8 sm:px-5">
            <header className="min-w-0 px-0.5">
                <p className="break-words text-sm font-medium text-gray-600 dark:text-gray-400">{active.programName}</p>
                <h1 className="break-words text-2xl font-bold">{active.dayName}</h1>
            </header>
            <div className="training-status sticky top-0 z-30 -mx-3.5 space-y-1.5 border-b border-gray-200/80 bg-white/95 px-3.5 pb-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-black/95 sm:-mx-5 sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2">
                    <Link to="/" aria-label="Salir y continuar luego" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400">
                        <ArrowLeft size={16} aria-hidden="true" />
                        Continuar luego
                    </Link>
                    <p role="status" aria-atomic="true"
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${message
                            ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : saving ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                        {message ? <AlertCircle size={13} aria-hidden="true" />
                            : saving ? <LoaderCircle size={13} aria-hidden="true" className="motion-safe:animate-spin" />
                                : <Check size={13} aria-hidden="true" />}
                        {message ? 'Revisa el aviso' : saving ? 'Guardando…' : 'Guardado en este dispositivo'}
                    </p>
                </div>
                <TimerWidget placement="training" />
                {message && <p role="alert" className="rounded-xl bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{message}</p>}
            </div>
            {active.exercises.map(exercise => {
                const previous = previousExercise(exercise, history)
                const goals = exercise.goals
                const completedSets = goals ? exercise.sets.filter(set => set.type === 'normal')
                    .slice(0, goals.sets).filter(set => set.completed).length : 0
                const increment = recommendedIncrement(goals, previous?.sets ?? [])
                const reference = previous?.sets.find(set => set.type === 'normal') ?? previous?.sets[0]
                const headingId = `training-exercise-${exercise.id}`
                return (
                    <section key={exercise.id} aria-labelledby={headingId}
                        className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5 sm:p-4">
                        <h2 id={headingId} className="break-words text-base font-bold">{exercise.name}</h2>
                        <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-2.5 dark:border-blue-900/60 dark:bg-blue-950/40">
                            <dl className={`grid gap-3 ${goals ? 'grid-cols-2' : ''}`}>
                                {goals && (
                                    <div className="min-w-0">
                                        <dt className="text-xs font-medium text-blue-700 dark:text-blue-300">Objetivo</dt>
                                        <dd className="mt-0.5 text-sm font-semibold">{goalLabel(goals)}</dd>
                                        <dd className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            {completedSets}/{goals.sets} series hechas · {goals.restSeconds ? `${goals.restSeconds} s de descanso` : 'Sin temporizador'}
                                        </dd>
                                    </div>
                                )}
                                <div className={goals ? 'min-w-0 border-l border-blue-100 pl-3 dark:border-blue-900/60' : 'min-w-0'}>
                                    <dt className="text-xs font-medium text-blue-700 dark:text-blue-300">Última sesión</dt>
                                    <dd className="mt-0.5 text-sm font-semibold">{reference ? resultLabel(reference) : 'Primera sesión registrada'}</dd>
                                    {previous && <dd className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {new Date(previous.completedAt).toLocaleDateString('es-ES')}
                                    </dd>}
                                </div>
                            </dl>
                            {increment !== null && (
                                <p className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                                    La última sesión cumple el objetivo actual. Puedes probar +{increment.toLocaleString('es-ES')} kg.
                                </p>
                            )}
                            {previous && previous.sets.length > 1 && (
                                <details className="group mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 [&::-webkit-details-marker]:hidden">
                                        <ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
                                        Ver todas las series de la última sesión
                                    </summary>
                                    <ul className="space-y-1 pb-1 pl-[18px]">
                                        {previous.sets.map(set => <li key={set.id}>{resultLabel(set)}</li>)}
                                    </ul>
                                </details>
                            )}
                        </div>
                        <ol role="list" className="space-y-2">
                            {exercise.sets.map((set, index) => {
                                const typeIndex = exercise.sets.slice(0, index).filter(item => item.type === set.type).length
                                const previousSets = previous?.sets.filter(item => item.type === set.type) ?? []
                                const last = previousSets.some(item => item.workingOrder !== undefined)
                                    ? previousSets.find(item => item.workingOrder === typeIndex + 1)
                                    : previousSets[typeIndex]
                                return <SetEditor key={set.id} set={set} index={index} last={last} disabled={busy}
                                    onChange={patch => perform(() => changeSet(active.id, exercise.id, set.id, patch))}
                                    onToggle={() => void perform(async () => {
                                        if (!await markSet(active.id, exercise.id, set.id, !set.completed)) return
                                        if (goals?.restSeconds === 0) stopTimer()
                                        else startTimer(goals?.restSeconds)
                                    })} />
                            })}
                        </ol>
                        <Button variant="ghost" size="sm" className="min-h-11" disabled={busy} icon={<Plus size={16} />}
                            onClick={() => void perform(() => addSet(active.id, exercise.id))}>Añadir serie</Button>
                    </section>
                )
            })}
            <p className="text-xs text-gray-500">El resumen incluirá las series que marques como completadas.</p>
            <Button fullWidth size="lg" disabled={busy || saving > 0} onClick={() => void finishActive()}>
                Finalizar entrenamiento
            </Button>
            <Button variant="ghost" fullWidth className="min-h-11" disabled={busy || saving > 0} onClick={() => setConfirmCancel(true)}>
                Cancelar entrenamiento
            </Button>
            <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="¿Cancelar entrenamiento?">
                <p className="mb-4 text-sm text-gray-500">Se descartarán las series de este entrenamiento en curso.</p>
                <div className="flex gap-2">
                    <Button variant="ghost" fullWidth onClick={() => setConfirmCancel(false)}>Seguir entrenando</Button>
                    <Button variant="danger" fullWidth onClick={() => void cancelActive()}>Descartar</Button>
                </div>
            </Modal>
        </div>
    )
}
