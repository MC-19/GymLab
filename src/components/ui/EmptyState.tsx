import type { ReactNode } from 'react'

interface EmptyStateProps {
    icon: ReactNode
    title: string
    description?: string
    action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-400 dark:text-gray-600">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-700 dark:text-gray-300">{title}</p>
                {description && <p className="text-sm text-gray-500 dark:text-gray-600">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
