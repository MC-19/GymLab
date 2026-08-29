const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-SF0CY9BCYQ'
const SCRIPT_ID = 'gymlab-google-analytics'

type GtagCommand = 'js' | 'config' | 'consent'
type GtagArguments = [GtagCommand, ...unknown[]]

declare global {
    interface Window {
        dataLayer?: GtagArguments[]
        gtag?: (...args: GtagArguments) => void
        [key: `ga-disable-${string}`]: boolean | undefined
    }
}

function configureGtag() {
    window.dataLayer = window.dataLayer ?? []
    window.gtag = window.gtag ?? ((...args: GtagArguments) => window.dataLayer!.push(args))
}

export function enableAnalytics() {
    if (import.meta.env.DEV || typeof document === 'undefined') return

    window[`ga-disable-${MEASUREMENT_ID}`] = false
    configureGtag()
    window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    })

    if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
        document.head.appendChild(script)
    }

    window.gtag?.('js', new Date())
    window.gtag?.('config', MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
    })
}

export function disableAnalytics() {
    if (typeof window === 'undefined') return
    window[`ga-disable-${MEASUREMENT_ID}`] = true
    window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    })

    document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0]?.trim()
        if (name === '_ga' || name?.startsWith('_ga_')) {
            document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
        }
    })
}
