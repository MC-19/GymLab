import { useState } from 'react'
import { Sun, Moon, Monitor, Trash2, Info } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useWorkoutContext } from '../context/WorkoutContext'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { ThemeMode } from '../types'

const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'Sistema', icon: <Monitor size={18} /> },
    { value: 'light', label: 'Claro', icon: <Sun size={18} /> },
    { value: 'dark', label: 'Oscuro', icon: <Moon size={18} /> },
]

export function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { days, showToast } = useWorkoutContext()
    const [showClearModal, setShowClearModal] = useState(false)

    const handleClearData = () => {
        localStorage.clear()
        window.location.reload()
    }

    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
    const totalWeeks = days.reduce((sum, d) => sum + d.exercises.reduce((es, e) => es + e.weeks.length, 0), 0)
    const totalSets = days.reduce((sum, d) => sum + d.exercises.reduce((es, e) => es + e.weeks.reduce((ws, w) => ws + w.sets.length, 0), 0), 0)

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center px-5 h-14 max-w-lg mx-auto">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Ajustes</h1>
                </div>
            </div>

            <div className="px-5 pt-5 pb-8 max-w-lg mx-auto space-y-6">
                {/* Theme */}
                <Section title="Apariencia">
                    <div className="flex gap-2">
                        {themeOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { setTheme(opt.value); showToast(`Tema: ${opt.label}`, 'info') }}
                                className={[
                                    'flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border text-xs font-medium transition-all duration-150',
                                    theme === opt.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/30'
                                        : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20',
                                ].join(' ')}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </Section>

                {/* Data stats */}
                <Section title="Mis datos">
                    <div className="space-y-3">
                        <StatRow label="Días de entrenamiento" value={String(days.length)} />
                        <StatRow label="Ejercicios configurados" value={String(totalExercises)} />
                        <StatRow label="Semanas registradas" value={String(totalWeeks)} />
                        <StatRow label="Series totales" value={String(totalSets)} />
                    </div>
                </Section>

                {/* Danger zone */}
                <Section title="Zona de peligro">
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/8 border border-red-200/60 dark:border-red-500/20 space-y-3">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700 dark:text-red-300">
                                Eliminar todos los datos borrará días, ejercicios, series e historial de forma permanente.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => setShowClearModal(true)}
                        >
                            Eliminar todos los datos
                        </Button>
                    </div>
                </Section>

                {/* About */}
                <Section title="Sobre GymLab">
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-500">
                        <p>Versión <span className="font-medium text-gray-900 dark:text-gray-300">1.0.0</span></p>
                        <p>Datos guardados localmente en tu dispositivo.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">Hecho con ❤️ para personas que entrenan en serio.</p>
                    </div>
                </Section>
            </div>

            {/* Clear data modal */}
            <Modal open={showClearModal} onClose={() => setShowClearModal(false)} title="¿Eliminar todos los datos?">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Se eliminarán <strong>{days.length} días</strong>, <strong>{totalExercises} ejercicios</strong> y todo el historial.
                        Esta acción <strong>no se puede deshacer</strong>.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setShowClearModal(false)}>Cancelar</Button>
                        <Button variant="danger" fullWidth onClick={handleClearData}>Sí, eliminar todo</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest">{title}</h2>
            {children}
        </div>
    )
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/8 last:border-0">
            <span className="text-sm text-gray-700 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
        </div>
    )
}
