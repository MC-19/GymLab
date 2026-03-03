import { useEffect, useState } from 'react'

/**
 * Returns the height of the virtual keyboard in pixels.
 * Uses the VisualViewport API, which correctly accounts for
 * the keyboard in PWA standalone mode on iOS and Android.
 *
 * When the keyboard is hidden, returns 0.
 */
export function useKeyboardHeight(): number {
    const [keyboardHeight, setKeyboardHeight] = useState(0)

    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return

        const update = () => {
            // Keyboard height = layout viewport height minus visible area height minus scroll offset
            const kh = window.innerHeight - vv.height - vv.offsetTop
            setKeyboardHeight(Math.max(0, kh))
        }

        vv.addEventListener('resize', update)
        vv.addEventListener('scroll', update)
        update()

        return () => {
            vv.removeEventListener('resize', update)
            vv.removeEventListener('scroll', update)
        }
    }, [])

    return keyboardHeight
}
