import { Trash2 } from 'lucide-react'
import type { BodyWeightEntry } from '../types'

interface WeightListProps {
    /** Entries sorted descending (most recent first) for display */
    entries: BodyWeightEntry[]
    onDelete: (id: string) => void
}

function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

function relativeLabel(dateStr: string): string {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
    if (dateStr === today) return 'Hoy'
    if (dateStr === yesterday) return 'Ayer'
    return formatDate(dateStr)
}

export function WeightList({ entries, onDelete }: WeightListProps) {
    return (
        <div className="space-y-2">
            {entries.map((entry, i) => {
                const next = entries[i + 1] // next = chronologically older
                const diff = next
                    ? Math.round((entry.weight - next.weight) * 10) / 10
                    : null

                return (
                    <div
                        key={entry.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl px-4 py-3"
                    >
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-gray-900 dark:text-white">
                                    {entry.weight} kg
                                </span>
                                {diff !== null && (
                                    <span className={`text-xs font-medium ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {diff > 0 ? '+' : ''}{diff} kg
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                {relativeLabel(entry.date)}
                            </p>
                        </div>
                        <button
                            onClick={() => onDelete(entry.id)}
                            aria-label="Eliminar registro"
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
