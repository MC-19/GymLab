import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export function PwaReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            // Check for updates every time the window gets focus
            if (r) {
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        r.update()
                    }
                })
            }
        },
        onRegisterError(error: unknown) {
            console.error('SW registration error', error)
        },
    })

    const close = () => setNeedRefresh(false)

    if (!needRefresh) return null

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-slide-up">
            <div className="bg-blue-600 dark:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 p-3 pr-2 flex items-center gap-3 border border-blue-400/30">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                    <RefreshCw size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">Nueva actualización</p>
                    <p className="text-xs text-blue-100/90 leading-tight">Pulsa para aplicar los cambios recientes.</p>
                </div>
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-blue-600 font-bold text-xs uppercase tracking-wide active:scale-95 transition-transform"
                >
                    Actualizar
                </button>
                <button
                    onClick={close}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-transparent active:bg-white/10"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
