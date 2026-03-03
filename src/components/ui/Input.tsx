import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <input
                className={[
                    'w-full bg-gray-100 dark:bg-white/8 rounded-2xl px-4 py-3',
                    'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600',
                    'border border-transparent focus:border-blue-500 focus:outline-none',
                    'transition-all duration-150',
                    // text-base = 16px: prevents iOS/Android auto-zoom on focus
                    'text-base',
                    error ? 'border-red-500' : '',
                    className,
                ].join(' ')}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

interface NumberInputProps {
    label: string
    value: number | ''
    onChange: (value: number | '') => void
    min?: number
    max?: number
    step?: number
    placeholder?: string
    unit?: string
}

export function NumberInput({ label, value, onChange, min, max, step = 0.5, placeholder, unit }: NumberInputProps) {
    return (
        <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={e => {
                        const v = e.target.value
                        onChange(v === '' ? '' : Number(v))
                    }}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={placeholder ?? '—'}
                    className={[
                        'w-full bg-gray-100 dark:bg-white/8 rounded-2xl text-center',
                        // text-base = 16px: prevents iOS/Android auto-zoom on focus
                        'text-gray-900 dark:text-white placeholder-gray-500 font-semibold text-base',
                        'border border-transparent focus:border-blue-500 focus:outline-none',
                        'transition-all duration-150',
                        unit ? 'pt-3 pb-1 px-2' : 'py-3 px-2',
                    ].join(' ')}
                />
                {unit && (
                    <span className="absolute bottom-1.5 left-0 right-0 text-center text-xs text-gray-500 dark:text-gray-500 pointer-events-none">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}
