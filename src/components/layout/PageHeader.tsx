import type { ReactNode } from 'react'

export function PageHeader({ children }: { children: ReactNode }) {
    return (
        <header className="sticky top-0 z-30 border-b border-gray-100/60 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-black/95">
            {children}
        </header>
    )
}
