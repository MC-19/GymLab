/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAudioBeep } from '../hooks/useAudioBeep'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useWorkoutContext } from './WorkoutContext'
import { adjustRestTimer, createRestTimer, remainingRest, type RestTimer } from '../utils/restTimer'
import { reportStorageError } from '../services/storageErrors'

export interface TimerState {
    isActive: boolean
    timeRemaining: number
    duration: number // Total duration of current timer
}

interface TimerContextType extends TimerState {
    defaultRestTime: number
    setDefaultRestTime: (seconds: number) => void
    startTimer: (seconds?: number) => void
    stopTimer: () => void
    addTime: (seconds: number) => void
}

const TimerContext = createContext<TimerContextType | null>(null)

function loadRestTimer(): RestTimer | null {
    try {
        const end = Number(sessionStorage.getItem('gymlab_timer_end'))
        const duration = Number(sessionStorage.getItem('gymlab_timer_dur'))
        return Number.isFinite(end) && end > 0 && Number.isFinite(duration) && duration > 0 ? { end, duration } : null
    } catch {
        return null
    }
}

function persistRestTimer(timer: RestTimer | null) {
    try {
        if (timer) {
            sessionStorage.setItem('gymlab_timer_end', String(timer.end))
            sessionStorage.setItem('gymlab_timer_dur', String(timer.duration))
        } else {
            sessionStorage.removeItem('gymlab_timer_end')
            sessionStorage.removeItem('gymlab_timer_dur')
        }
    } catch (error) {
        reportStorageError(error)
    }
}

export function TimerProvider({ children }: { children: ReactNode }) {
    const [defaultRestTime, setDefaultRestTime] = useLocalStorage<number>('gymlab_default_rest', 180)
    const { showToast } = useWorkoutContext()
    const { playStartBeep, playFinishBeeps } = useAudioBeep()
    const [timer, setTimer] = useState(loadRestTimer)
    const currentTimer = useRef(timer)
    const [timeRemaining, setTimeRemaining] = useState(() => timer ? remainingRest(timer, Date.now()) : 0)
    const pendingToast = useRef(false)

    useEffect(() => {
        if (!timer) return

        const tick = () => {
            if (currentTimer.current !== timer) return
            const remaining = remainingRest(timer, Date.now())
            setTimeRemaining(remaining)
            if (remaining > 0) return
            currentTimer.current = null
            persistRestTimer(null)
            setTimer(null)
            if (typeof navigator.vibrate === 'function') navigator.vibrate([200, 100, 200, 100, 500])
            playFinishBeeps()
            if (document.hidden) pendingToast.current = true
            else showToast('¡Tiempo de descanso finalizado!', 'success')
        }
        const interval = window.setInterval(tick, 250)
        const onVisible = () => {
            if (!document.hidden) tick()
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [timer, showToast, playFinishBeeps])

    useEffect(() => {
        const showPending = () => {
            if (!document.hidden && pendingToast.current) {
                pendingToast.current = false
                showToast('¡Tiempo de descanso finalizado!', 'success')
            }
        }
        document.addEventListener('visibilitychange', showPending)
        return () => document.removeEventListener('visibilitychange', showPending)
    }, [showToast])

    const updateTimer = (next: RestTimer | null, now: number) => {
        currentTimer.current = next
        setTimer(next)
        setTimeRemaining(next ? remainingRest(next, now) : 0)
        persistRestTimer(next)
    }

    const startTimer = (seconds?: number) => {
        const now = Date.now()
        pendingToast.current = false
        playStartBeep()
        updateTimer(createRestTimer(seconds ?? defaultRestTime, now), now)
    }

    const stopTimer = () => updateTimer(null, Date.now())

    const addTime = (seconds: number) => {
        if (currentTimer.current) updateTimer(adjustRestTimer(currentTimer.current, seconds), Date.now())
    }

    return (
        <TimerContext.Provider value={{
            isActive: timer !== null,
            timeRemaining,
            duration: timer?.duration ?? 0,
            defaultRestTime,
            setDefaultRestTime,
            startTimer,
            stopTimer,
            addTime,
        }}>
            {children}
        </TimerContext.Provider>
    )
}

export function useTimer() {
    const context = useContext(TimerContext)
    if (!context) throw new Error('useTimer must be used within TimerProvider')
    return context
}
