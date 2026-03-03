import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    fullWidth?: boolean
    icon?: ReactNode
    children?: ReactNode
}

const variants: Record<Variant, string> = {
    primary:
        'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-900/30',
    secondary:
        'bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-white/20',
    ghost:
        'bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300',
    danger:
        'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
    accent:
        'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-900/30',
}

const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-2xl gap-2',
    lg: 'px-5 py-3.5 text-base rounded-2xl gap-2',
}

export function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled}
            className={[
                'inline-flex items-center justify-center font-medium transition-all duration-150 select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'active:scale-[0.97]',
                variants[variant],
                sizes[size],
                fullWidth ? 'w-full' : '',
                disabled ? 'opacity-40 pointer-events-none' : '',
                className,
            ].join(' ')}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </button>
    )
}
