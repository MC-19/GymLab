import { useCallback, useRef } from 'react'

export function useAudioBeep() {
    const audioCtxRef = useRef<AudioContext | null>(null)

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            // @ts-ignore - Vendor prefixed for older iOS Safari
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            audioCtxRef.current = new AudioContextClass()
        }
        return audioCtxRef.current
    }

    const playBeep = useCallback((frequency = 880, type: OscillatorType = 'sine', duration = 0.1) => {
        try {
            const ctx = getAudioContext()
            // Safari blocks audio context until user interaction. We attempt to resume if suspended.
            if (ctx.state === 'suspended') {
                ctx.resume()
            }

            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.type = type
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

            // Start at a smooth volume and fade out to avoid speaker pops
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + duration)
        } catch (e) {
            console.warn('Audio playback not supported or blocked:', e)
        }
    }, [])

    const playStartBeep = useCallback(() => {
        playBeep(659.25, 'sine', 0.15) // E5
    }, [playBeep])

    const playFinishBeeps = useCallback(() => {
        playBeep(880, 'sine', 0.15) // A5
        setTimeout(() => playBeep(880, 'sine', 0.15), 250)
        setTimeout(() => playBeep(1046.50, 'sine', 0.4), 500) // C6
    }, [playBeep])

    return { playStartBeep, playFinishBeeps }
}
