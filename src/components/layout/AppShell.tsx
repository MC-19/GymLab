import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../ui/Toast'
import { useWorkoutContext } from '../../context/WorkoutContext'

interface AppShellProps {
    children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const { toasts, removeToast } = useWorkoutContext()

    return (
        <div className="min-h-dvh bg-white dark:bg-black flex flex-col text-gray-900 dark:text-white">
            <main className="flex-1 overflow-y-auto pb-24">
                {children}
            </main>
            <BottomNav />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    )
}
