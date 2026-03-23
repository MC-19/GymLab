import type { BodyWeightEntry } from '../types'

interface WeightChartProps {
    /** Entries sorted ascending by date — caller guarantees length >= 2 */
    entries: BodyWeightEntry[]
}

const W = 600
const H = 140
const PAD = { top: 16, right: 16, bottom: 24, left: 44 }
const iW = W - PAD.left - PAD.right
const iH = H - PAD.top - PAD.bottom

export function WeightChart({ entries }: WeightChartProps) {
    const weights = entries.map(e => e.weight)
    const minW = Math.min(...weights)
    const maxW = Math.max(...weights)
    const range = maxW - minW || 1

    const toX = (i: number) => PAD.left + (i / (entries.length - 1)) * iW
    const toY = (w: number) => PAD.top + iH - ((w - minW) / range) * iH

    const pts = entries.map((e, i) => ({ x: toX(i), y: toY(e.weight), ...e }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = [
        line,
        `L${pts.at(-1)!.x.toFixed(1)},${(PAD.top + iH).toFixed(1)}`,
        `L${pts[0].x.toFixed(1)},${(PAD.top + iH).toFixed(1)}Z`,
    ].join(' ')

    // 3 Y-axis ticks
    const yTicks = [minW, (minW + maxW) / 2, maxW].map(v => ({
        val: Math.round(v * 10) / 10,
        y: toY(v),
    }))

    // X-axis: first, middle, last
    const xIdxs = [...new Set([0, Math.floor((entries.length - 1) / 2), entries.length - 1])]

    return (
        <div className="w-full overflow-hidden rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }} aria-label="Evolución del peso">
                <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {yTicks.map(t => (
                    <line key={t.val} x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y}
                        stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
                ))}

                <path d={area} fill="url(#wGrad)" />
                <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                ))}

                {yTicks.map(t => (
                    <text key={t.val} x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.5">
                        {t.val}
                    </text>
                ))}

                {xIdxs.map(i => (
                    <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45">
                        {entries[i].date.slice(5)}
                    </text>
                ))}
            </svg>
        </div>
    )
}
