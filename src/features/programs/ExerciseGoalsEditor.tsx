import { useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Exercise, ExerciseGoals } from '../../types'
import { DEFAULT_GOALS, GOAL_FIELDS, isExerciseGoals } from './goals'

export function ExerciseGoalsEditor({ exercise, onClose, onSave }: {
    exercise: Exercise
    onClose: () => void
    onSave: (goals: ExerciseGoals | undefined) => void
}) {
    const [values, setValues] = useState(() => {
        const initial = exercise.goals ?? DEFAULT_GOALS
        return Object.fromEntries(GOAL_FIELDS.map(({ key }) => [key, String(initial[key])]))
    })
    const goals = Object.fromEntries(GOAL_FIELDS.map(({ key }) => [
        key, values[key].trim() === '' ? NaN : Number(values[key]),
    ]))
    const valid = isExerciseGoals(goals)

    return (
        <BottomSheet open onClose={onClose} title="Objetivos del ejercicio">
            <form className="space-y-4" onSubmit={event => {
                event.preventDefault()
                if (valid) onSave(goals)
            }}>
                <h3 className="font-semibold">{exercise.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                    {GOAL_FIELDS.map(({ key, label, min, max, step }) => (
                        <Input key={key} label={label} type="number" min={min} max={max} step={step}
                            inputMode={step === 1 ? 'numeric' : 'decimal'} required
                            value={values[key]} onChange={event => setValues({ ...values, [key]: event.target.value })} />
                    ))}
                </div>
                <p className="text-xs text-gray-500">Un descanso de 0 s desactiva el temporizador para este ejercicio. Un incremento de 0 kg desactiva la recomendación.</p>
                {Number(values.minReps) > Number(values.maxReps) && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">Las reps mínimas deben ser menores o iguales a las máximas.</p>
                )}
                <Button type="submit" fullWidth disabled={!valid}>Guardar objetivos</Button>
                {exercise.goals && <Button type="button" variant="ghost" fullWidth onClick={() => onSave(undefined)}>Quitar objetivos</Button>}
            </form>
        </BottomSheet>
    )
}
