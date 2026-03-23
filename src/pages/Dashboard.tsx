import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, ListChecks, Shuffle } from 'lucide-react'
import { useWorkoutContext } from '../context/WorkoutContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { OnboardingCard } from '../components/ui/OnboardingCard'
import { calculateWeeklyStreak } from '../utils/helpers'
import { useTimer } from '../context/TimerContext'

// ── helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

function getWeekDays() {
    const today = new Date()
    const monday = new Date(today)
    // Adjust to Monday of current week
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(today.getDate() + diff)

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d
    })
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ── component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
    const navigate = useNavigate()
    const {
        days,
        addDay,
        getCurrentDay,
        currentDayIndex,
        sessions,
        getRecentSessions,
        setCurrentDayIndex,
        showToast,
    } = useWorkoutContext()
    const { setDefaultRestTime } = useTimer()

    const [showDayPicker, setShowDayPicker] = useState(false)

    const DAY_LETTERS = ['A', 'B', 'C', 'D', 'E']

    const handleOnboardingSelect = async (count: number, defaultRest: number) => {
        for (let i = 0; i < count; i++) {
            addDay(`Día ${DAY_LETTERS[i]}`)
        }
        setDefaultRestTime(defaultRest)
        navigate('/routines', { state: { fromOnboarding: true } })
    }

    const currentDay = getCurrentDay(days)
    const recentSessions = getRecentSessions(7)
    const weekDays = getWeekDays()
    const today = new Date()
    const weeklyCount = recentSessions.length
    const streak = calculateWeeklyStreak(sessions)

    // Map each calendar day to a session (if any)
    const sessionsByDay = weekDays.map(d => ({
        date: d,
        session: recentSessions.find(s => isSameDay(new Date(s.completedAt), d)) ?? null,
    }))

    // Next day in rotation
    const nextIndex = days.length > 0 ? (currentDayIndex + 1) % days.length : 0
    const nextDay = days.length > 1 ? days[nextIndex] : null

    // Next days preview (after the next one)
    const nextDays = days.length > 0
        ? Array.from({ length: Math.min(2, days.length - 1) }, (_, i) =>
            days[(currentDayIndex + i + 2) % days.length]
        )
        : []

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/8">
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <img src="/icons/icon-512.png" alt="GymLab" className="h-30 w-auto object-contain" />
                    <ThemeToggle />
                </div>
            </div>

            <div className="px-5 pt-6 pb-24 max-w-lg mx-auto space-y-5">

                {/* ── EMPTY: Onboarding ────────────────────────────── */}
                {days.length === 0 ? (
                    <OnboardingCard onSelect={handleOnboardingSelect} />
                ) : (
                    <>
                        {/* Streak Banner */}
                        {streak > 0 && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200/60 dark:border-orange-500/20 px-4 py-3.5 rounded-3xl -mt-2 shadow-sm shadow-orange-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-lg leading-none">🔥</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-orange-800 dark:text-orange-400">
                                            {streak} semana{streak > 1 ? 's' : ''} en racha
                                        </p>
                                        <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 font-medium tracking-wide">
                                            ¡No rompas la cadena!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TODAY card */}
                        <div>
                            <button
                                onClick={() => navigate(`/day/${currentDay!.id}`)}
                                className="relative w-full text-left bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-700 rounded-[2rem] p-6 shadow-xl shadow-blue-600/30 dark:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 overflow-hidden group border border-white/10"
                            >
                                {/* Background glow / glass effect */}
                                <div className="absolute top-0 right-0 -left-1/4 -bottom-1/4 bg-gradient-to-br from-white/10 to-transparent opacity-50 blur-2xl pointer-events-none" />

                                <div className="relative flex items-start justify-between gap-3 z-10">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-blue-200/90 uppercase tracking-[0.2em] mb-1">
                                            HOY TOCA
                                        </p>
                                        <h2 className="font-display text-3xl font-extrabold text-white truncate mb-2 tracking-tight group-hover:text-blue-50 transition-colors">
                                            {currentDay!.name}
                                        </h2>
                                        {currentDay!.exercises.length > 0 ? (
                                            <p className="text-blue-200 text-sm leading-relaxed">
                                                {currentDay!.exercises.slice(0, 3).map(e => e.name).join(' · ')}
                                                {currentDay!.exercises.length > 3 && ` +${currentDay!.exercises.length - 3} más`}
                                            </p>
                                        ) : (
                                            <p className="text-blue-300/70 text-sm italic">Sin ejercicios configurados</p>
                                        )}
                                        {nextDay && (
                                            <div className="mt-3 pt-3 border-t border-blue-500/40">
                                                <p className="text-[11px] font-medium text-blue-200/90">
                                                    <span className="font-bold opacity-70 tracking-wider">SIGUIENTE:</span> {nextDay.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 mt-2 group-hover:bg-white/20 transition-colors">
                                        <ChevronRight size={22} className="text-white" />
                                    </div>
                                </div>
                            </button>

                            {/* Cambiar día */}
                            <button
                                onClick={() => setShowDayPicker(true)}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-150"
                            >
                                <Shuffle size={13} />
                                Cambiar el día de hoy
                            </button>
                        </div>

                        {/* ── Weekly Calendar ─────────────────────────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-gray-400" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                                        Esta semana
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-1 rounded-full">
                                    {weeklyCount} / 7 entrenamientos
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-3xl px-4 py-4">
                                <div className="grid grid-cols-7 gap-1">
                                    {sessionsByDay.map(({ date, session }, i) => {
                                        const isToday = isSameDay(date, today)
                                        const isFuture = date > today && !isToday
                                        const isDone = !!session
                                        const dayName = session
                                            ? days.find(d => d.id === session.dayId)?.name
                                            : null

                                        return (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center gap-1.5"
                                                title={dayName ?? undefined}
                                            >
                                                <span className={[
                                                    'text-[10px] font-semibold uppercase',
                                                    isToday
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-400 dark:text-gray-600',
                                                ].join(' ')}>
                                                    {DAY_LABELS[i]}
                                                </span>
                                                <div className={[
                                                    'w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-200',
                                                    isDone
                                                        ? 'bg-blue-600 dark:bg-blue-500'
                                                        : isToday
                                                            ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-500/60'
                                                            : isFuture
                                                                ? 'bg-transparent'
                                                                : 'bg-gray-200/60 dark:bg-white/8',
                                                ].join(' ')}>
                                                    {isDone ? (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    ) : (
                                                        <span className={[
                                                            'text-xs font-bold',
                                                            isToday
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : isFuture
                                                                    ? 'text-gray-300 dark:text-white/15'
                                                                    : 'text-gray-400 dark:text-gray-600',
                                                        ].join(' ')}>
                                                            {date.getDate()}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* tiny dot if today */}
                                                {isToday && !isDone && (
                                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                )}
                                                {isDone && (
                                                    <div className="w-1 h-1 rounded-full bg-transparent" />
                                                )}
                                                {!isToday && !isDone && (
                                                    <div className="w-1 h-1 rounded-full bg-transparent" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200/60 dark:border-white/8">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-blue-600" />
                                        <span className="text-[10px] text-gray-500">Completado</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500/60" />
                                        <span className="text-[10px] text-gray-500">Hoy</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-gray-200/60 dark:bg-white/8" />
                                        <span className="text-[10px] text-gray-500">Sin entreno</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Upcoming days (after SIGUIENTE) ──────────── */}
                        {nextDays.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
                                    Próximos
                                </p>
                                <div className="space-y-2">
                                    {nextDays.map((day, i) => (
                                        <div
                                            key={day.id}
                                            className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-2xl"
                                        >
                                            <div className="w-7 h-7 rounded-xl bg-gray-200/80 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    +{i + 2}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                                                {day.name}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">
                                                {day.exercises.length} ej.
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Quick access to routines ─────────────────── */}
                        <button
                            onClick={() => navigate('/routines')}
                            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-2xl hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200"
                        >
                            <ListChecks size={18} className="text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-1 text-left">
                                Gestionar rutinas
                            </span>
                            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                        </button>
                    </>
                )}
            </div>

            {/* Day picker sheet */}
            {showDayPicker && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowDayPicker(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111] rounded-t-3xl border-t border-gray-200/60 dark:border-white/10 px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto">
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-5" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">¿Qué entrenas hoy?</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">La rotación continuará desde el día que elijas.</p>
                        <div className="space-y-2">
                            {days.map((day, i) => {
                                const isSelected = i === currentDayIndex % days.length
                                return (
                                    <button
                                        key={day.id}
                                        onClick={() => {
                                            setCurrentDayIndex(i)
                                            showToast(`Hoy: ${day.name}`, 'success')
                                            setShowDayPicker(false)
                                        }}
                                        className={[
                                            'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all',
                                            isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/10 hover:border-blue-500/40',
                                        ].join(' ')}
                                    >
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'}`}>
                                            {i + 1}
                                        </div>
                                        <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {day.name}
                                        </span>
                                        {isSelected && (
                                            <span className="ml-auto text-[10px] font-bold text-white/70 uppercase">Actual</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
