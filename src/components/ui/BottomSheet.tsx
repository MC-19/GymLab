import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight'

interface BottomSheetProps {
    open: boolean
    onClose: () => void
    title?: string
    className?: string
    noPadding?: boolean
    children: ReactNode
}

export function BottomSheet({ open, onClose, title, className = '', noPadding, children }: BottomSheetProps) {
    const keyboardHeight = useKeyboardHeight()
    const panelRef = useRef<HTMLDivElement>(null)
    const titleId = useId()

    useEffect(() => {
        if (!open) return
        const previouslyFocused = document.activeElement as HTMLElement | null
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        // Prevent background scroll
        document.body.style.overflow = 'hidden'
        panelRef.current?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
            previouslyFocused?.focus()
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
            {/* Sheet — use paddingBottom instead of marginBottom so max-h maintains its position */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Panel'}
                tabIndex={-1}
                className={`relative w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl animate-slide-up max-h-[92dvh] flex flex-col transition-[padding] duration-100 outline-none ${className}`}
                style={{ paddingBottom: keyboardHeight }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>
                {title && (
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                        <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                        <IconButton onClick={onClose} variant="ghost" size="sm" aria-label="Cerrar panel">
                            <X size={16} />
                        </IconButton>
                    </div>
                )}
                <div className={`overflow-y-auto flex-1 ${noPadding ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : 'px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]'}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}
