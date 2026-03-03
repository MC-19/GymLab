import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'default' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

const variants = {
    default: 'bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300',
    danger: 'hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-500',
    ghost: 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400',
}

const sizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
}

export function IconButton({ children, variant = 'ghost', size = 'md', className = '', ...props }: IconButtonProps) {
    return (
        <button
            className={[
                'inline-flex items-center justify-center transition-all duration-150 active:scale-90',
                variants[variant],
                sizes[size],
                className,
            ].join(' ')}
            {...props}
        >
            {children}
        </button>
    )
}
