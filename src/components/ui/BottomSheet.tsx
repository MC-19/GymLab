import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

interface BottomSheetProps {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        // Prevent background scroll
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            {/* Sheet */}
            <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl animate-slide-up max-h-[92dvh] flex flex-col">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>
                {title && (
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                        <IconButton onClick={onClose} variant="ghost" size="sm">
                            <X size={16} />
                        </IconButton>
                    </div>
                )}
                <div className="overflow-y-auto px-6 py-4 flex-1">{children}</div>
                {/* Safe area */}
                <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
            </div>
        </div>
    )
}
