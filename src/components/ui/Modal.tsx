import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const titleId = useId()

    useEffect(() => {
        if (!open) return
        const previouslyFocused = document.activeElement as HTMLElement | null
        const panel = panelRef.current
        panel?.focus()
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key !== 'Tab' || !panel) return
            const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            ))
            if (focusable.length === 0) return
            const first = focusable[0]
            const last = focusable.at(-1)!
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
            previouslyFocused?.focus()
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[10dvh] pb-[env(safe-area-inset-bottom)]"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            {/* Panel — takes natural height, doesn't resize on keyboard */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Diálogo'}
                tabIndex={-1}
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-bounce-in overflow-hidden mb-4 outline-none"
            >
                {title && (
                    <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                        <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                        <IconButton onClick={onClose} variant="ghost" size="sm" aria-label="Cerrar diálogo">
                            <X size={16} />
                        </IconButton>
                    </div>
                )}
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )
}
