import { useState } from 'react'

interface AddWeightSheetProps {
    /** Pre-fill weight if today's entry already exists */
    initialWeight?: number
    onClose: () => void
    onSave: (weight: number, date?: string) => void
}

function todayStr() {
    return new Date().toISOString().slice(0, 10)
}

export function AddWeightSheet({ initialWeight, onClose, onSave }: AddWeightSheetProps) {
    const [weight, setWeight] = useState(initialWeight != null ? String(initialWeight) : '')
    const [date, setDate] = useState(todayStr())

    const parsed = parseFloat(weight.replace(',', '.'))
    const isValid = !isNaN(parsed) && parsed > 0

    const handleSave = () => {
        if (!isValid) return
        const isToday = date === todayStr()
        onSave(parsed, isToday ? undefined : date)
        onClose()
    }

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111] rounded-t-3xl border-t border-gray-200/60 dark:border-white/10 px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-5" />

                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Registrar peso</h2>

                {/* Peso */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                        Peso (kg)
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="20"
                        max="300"
                        placeholder="70.5"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        autoFocus
                        className="w-full bg-gray-100 dark:bg-white/8 border border-gray-200/80 dark:border-white/10 rounded-2xl px-4 py-3 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Fecha (backfill) */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={date}
                        max={todayStr()}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-white/8 border border-gray-200/80 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isValid}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-2xl py-3.5 transition-all text-sm"
                >
                    Guardar
                </button>
            </div>
        </>
    )
}
