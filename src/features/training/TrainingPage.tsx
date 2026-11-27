import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { getStorageErrorMessage, isStorageQuotaError } from '../../services/storageErrors'
import { useTimer } from '../../context/TimerContext'
import { useTraining } from './TrainingContext'
import { previousExercise, type SessionSet, type SetFields } from './session'

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
        <label className="min-w-0 flex-1 text-center text-xs text-gray-600 dark:text-gray-400">
            {field.label}
            <input
                ref={inputRef}
                type="number"
                inputMode={field.inputMode}
                min={field.min}
                max={field.max}
                step={field.step}
                aria-label={`${field.label}, serie ${index + 1}`}
                defaultValue={value ?? ''}
                placeholder={placeholder ?? '—'}
                autoComplete="off"
                disabled={disabled}
                className="block w-full mt-1 h-11 text-center text-base rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/15"
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
    return (
        <div className="flex items-end gap-2">
            <span className="w-7 pb-3 text-center text-xs text-gray-500" title={set.type}>
                {index + 1}{set.type === 'warmup' ? ' C' : set.type === 'dropset' ? ' D' : ''}
            </span>
            {fields.map(field => (
                <SetInput key={field.key} field={field} value={set[field.key]}
                    placeholder={last?.[field.key]?.toString()} index={index} disabled={disabled} onChange={onChange} />
            ))}
            <button
                type="button"
                aria-label={set.completed ? `Desmarcar serie ${index + 1}` : `Completar serie ${index + 1}`}
                aria-pressed={set.completed}
                disabled={disabled}
                onClick={onToggle}
                className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center transition-colors ${set.completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300'}`}
            >
                <Check size={19} />
            </button>
        </div>
    )
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
        <div key={active.id} className="mx-auto max-w-lg px-5 pt-5 pb-12 space-y-4">
            <header className="flex justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{active.programName}</p>
                    <h1 className="text-2xl font-bold">{active.dayName}</h1>
                </div>
                <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 min-h-11 flex items-center">Salir y continuar luego</Link>
            </header>
            <p className="text-xs text-gray-500" role="status">
                {saving ? 'Guardando…' : message ? 'Revisa el aviso de guardado.' : 'Guardado en este dispositivo'}
            </p>
            {message && <p role="alert" className="sticky top-2 z-20 p-3 rounded-xl text-sm bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">{message}</p>}
            {active.exercises.map(exercise => {
                const previous = previousExercise(exercise, history)
                return (
                    <section key={exercise.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                        <h2 className="font-semibold">{exercise.name}</h2>
                        {previous ? (
                            <details className="text-xs text-gray-500">
                                <summary className="cursor-pointer py-1">Última sesión · {new Date(previous.completedAt).toLocaleDateString('es-ES')}</summary>
                                <ul className="mt-1 space-y-1">
                                    {previous.sets.map(set => (
                                        <li key={set.id}>{set.weight} kg × {set.reps} reps{set.rir !== null ? ` · RIR ${set.rir}` : ''}</li>
                                    ))}
                                </ul>
                            </details>
                        ) : <p className="text-xs text-gray-500">Primera sesión registrada</p>}
                        {exercise.sets.map((set, index) => (
                            <SetEditor key={set.id} set={set} index={index} last={previous?.sets[index]} disabled={busy}
                                onChange={patch => perform(() => changeSet(active.id, exercise.id, set.id, patch))}
                                onToggle={() => void perform(async () => {
                                    if (await markSet(active.id, exercise.id, set.id, !set.completed)) startTimer()
                                })} />
                        ))}
                        <Button variant="ghost" size="sm" disabled={busy} icon={<Plus size={16} />}
                            onClick={() => void perform(() => addSet(active.id, exercise.id))}>Añadir serie</Button>
                    </section>
                )
            })}
            <p className="text-xs text-gray-500">El resumen incluirá las series que marques como completadas.</p>
            <Button fullWidth size="lg" disabled={busy || saving > 0} onClick={() => void finishActive()}>
                Finalizar entrenamiento
            </Button>
            <Button variant="ghost" fullWidth disabled={busy || saving > 0} onClick={() => setConfirmCancel(true)}>
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
