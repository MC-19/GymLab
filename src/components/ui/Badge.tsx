type BadgeVariant = 'blue' | 'gold' | 'green' | 'red' | 'gray'

const colors: Record<BadgeVariant, string> = {
    blue: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    gold: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    green: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
    red: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    gray: 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/30',
}

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: 'sm' | 'md'
    className?: string
}

export function Badge({ children, variant = 'blue', size = 'md', className = '' }: BadgeProps) {
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
    return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${colors[variant]} ${className}`}>
            {children}
        </span>
    )
}
