import { useState } from 'react'
import { Sparkles, CheckCircle2, BellRing, Smartphone, Download } from 'lucide-react'
import { useAudioBeep } from '../../hooks/useAudioBeep'

interface OnboardingCardProps {
    onSelect: (count: number, restSeconds: number) => Promise<void>
}

const DAY_LABELS = ['A', 'B', 'C', 'D', 'E']
const OPTIONS = [2, 3, 4, 5]

export function OnboardingCard({ onSelect }: OnboardingCardProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [selectedDays, setSelectedDays] = useState<number | null>(null)
    const [selectedRest, setSelectedRest] = useState<number | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const { playStartBeep } = useAudioBeep()

    const handleSelectDays = (count: number) => {
        setSelectedDays(count)
        setStep(2)
    }

    const handleSelectRest = (seconds: number) => {
        setSelectedRest(seconds)
        setStep(3)
    }

    const handleRequestNotifications = async () => {
        if ('Notification' in window) {
            const res = await Notification.requestPermission()
            if (res === 'granted') {
                playStartBeep()
            }
        }
        setStep(4)
    }

    const handleFinish = async () => {
        if (isCreating || !selectedDays || !selectedRest) return
        setIsCreating(true)
        await onSelect(selectedDays, selectedRest)
    }

    const REST_OPTIONS = [
        { label: '60s', value: 60 },
        { label: '90s', value: 90 },
        { label: '2 min', value: 120 },
        { label: '3 min', value: 180 },
    ]

    if (step === 2) {
        return (
            <div className="flex flex-col items-center px-2 pt-8 pb-4 animate-slide-up">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center mb-5">
                    <span className="text-2xl">⏱️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                    Tiempo de descanso
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-8 leading-relaxed">
                    ¿Cuánto sueles descansar entre series?
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-[240px] mb-5">
                    {REST_OPTIONS.map(opt => {
                        const isLoading = selectedRest === opt.value && isCreating
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSelectRest(opt.value)}
                                disabled={isCreating}
                                className={[
                                    'py-4 rounded-3xl flex items-center justify-center',
                                    'font-bold text-base border-2 transition-all duration-200',
                                    'disabled:cursor-not-allowed',
                                    selectedRest === opt.value
                                        ? 'bg-amber-500 border-amber-500 text-white scale-105 shadow-lg shadow-amber-500/30'
                                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white hover:border-amber-500/60 hover:bg-amber-50/50 dark:hover:bg-amber-500/10',
                                    !selectedRest && isCreating ? 'opacity-40' : '',
                                ].join(' ')}
                            >
                                {isLoading ? (
                                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                ) : (
                                    opt.label
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (step === 3) {
        return (
            <div className="flex flex-col items-center px-4 pt-8 pb-4 animate-slide-up w-full">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center mb-5">
                    <BellRing size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                    Avisos de descanso
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-8 leading-relaxed max-w-[280px]">
                    GymLab puede avisarte con un sonido y notificación cuando termine tu descanso, incluso si no tienes la pantalla abierta.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-[260px]">
                    <button
                        onClick={handleRequestNotifications}
                        className="w-full py-3.5 rounded-2xl font-bold text-[15px] bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        Activar notificaciones
                    </button>
                    <button
                        onClick={() => setStep(4)}
                        className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                    >
                        Omitir por ahora
                    </button>
                </div>
            </div>
        )
    }

    if (step === 4) {
        return (
            <div className="flex flex-col items-center px-4 pt-8 pb-4 animate-slide-up w-full">
                <div className="w-16 h-16 rounded-3xl bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center mb-5">
                    <Smartphone size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                    Instala la App
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6 leading-relaxed max-w-[280px]">
                    GymLab es una Web App (PWA). Para que funcione rápido y <strong>sin internet</strong>, añádela a tu pantalla de inicio:
                </p>
                
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl p-4 w-full max-w-[280px] mb-8 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold">🍎</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight pt-0.5">
                            <strong>iOS Safari:</strong> Toca Compartir y luego <span className="font-semibold text-gray-900 dark:text-white">Añadir a inicio</span>.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold">🤖</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight pt-0.5">
                            <strong>Android:</strong> Toca menú (⋮) y elige <span className="font-semibold text-gray-900 dark:text-white">Instalar aplicación</span>.
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-[260px]">
                    <button
                        onClick={handleFinish}
                        disabled={isCreating}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/20 dark:shadow-white/20 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isCreating ? (
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        ) : (
                            <>
                                <Download size={18} />
                                ¡Entendido, a entrenar!
                            </>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center px-2 pt-8 pb-4 animate-fade-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center mb-5">
                <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                Crea tu rutina en segundos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-8 leading-relaxed">
                GymLab rotará tus días automáticamente.<br />
                Solo elige cuántos días entrenas.
            </p>

            {/* Question */}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">
                ¿Cuántos días quieres entrenar?
            </p>

            {/* Options */}
            <div className="flex gap-3 mb-5">
                {OPTIONS.map(count => {
                    const isSelected = selectedDays === count
                    const isLoading = isSelected && isCreating
                    return (
                        <button
                            key={count}
                            onClick={() => handleSelectDays(count)}
                            disabled={isCreating}
                            className={[
                                'w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-0.5',
                                'font-bold text-xl border-2 transition-all duration-200',
                                'disabled:cursor-not-allowed',
                                isSelected
                                    ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white scale-105 shadow-lg shadow-blue-600/30'
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white hover:border-blue-500/60 hover:bg-blue-50/50 dark:hover:bg-blue-500/10',
                                !isSelected && isCreating ? 'opacity-40' : '',
                            ].join(' ')}
                        >
                            {isLoading ? (
                                // Spinner while creating
                                <svg
                                    className="animate-spin w-6 h-6 text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor" strokeWidth="3"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            ) : isSelected ? (
                                <CheckCircle2 size={24} className="text-white" />
                            ) : (
                                <>
                                    <span>{count}</span>
                                    <span className="text-[9px] font-medium opacity-60 normal-case tracking-normal">
                                        {DAY_LABELS.slice(0, count).join('')}
                                    </span>
                                </>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Footer hint */}
            <p className="text-xs text-gray-400 dark:text-gray-600">
                Puedes añadir, quitar o renombrar los días después
            </p>
        </div>
    )
}
