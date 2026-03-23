import { useState } from 'react'
import { Plus, TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useBodyWeight } from '../useBodyWeight'
import { WeightChart } from './WeightChart'
import { WeightList } from './WeightList'
import { AddWeightSheet } from './AddWeightSheet'

export function BodyWeightPage() {
    const { entries, todayEntry, lastEntry, weekDelta, addOrUpdateEntry, deleteEntry } = useBodyWeight()
    const [showSheet, setShowSheet] = useState(false)

    // Last 30 entries for chart (already sorted asc)
    const chartEntries = entries.slice(-30)
    const listEntries = [...entries].reverse() // desc for display

    const trendIcon =
        weekDelta === null ? null :
            weekDelta < 0 ? <TrendingDown size={13} /> :
                weekDelta > 0 ? <TrendingUp size={13} /> :
                    <Minus size={13} />

    const trendColor =
        weekDelta === null ? 'gray' :
            weekDelta < 0 ? 'green' :
                weekDelta > 0 ? 'amber' : 'gray'

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Peso corporal</h1>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-5 pb-4 max-w-lg mx-auto space-y-5">
                {/* CTA */}
                <button
                    id="register-weight-btn"
                    onClick={() => setShowSheet(true)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold rounded-2xl py-3.5 transition-all text-sm"
                >
                    <Plus size={18} />
                    {todayEntry
                        ? `Hoy: ${todayEntry.weight} kg — Actualizar`
                        : 'Registrar peso hoy'}
                </button>

                {entries.length === 0 ? (
                    <EmptyState
                        icon={<Scale size={28} />}
                        title="Sin registros aún"
                        description="Empieza a anotar tu peso cada día para ver tu evolución"
                    />
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard
                                label="Último peso"
                                value={lastEntry ? `${lastEntry.weight} kg` : '—'}
                            />
                            <StatCard
                                label="Vs hace 7 días"
                                value={weekDelta !== null ? `${weekDelta > 0 ? '+' : ''}${weekDelta} kg` : '—'}
                                icon={trendIcon}
                                color={trendColor}
                            />
                        </div>

                        {/* Chart */}
                        {chartEntries.length >= 2 && (
                            <section>
                                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest mb-3">
                                    Evolución
                                </h2>
                                <WeightChart entries={chartEntries} />
                            </section>
                        )}

                        {/* List */}
                        <section>
                            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-widest mb-3">
                                Registros
                            </h2>
                            <WeightList entries={listEntries} onDelete={deleteEntry} />
                        </section>
                    </>
                )}
            </div>

            {showSheet && (
                <AddWeightSheet
                    initialWeight={todayEntry?.weight}
                    onClose={() => setShowSheet(false)}
                    onSave={addOrUpdateEntry}
                />
            )}
        </div>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-500',
    green: 'bg-green-500/15 text-green-500',
    amber: 'bg-amber-500/15 text-amber-500',
    gray: 'bg-gray-500/15 text-gray-400',
}

function StatCard({
    label, value, icon, color = 'blue',
}: {
    label: string
    value: string
    icon?: React.ReactNode
    color?: 'blue' | 'green' | 'amber' | 'gray'
}) {
    return (
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-3xl p-4 flex flex-col gap-2">
            {icon && (
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
            </div>
        </div>
    )
}
