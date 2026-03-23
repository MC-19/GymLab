import { useTimer } from '../../context/TimerContext'
import { X, Plus, Minus } from 'lucide-react'

export function TimerWidget() {
    const { isActive, timeRemaining, duration, stopTimer, addTime } = useTimer()

    if (!isActive) return null

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (timeRemaining / duration) * 100 : 0
    const isLowTime = timeRemaining <= 10

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-slide-up">
            <div className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-[2rem] shadow-2xl p-4 flex items-center justify-between gap-3">
                {/* Background progress bar */}
                <div
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear ${isLowTime ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                />

                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                        DESCANSO
                    </span>
                    <span className={`font-display text-3xl font-extrabold tabular-nums tracking-tight ${isLowTime ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => addTime(-30)}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
                    >
                        <Minus size={18} />
                    </button>
                    <button
                        onClick={() => addTime(30)}
                        className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Plus size={18} />
                    </button>
                    <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1" />
                    <button
                        onClick={stopTimer}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
