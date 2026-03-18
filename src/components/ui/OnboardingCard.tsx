import { useState } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'

interface OnboardingCardProps {
    onSelect: (count: number) => Promise<void>
}

const DAY_LABELS = ['A', 'B', 'C', 'D', 'E']
const OPTIONS = [2, 3, 4, 5]

export function OnboardingCard({ onSelect }: OnboardingCardProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [selected, setSelected] = useState<number | null>(null)

    const handleSelect = async (count: number) => {
        if (isCreating) return
        setIsCreating(true)
        setSelected(count)
        // Brief pause for feedback animation before navigating
        await new Promise(res => setTimeout(res, 600))
        await onSelect(count)
    }

    return (
        <div className="flex flex-col items-center px-2 pt-8 pb-4 animate-fade-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center mb-5">
                <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                Crea tu rutina en segundos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-8 leading-relaxed">
                GymLab rotará tus días automáticamente.<br />
                Solo elige cuántos días entrenas.
            </p>

            {/* Question */}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">
                ¿Cuántos días quieres entrenar?
            </p>

            {/* Options */}
            <div className="flex gap-3 mb-5">
                {OPTIONS.map(count => {
                    const isSelected = selected === count
                    const isLoading = isSelected && isCreating
                    return (
                        <button
                            key={count}
                            onClick={() => handleSelect(count)}
                            disabled={isCreating}
                            className={[
                                'w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-0.5',
                                'font-bold text-xl border-2 transition-all duration-200',
                                'disabled:cursor-not-allowed',
                                isSelected
                                    ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white scale-105 shadow-lg shadow-blue-600/30'
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white hover:border-blue-500/60 hover:bg-blue-50/50 dark:hover:bg-blue-500/10',
                                !isSelected && isCreating ? 'opacity-40' : '',
                            ].join(' ')}
                        >
                            {isLoading ? (
                                // Spinner while creating
                                <svg
                                    className="animate-spin w-6 h-6 text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor" strokeWidth="3"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            ) : isSelected ? (
                                <CheckCircle2 size={24} className="text-white" />
                            ) : (
                                <>
                                    <span>{count}</span>
                                    <span className="text-[9px] font-medium opacity-60 normal-case tracking-normal">
                                        {DAY_LABELS.slice(0, count).join('')}
                                    </span>
                                </>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Footer hint */}
            <p className="text-xs text-gray-400 dark:text-gray-600">
                Puedes añadir, quitar o renombrar los días después
            </p>
        </div>
    )
}
