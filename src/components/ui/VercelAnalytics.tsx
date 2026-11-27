import { Analytics, type BeforeSend } from '@vercel/analytics/react'
import { useSyncExternalStore } from 'react'
import { getAnalyticsConsent, subscribeToAnalyticsConsent } from '../../services/analyticsConsent'

const beforeSend: BeforeSend = event => {
    if (event.type !== 'pageview' || getAnalyticsConsent() !== 'accepted') return null

    const url = new URL(event.url, window.location.origin)
    url.pathname = url.pathname.replace(/(\/(?:day|exercise|week|history\/sessions))\/[^/]+/g, '$1/:id')
    url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
}

export function VercelAnalytics() {
    const consent = useSyncExternalStore(subscribeToAnalyticsConsent, getAnalyticsConsent, () => 'pending')

    return import.meta.env.PROD && consent === 'accepted'
        ? <Analytics mode="production" beforeSend={beforeSend} />
        : null
}
