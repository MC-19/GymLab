interface ProgressBarProps {
    value: number // 0–100
    label?: string
    color?: 'blue' | 'gold' | 'green'
}

const colors = {
    blue: 'bg-blue-500',
    gold: 'bg-amber-400',
    green: 'bg-green-500',
}

export function ProgressBar({ value, label, color = 'blue' }: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, value))
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{label}</span>
                    <span>{Math.round(clamped)}%</span>
                </div>
            )}
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color]}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    )
}
