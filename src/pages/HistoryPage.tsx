import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { ClockFading, Dumbbell, TrendingUp, Calendar } from 'lucide-react'
import { formatDate, groupSessionsByWeek, calcTotalVolume } from '../utils/helpers'

export function HistoryPage() {
    const { sessions } = useWorkoutContext()

    const weeklyGroups = groupSessionsByWeek(sessions)
    const weeks = Object.entries(weeklyGroups).sort(([a], [b]) => b.localeCompare(a))

    const totalVolume = sessions.reduce(
        (sum, s) => sum + s.exercises.reduce((ev, e) => ev + calcTotalVolume(e.sets), 0),
        0
    )

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Historial</h1>
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
                {sessions.length === 0 ? (
                    <EmptyState
                        icon={<ClockFading size={28} />}
                        title="Sin historial"
                        description="Completa tus primeros entrenamientos para ver el histórico aquí"
                    />
                ) : (
                    <>
                        {/* Global stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard label="Sesiones" value={String(sessions.length)} icon={<Calendar size={16} />} />
                            <StatCard label="Esta semana" value={String(weeks[0]?.[1]?.length ?? 0)} icon={<TrendingUp size={16} />} />
                            <StatCard label="Vol. total" value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '—'} icon={<Dumbbell size={16} />} color="gold" />
                        </div>

                        {/* Weekly timeline */}
                        <div className="space-y-6">
                            {weeks.map(([weekStart, weekSessions]) => (
                                <div key={weekStart}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                            Semana del {new Date(weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                                        <Badge variant="gray">{weekSessions.length} sesiones</Badge>
                                    </div>
                                    <div className="space-y-2.5">
                                        {weekSessions.map(session => {
                                            const vol = session.exercises.reduce((sum, e) => sum + calcTotalVolume(e.sets), 0)
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-3xl px-5 py-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{session.dayName}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                                                {formatDate(session.date)}
                                                            </p>
                                                        </div>
                                                        {vol > 0 && (
                                                            <Badge variant="gold">{vol} kg</Badge>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {session.exercises.map(ex => (
                                                            <span
                                                                key={ex.id}
                                                                className="text-xs bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full px-2.5 py-0.5"
                                                            >
                                                                {ex.name} ·  {ex.sets.length}×
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({
    label, value, icon, color = 'blue',
}: { label: string; value: string; icon: React.ReactNode; color?: 'blue' | 'gold' }) {
    return (
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-3xl p-4 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color === 'gold' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'}`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
            </div>
        </div>
    )
}
