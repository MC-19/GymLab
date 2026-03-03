import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            {/* Panel */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-bounce-in overflow-hidden">
                {title && (
                    <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/10">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                        <IconButton onClick={onClose} variant="ghost" size="sm">
                            <X size={16} />
                        </IconButton>
                    </div>
                )}
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    )
}
