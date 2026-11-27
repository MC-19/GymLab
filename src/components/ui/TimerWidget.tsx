import { ChevronRight, Minus, Plus, Timer, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTimer } from '../../context/TimerContext'

export function TimerWidget({ placement = 'floating' }: { placement?: 'floating' | 'training' }) {
    const { isActive, timeRemaining, duration, stopTimer, addTime } = useTimer()
    const [isMinimized, setIsMinimized] = useState(false)
    const touchStartX = useRef(0)

    // Reset minimized state when timer finishes or stops
    useEffect(() => {
        // The timer widget must reset local UI state when the external timer stops.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!isActive) setIsMinimized(false)
    }, [isActive])

    if (!isActive) return null

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (timeRemaining / duration) * 100 : 0
    const isLowTime = timeRemaining <= 10

    const inTraining = placement === 'training'
    const size = inTraining ? 'h-11 w-11 rounded-xl' : 'h-10 w-10 rounded-full'
    const controls = (
        <div className={`flex items-center ${inTraining ? 'training-timer-actions gap-1' : 'gap-2'}`}>
            <button
                type="button"
                onClick={() => addTime(-30)}
                aria-label="Restar 30 segundos"
                className={`${size} bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform shrink-0`}
            >
                <Minus size={18} />
            </button>
            <button
                type="button"
                onClick={() => addTime(30)}
                aria-label="Añadir 30 segundos"
                className={`${size} bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 active:scale-95 transition-transform shrink-0`}
            >
                <Plus size={18} />
            </button>
            {!inTraining && <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1" />}
            <button
                type="button"
                onClick={stopTimer}
                aria-label="Detener temporizador"
                className={`${size} bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-[color,background-color,scale] shrink-0`}
            >
                <X size={18} />
            </button>
        </div>
    )
    const progressBar = (
        <div
            className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear ${isLowTime ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
        />
    )

    if (inTraining) {
        return (
            <div className="relative flex min-h-11 items-center justify-between gap-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-3 pr-1 py-1">
                {progressBar}
                <div className="flex items-center gap-2">
                    <Timer size={17} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Descanso</p>
                        <p role="timer" aria-label="Tiempo de descanso restante"
                            className={`text-xl tabular-nums font-bold leading-none ${isLowTime ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {formatTime(timeRemaining)}
                        </p>
                    </div>
                </div>
                {controls}
            </div>
        )
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX
        const diff = touchEndX - touchStartX.current
        // Si se desliza significativamente hacia la derecha o izquierda, se oculta
        if (Math.abs(diff) > 50) {
            setIsMinimized(true)
        }
    }

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                aria-label={`Abrir temporizador, quedan ${formatTime(timeRemaining)}`}
                className="fixed bottom-24 -right-1 z-50 flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl pl-3 pr-4 py-2.5 rounded-l-2xl animate-fade-in hover:-translate-x-1 transition-transform active:scale-95"
            >
                <ChevronRight size={14} className="text-gray-400 rotate-180" />
                <Timer size={14} className="text-blue-500" />
                <span className={`font-display font-bold tabular-nums text-sm ${isLowTime ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {formatTime(timeRemaining)}
                </span>
            </button>
        )
    }

    return (
        <div 
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-slide-up"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Ocultar indicator */}
            <div className="absolute -top-6 left-0 right-0 flex justify-center opacity-50">
                <span className="text-[10px] font-semibold text-gray-500 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    Desliza para ocultar
                </span>
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-[2rem] shadow-2xl p-4 flex items-center justify-between gap-3">
                {progressBar}

                <div className="flex flex-col pl-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                        DESCANSO
                    </span>
                    <span className={`font-display text-3xl font-extrabold tabular-nums tracking-tight ${isLowTime ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>

                {controls}
            </div>
        </div>
    )
}
