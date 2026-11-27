import { Bell, CalendarDays, ChevronRight, ListChecks, Shuffle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StartTrainingButton } from '../features/training/StartTrainingButton'
import { useTraining } from '../features/training/TrainingContext'
import { BottomSheet } from '../components/ui/BottomSheet'
import { OnboardingCard } from '../components/ui/OnboardingCard'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { WhatsNewModal } from '../components/ui/WhatsNewModal'
import { useTimer } from '../context/TimerContext'
import { useWorkoutContext } from '../context/WorkoutContext'
import { LATEST_VERSION } from '../data/changelog'
import { calculateWeeklyStreak } from '../utils/helpers'
import { PageHeader } from '../components/layout/PageHeader'

import { localDateKey, localMonday, sessionDates, shiftLocalDay } from '../utils/dates'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ── component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
    const navigate = useNavigate()
    const {
        days,
        getCurrentDay,
        currentDayIndex,
        allSessions,
        programs,
        setCurrentDayIndex,
        showToast,
        activeProgram,
        createProgramWithDays,
    } = useWorkoutContext()
    const { active: activeTraining } = useTraining()
    const { setDefaultRestTime } = useTimer()

    const [showDayPicker, setShowDayPicker] = useState(false)
    const closeDayPicker = useCallback(() => setShowDayPicker(false), [])
    const [showChangelog, setShowChangelog] = useState(false)
    const [hasUnseenUpdates, setHasUnseenUpdates] = useState(
        () => localStorage.getItem('GYMLAB_LAST_VERSION_SEEN') !== LATEST_VERSION
    )

    const handleOpenChangelog = () => {
        setHasUnseenUpdates(false)
        setShowChangelog(true)
        localStorage.setItem('GYMLAB_LAST_VERSION_SEEN', LATEST_VERSION)
    }

    const DAY_LETTERS = ['A', 'B', 'C', 'D', 'E']

    const handleOnboardingSelect = (count: number, defaultRest: number) => {
        const dayNames = Array.from({ length: count }, (_, i) => `Día ${DAY_LETTERS[i]}`)
        createProgramWithDays('Mi programa', dayNames)
        setDefaultRestTime(defaultRest)
        navigate('/routines', { state: { fromOnboarding: true } })
    }

    const currentDay = getCurrentDay(days)
    const trainingName = activeTraining?.dayName ?? currentDay?.name
    const exerciseCount = activeTraining?.exercises.length ?? currentDay?.exercises.length ?? 0
    const today = new Date()
    const weekDays = Array.from({ length: 7 }, (_, index) => shiftLocalDay(localMonday(today), index))
    const weekSessions = sessionDates(allSessions, 'week', today)
    const weeklyCount = weekSessions.length
    const streak = calculateWeeklyStreak(allSessions, today)

    const sessionsByDay = weekDays.map(date => ({
        date,
        sessions: weekSessions.filter(session => localDateKey(new Date(session.completedAt)) === localDateKey(date)),
    }))

    const nextDays = Array.from({ length: Math.min(3, Math.max(0, days.length - 1)) }, (_, index) =>
        days[(currentDayIndex + index + 1) % days.length]
    )

    return (
        <div>
            <PageHeader>
                <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
                    <div className="shrink-0" aria-label="GymLab">
                        <img src="/brand/gymlab-logo-light.svg" alt="GymLab" className="h-9 w-auto max-w-[148px] dark:hidden" />
                        <img src="/brand/gymlab-logo-dark.svg" alt="GymLab" className="hidden h-9 w-auto max-w-[148px] dark:block" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenChangelog}
                            aria-label={hasUnseenUpdates ? 'Ver novedades sin leer' : 'Ver novedades'}
                            className="relative size-11 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                            <Bell size={18} />
                            {hasUnseenUpdates && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-gray-100 dark:border-black" />
                            )}
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </PageHeader>

            <div className="page-enter px-5 pt-6 pb-24 max-w-lg mx-auto space-y-5">

                {trainingName !== undefined ? (
                    <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5" aria-labelledby="today-training">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {activeTraining ? 'Entrenamiento en curso' : 'Hoy toca'}
                            </p>
                            <h1 id="today-training" className="mt-1 wrap-break-word text-2xl font-bold">{trainingName}</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {exerciseCount ? `${exerciseCount} ${exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}` : 'Sin ejercicios configurados'}
                            </p>
                        </div>
                        <StartTrainingButton day={currentDay} followRotation inSummary />
                        {currentDay && (
                            <div className="flex flex-wrap items-center gap-x-4">
                                {!!currentDay.exercises.length && (
                                    <Link to={`/day/${currentDay.id}`} className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-blue-700 dark:text-blue-400 focus-visible:outline-2 focus-visible:outline-blue-500">
                                        {activeTraining ? 'Ver rutina de hoy' : 'Ver ejercicios'}
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowDayPicker(true)}
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 focus-visible:outline-2 focus-visible:outline-blue-500"
                                >
                                    <Shuffle size={15} aria-hidden="true" />
                                    Cambiar día
                                </button>
                            </div>
                        )}
                    </section>
                ) : <StartTrainingButton day={null} followRotation />}

                {/* ── EMPTY: Onboarding ────────────────────────────── */}
                {days.length === 0 ? (
                    <>
                        <OnboardingCard onSelect={handleOnboardingSelect} />
                        <Link to="/programs" className="block py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Ver plantillas de entrenamiento
                        </Link>
                    </>
                ) : (
                    <>
                        {/* ── Weekly Calendar ─────────────────────────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={14} className="text-gray-400" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                        Esta semana
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-1 rounded-full">
                                    {weeklyCount} {weeklyCount === 1 ? 'entrenamiento' : 'entrenamientos'}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-3xl px-4 py-4">
                                <div className="grid grid-cols-7 gap-1">
                                    {sessionsByDay.map(({ date, sessions }, i) => {
                                        const isToday = localDateKey(date) === localDateKey(today)
                                        const isFuture = date > today && !isToday
                                        const isDone = sessions.length > 0
                                        const dayNames = sessions.map(session =>
                                            session.dayName ?? programs.flatMap(program => program.days).find(day => day.id === session.dayId)?.name
                                        ).filter(Boolean).join(', ')

                                        return (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center gap-1.5"
                                                title={dayNames || undefined}
                                            >
                                                <span className={[
                                                    'text-[10px] font-semibold uppercase',
                                                    isToday
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-600 dark:text-gray-400',
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
                                                                : 'text-gray-600 dark:text-gray-400',
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
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-200/60 dark:border-white/8">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-blue-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Completado</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500/60" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Hoy</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-md bg-gray-200/60 dark:bg-white/8" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Sin entreno</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {streak > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong className="font-semibold text-gray-900 dark:text-white">{streak}</strong>{' '}
                                {streak === 1 ? 'semana' : 'semanas'} en racha
                            </p>
                        )}

                        {nextDays.length > 0 && (
                            <details className="rounded-2xl border border-gray-200 px-4 dark:border-white/10">
                                <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Siguiente: {nextDays[0].name}
                                </summary>
                                <ol className="space-y-2 pb-3 text-sm text-gray-600 dark:text-gray-400">
                                    {nextDays.map(day => (
                                        <li className="wrap-break-word" key={day.id}>
                                            {day.name} · {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                                        </li>
                                    ))}
                                </ol>
                            </details>
                        )}

                        {/* Active program chip */}
                        {activeProgram && (
                            <button
                                onClick={() => navigate('/programs')}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/8 rounded-2xl hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200 text-left"
                            >
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest flex-1">Programa activo</span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[60%]">{activeProgram.name}</span>
                                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                            </button>
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

            <BottomSheet open={showDayPicker} onClose={closeDayPicker} title="¿Qué entrenas hoy?" className="mx-auto max-w-lg">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">La rotación continuará desde el día que elijas.</p>
                <div className="space-y-2">
                    {days.map((day, i) => {
                        const isSelected = i === currentDayIndex % days.length
                        return (
                            <button
                                type="button"
                                key={day.id}
                                onClick={() => {
                                    setCurrentDayIndex(i)
                                    showToast(`Hoy: ${day.name}`, 'success')
                                    closeDayPicker()
                                }}
                                className={[
                                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-500',
                                    isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/40',
                                ].join(' ')}
                            >
                                <span className="shrink-0 text-sm font-semibold">{i + 1}</span>
                                <span className="min-w-0 wrap-break-word text-sm font-medium">{day.name}</span>
                                {isSelected && <span className="ml-auto shrink-0 text-xs font-medium">Actual</span>}
                            </button>
                        )
                    })}
                </div>
            </BottomSheet>

            <WhatsNewModal open={showChangelog} onClose={() => setShowChangelog(false)} />
        </div>
    )
}
