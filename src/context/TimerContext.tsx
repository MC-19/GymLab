import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../hooks/useToast'
import { useAudioBeep } from '../hooks/useAudioBeep'

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

export function TimerProvider({ children }: { children: ReactNode }) {
    const [defaultRestTime, setDefaultRestTime] = useLocalStorage<number>('gymlab_default_rest', 180)
    const { showToast } = useToast()
    const { playStartBeep, playFinishBeeps } = useAudioBeep()

    const [isActive, setIsActive] = useState(false)
    const [duration, setDuration] = useState(0)
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [endTime, setEndTime] = useState<number | null>(null)
    
    // Almacén para el audio silencioso que mantiene vivo el JS en iOS
    const silentAudioRef = useRef<HTMLAudioElement | null>(null)

    // Load from memory if page reloads during active timer
    useEffect(() => {
        const storedEnd = sessionStorage.getItem('gymlab_timer_end')
        const storedDur = sessionStorage.getItem('gymlab_timer_dur')

        if (storedEnd && storedDur) {
            const end = Number(storedEnd)
            const dur = Number(storedDur)
            const remaining = Math.round((end - Date.now()) / 1000)

            if (remaining > 0) {
                setDuration(dur)
                setEndTime(end)
                setTimeRemaining(remaining)
                setIsActive(true)
            } else {
                sessionStorage.removeItem('gymlab_timer_end')
                sessionStorage.removeItem('gymlab_timer_dur')
            }
        }
    }, [])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>

        if (isActive && endTime) {
            interval = setInterval(() => {
                const remaining = Math.round((endTime - Date.now()) / 1000)

                if (remaining <= 0) {
                    // Timer finished
                    setIsActive(false)
                    setTimeRemaining(0)
                    setEndTime(null)
                    sessionStorage.removeItem('gymlab_timer_end')
                    sessionStorage.removeItem('gymlab_timer_dur')
                    clearInterval(interval)

                    // Feedback
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200, 100, 500])
                    }
                    playFinishBeeps()

                    showToast('¡Tiempo de descanso finalizado!', 'success')
                } else {
                    setTimeRemaining(remaining)
                }
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isActive, endTime, showToast, playFinishBeeps])

    const startTimer = (seconds?: number) => {
        playStartBeep()
        const timeToSet = seconds ?? defaultRestTime
        setDuration(timeToSet)
        setTimeRemaining(timeToSet)
        setIsActive(true)

        const end = Date.now() + timeToSet * 1000
        setEndTime(end)
        sessionStorage.setItem('gymlab_timer_end', end.toString())
        sessionStorage.setItem('gymlab_timer_dur', timeToSet.toString())
    }

    const stopTimer = () => {
        setIsActive(false)
        setTimeRemaining(0)
        setEndTime(null)
        sessionStorage.removeItem('gymlab_timer_end')
        sessionStorage.removeItem('gymlab_timer_dur')
    }

    const addTime = (seconds: number) => {
        if (!isActive) return
        setDuration(prev => prev + seconds)
        setTimeRemaining(prev => prev + seconds)
        setEndTime(prev => {
            if (!prev) return null
            const newEnd = prev + seconds * 1000
            sessionStorage.setItem('gymlab_timer_end', newEnd.toString())
            return newEnd
        })
    }

    return (
        <TimerContext.Provider value={{
            isActive,
            timeRemaining,
            duration,
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
