import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { getStorageErrorMessage, isStorageQuotaError } from '../../services/storageErrors'
import { useWorkoutContext } from '../../context/WorkoutContext'
import type { WorkoutDay } from '../../types'
import { useTraining } from './TrainingContext'

export function StartTrainingButton({ day, followRotation = false }: { day: WorkoutDay | null; followRotation?: boolean }) {
    const navigate = useNavigate()
    const { activeProgram, showToast } = useWorkoutContext()
    const { active, loading, error, rotationError, start } = useTraining()
    const [starting, setStarting] = useState(false)

    const begin = async () => {
        if (active) {
            navigate('/training')
            return
        }
        if (!activeProgram || !day || starting) return
        if (!day.exercises.length) {
            navigate(`/day/${day.id}`)
            return
        }
        setStarting(true)
        try {
            await start(activeProgram, day, followRotation)
            navigate('/training')
        } catch (cause) {
            const message = isStorageQuotaError(cause) ? getStorageErrorMessage(cause)
                : cause instanceof Error ? cause.message : 'No se pudo empezar el entrenamiento.'
            showToast(message, 'error')
        } finally {
            setStarting(false)
        }
    }

    if (!day && !active && !error && !rotationError) return null
    return (
        <div className="space-y-2">
            <Button fullWidth size="lg" icon={<Play size={18} />} disabled={loading || starting || !!error || (!active && !!rotationError)} onClick={begin}>
                {active ? `Reanudar · ${active.dayName}` : day?.exercises.length ? 'Empezar entrenamiento' : 'Configurar rutina'}
            </Button>
            {(error ?? rotationError) && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error ?? rotationError}</p>}
        </div>
    )
}
