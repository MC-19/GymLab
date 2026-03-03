import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { Toast } from '../../hooks/useToast'

interface ToastContainerProps {
    toasts: Toast[]
    removeToast: (id: string) => void
}

const icons = {
    success: <CheckCircle size={16} className="text-green-400" />,
    error: <XCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-blue-400" />,
}

const colors = {
    success: 'border-green-500/30 bg-gray-900/95 dark:bg-gray-900/98',
    error: 'border-red-500/30 bg-gray-900/95 dark:bg-gray-900/98',
    info: 'border-blue-500/30 bg-gray-900/95 dark:bg-gray-900/98',
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={[
                        'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl',
                        'backdrop-blur-md animate-bounce-in pointer-events-auto',
                        colors[t.type],
                    ].join(' ')}
                >
                    {icons[t.type]}
                    <span className="text-sm font-medium text-white flex-1">{t.message}</span>
                    <button
                        onClick={() => removeToast(t.id)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    )
}
