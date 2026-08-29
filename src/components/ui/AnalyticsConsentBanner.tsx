import { ShieldCheck } from 'lucide-react'
import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent'

export function AnalyticsConsentBanner() {
    const { consent, acceptAnalytics, rejectAnalytics } = useAnalyticsConsent()

    if (consent !== 'pending') return null

    return (
        <section
            aria-label="Preferencias de analítica"
            className="fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <ShieldCheck size={18} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Analítica y privacidad</h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                        Nos gustaría medir visitas para mejorar GymLab. Tus rutinas, pesos, notas y series no se envían a Google Analytics.
                    </p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={rejectAnalytics}
                    className="rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:border-white/10 dark:bg-white/8 dark:text-gray-200 dark:hover:bg-white/12"
                >
                    Rechazar
                </button>
                <button
                    type="button"
                    onClick={acceptAnalytics}
                    className="rounded-2xl border border-blue-600 bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                    Aceptar analítica
                </button>
            </div>
        </section>
    )
}
