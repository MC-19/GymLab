import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../ui/Toast'
import { useWorkoutContext } from '../../context/WorkoutContext'

interface AppShellProps {
    children: ReactNode
    training?: boolean
}

export function AppShell({ children, training = false }: AppShellProps) {
    const { toasts, removeToast } = useWorkoutContext()

    return (
        <div className={`min-h-dvh bg-white dark:bg-black flex flex-col text-gray-900 dark:text-white ${training ? 'training-shell' : ''}`}>
            <main className={`flex-1 pb-24 ${training ? '' : 'overflow-y-auto'}`}>
                {children}
            </main>
            {training ? <div className="training-bottom-nav"><BottomNav /></div> : <BottomNav />}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    )
}
