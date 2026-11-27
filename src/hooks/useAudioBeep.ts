import { useCallback, useEffect, useRef } from 'react'

export function useAudioBeep() {
    const audioCtxRef = useRef<AudioContext | null>(null)

    useEffect(() => () => {
        const context = audioCtxRef.current
        audioCtxRef.current = null
        if (context) void context.close().catch(() => undefined)
    }, [])

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            // @ts-expect-error Vendor prefixed for older iOS Safari
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            audioCtxRef.current = new AudioContextClass()
        }
        return audioCtxRef.current
    }

    const playBeep = useCallback((frequency = 880, type: OscillatorType = 'sine', duration = 0.1, delay = 0) => {
        try {
            const ctx = getAudioContext()
            // Safari blocks audio context until user interaction. We attempt to resume if suspended.
            if (ctx.state === 'suspended') {
                void ctx.resume().catch(() => undefined)
            }

            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            const start = ctx.currentTime + delay
            oscillator.type = type
            oscillator.frequency.setValueAtTime(frequency, start)

            // Start at a smooth volume and fade out to avoid speaker pops
            gainNode.gain.setValueAtTime(0.5, start)
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration)

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.start(start)
            oscillator.stop(start + duration)
        } catch (e) {
            console.warn('Audio playback not supported or blocked:', e)
        }
    }, [])

    const playStartBeep = useCallback(() => {
        playBeep(659.25, 'sine', 0.15) // E5
    }, [playBeep])

    const playFinishBeeps = useCallback(() => {
        playBeep(880, 'sine', 0.15) // A5
        playBeep(880, 'sine', 0.15, 0.25)
        playBeep(1046.50, 'sine', 0.4, 0.5) // C6
    }, [playBeep])

    return { playStartBeep, playFinishBeeps }
}
