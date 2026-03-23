import { useState, useRef } from 'react'
import { Sun, Moon, Monitor, Trash2, Info, Download, Upload, FileJson, AlertTriangle } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useWorkoutContext } from '../context/WorkoutContext'
import { useTimer } from '../context/TimerContext'
import { useAudioBeep } from '../hooks/useAudioBeep'
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
    const { defaultRestTime, setDefaultRestTime } = useTimer()
    const [showClearModal, setShowClearModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importedData, setImportedData] = useState<string | null>(null)
    const [importFileName, setImportFileName] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { playStartBeep } = useAudioBeep()

    const [permission, setPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    )

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            showToast('Tu navegador no soporta notificaciones', 'error')
            return
        }
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result === 'granted') {
            showToast('Avisos activados', 'success')
            playStartBeep()
        } else if (result === 'denied') {
            showToast('Permiso denegado', 'error')
        }
    }

    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
    const totalWeeks = days.reduce((sum, d) => sum + d.exercises.reduce((es, e) => es + e.weeks.length, 0), 0)
    const totalSets = days.reduce((sum, d) => sum + d.exercises.reduce((es, e) => es + e.weeks.reduce((ws, w) => ws + w.sets.length, 0), 0), 0)

    // ── Exportar ──────────────────────────────────────────────────────────────
    const handleExport = () => {
        const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            days,
        }
        const json = JSON.stringify(backup, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const today = new Date().toISOString().slice(0, 10)
        const a = document.createElement('a')
        a.href = url
        a.download = `gymlab-backup-${today}.json`
        a.click()
        URL.revokeObjectURL(url)

        showToast('Backup exportado correctamente', 'success')
    }

    // ── Importar ──────────────────────────────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.name.endsWith('.json')) {
            showToast('El archivo debe ser un .json de GymLab', 'error')
            return
        }
        setImportFileName(file.name)
        const reader = new FileReader()
        reader.onload = ev => {
            try {
                const raw = ev.target?.result as string
                // Validación básica: debe tener version y days
                const parsed = JSON.parse(raw)
                if (!parsed.days || !Array.isArray(parsed.days)) {
                    showToast('Archivo no válido: no contiene datos de GymLab', 'error')
                    return
                }
                setImportedData(raw)
                setShowImportModal(true)
            } catch {
                showToast('Error al leer el archivo', 'error')
            }
        }
        reader.readAsText(file)
        // Reset input para poder seleccionar el mismo archivo otra vez
        e.target.value = ''
    }

    const handleConfirmImport = () => {
        if (!importedData) return
        try {
            const parsed = JSON.parse(importedData)
            localStorage.setItem('gymlab_days', JSON.stringify(parsed.days))
            showToast('Datos restaurados. Recargando…', 'success')
            setTimeout(() => window.location.reload(), 800)
        } catch {
            showToast('Error al importar los datos', 'error')
        }
        setShowImportModal(false)
    }

    const handleClearData = () => {
        localStorage.clear()
        window.location.reload()
    }

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

                {/* Timer settings */}
                <Section title="Entrenamiento">
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-3xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Descanso por defecto</p>
                            <p className="text-xs text-gray-500 mt-0.5">Automático tras completar serie</p>
                        </div>
                        <select
                            value={defaultRestTime}
                            onChange={e => setDefaultRestTime(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
                        >
                            <option value={60}>60s</option>
                            <option value={90}>1:30 min</option>
                            <option value={120}>2 min</option>
                            <option value={150}>2:30 min</option>
                            <option value={180}>3 min</option>
                        </select>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-3xl p-4 flex items-center justify-between mt-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Avisos de descanso</p>
                            <p className="text-xs text-gray-500 mt-0.5">Notificaciones y sonido final</p>
                        </div>
                        {permission === 'granted' ? (
                            <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1 rounded-lg">Activado</span>
                        ) : permission === 'denied' ? (
                            <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-1 rounded-lg">Bloqueado</span>
                        ) : (
                            <Button size="sm" onClick={requestNotificationPermission}>Activar</Button>
                        )}
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

                {/* Backup */}
                <Section title="Copia de seguridad">
                    <div className="space-y-3">

                        {/* Info card */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/8 border border-blue-200/60 dark:border-blue-500/20">
                            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Todos tus datos se guardan <strong>solo en este dispositivo y navegador</strong>.
                                Si desinstelas la app de la pantalla de inicio o cambias de navegador, los datos
                                se pierden. Exporta una copia antes de hacerlo.
                            </p>
                        </div>

                        {/* Exportar */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                                    <Download size={15} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Exportar datos</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-relaxed">
                                        Descarga un archivo <span className="font-mono text-gray-700 dark:text-gray-400">gymlab-backup-FECHA.json</span> con
                                        todos tus días, ejercicios, semanas y series. Guárdalo en tu galería, iCloud, Google Drive o donde prefieras.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Download size={14} />}
                                onClick={handleExport}
                                disabled={days.length === 0}
                            >
                                Exportar backup
                            </Button>
                        </div>

                        {/* Importar */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                    <Upload size={15} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Importar datos</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-relaxed">
                                        Selecciona un archivo <span className="font-mono text-gray-700 dark:text-gray-400">.json</span> exportado
                                        previamente desde GymLab. <strong className="text-amber-700 dark:text-amber-400">Reemplaza todos los datos actuales</strong>, así que
                                        asegúrate de exportar primero si tienes datos que quieres conservar.
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Upload size={14} />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Seleccionar archivo .json
                            </Button>
                        </div>

                        {/* Cómo hacerlo */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2.5">
                                <FileJson size={13} className="text-gray-500" />
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wide">Cómo hacer un traspaso</p>
                            </div>
                            <ol className="space-y-1.5 text-xs text-gray-600 dark:text-gray-500 list-none">
                                <li className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                                    Pulsa <strong>"Exportar backup"</strong> → se descarga el .json en este dispositivo
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                                    Pasa el archivo al nuevo dispositivo/navegador (AirDrop, Drive, Telegram a ti mismo…)
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                                    En GymLab, ve a Ajustes → <strong>"Seleccionar archivo .json"</strong> y elige el backup
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                                    Confirma la importación → la app se recarga con tus datos
                                </li>
                            </ol>
                        </div>
                    </div>
                </Section>

                {/* Danger zone */}
                <Section title="Zona de peligro">
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/8 border border-red-200/60 dark:border-red-500/20 space-y-3">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700 dark:text-red-300">
                                Eliminar todos los datos borrará días, ejercicios, series e historial de forma permanente.
                                <strong> Exporta un backup antes</strong> si quieres conservarlos.
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
                    <div className="flex flex-col items-center gap-3 py-2">
                        <img src="/icons/icon-512.png" alt="GymLab" className="h-40 w-auto object-contain" />
                        <div className="space-y-1 text-center text-sm text-gray-600 dark:text-gray-500">
                            <p>Versión <span className="font-medium text-gray-900 dark:text-gray-300">1.0.1</span></p>
                            <p>Datos guardados localmente en tu dispositivo.</p>
                            <p className="text-xs text-gray-500 dark:text-gray-600">Hecho con ❤️ para personas que entrenan en serio.</p>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Modal: Confirmar importación */}
            <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="¿Importar este backup?">
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-500/20">
                        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-semibold">Se reemplazarán todos tus datos actuales</p>
                            <p>Archivo: <span className="font-mono">{importFileName}</span></p>
                            <p>Tus {days.length} días actuales y todo su historial se perderán.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth onClick={() => setShowImportModal(false)}>Cancelar</Button>
                        <Button variant="primary" fullWidth icon={<Upload size={14} />} onClick={handleConfirmImport}>
                            Sí, importar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Confirmar borrado */}
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
