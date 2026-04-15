import { useMemo } from 'react'
import type { WeekProgress } from '../../utils/helpers'

interface ExerciseMiniChartProps {
    progress: WeekProgress[]
}

const W = 600
const H = 60
const PAD = { top: 8, right: 16, bottom: 0, left: 16 }
const iW = W - PAD.left - PAD.right
const iH = H - PAD.top - PAD.bottom

export function ExerciseMiniChart({ progress }: ExerciseMiniChartProps) {
    const { minW, maxW, range, pts, line, area } = useMemo(() => {
        if (progress.length === 0) return { minW: 0, maxW: 0, range: 1, pts: [], line: '', area: '' }
        
        // Si hay solo un punto, lo duplicamos para poder dibujar una línea plana
        const safeProgress = progress.length === 1 ? [progress[0], progress[0]] : progress
        
        const weights = safeProgress.map(e => e.maxWeight)
        const minW = Math.min(...weights)
        const maxW = Math.max(...weights)
        const range = maxW - minW || 1

        const toX = (i: number) => PAD.left + (i / (safeProgress.length - 1)) * iW
        const toY = (w: number) => PAD.top + iH - ((w - minW) / range) * iH

        const pts = safeProgress.map((e, i) => ({ x: toX(i), y: toY(e.maxWeight), ...e }))
        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        const area = [
            line,
            `L${pts.at(-1)!.x.toFixed(1)},${(PAD.top + iH).toFixed(1)}`,
            `L${pts[0].x.toFixed(1)},${(PAD.top + iH).toFixed(1)}Z`,
        ].join(' ')

        return { minW, maxW, range, pts, line, area }
    }, [progress])

    if (progress.length === 0) return null

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '60px' }} aria-label="Evolución del ejercicio">
                <defs>
                    <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Línea horizontal de base */}
                <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + iH} y2={PAD.top + iH} 
                      stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />

                <path d={area} fill="url(#exGrad)" />
                <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {pts.map((p, i) => (
                    // Si solo era un punto duplicado, dibujamos solo un círculo en el centro
                    (progress.length === 1 && i === 1) ? null :
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                ))}
            </svg>
        </div>
    )
}
