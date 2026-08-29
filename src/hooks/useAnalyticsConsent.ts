import { useEffect, useSyncExternalStore } from 'react'
import { disableAnalytics, enableAnalytics } from '../services/analytics'
import {
    ANALYTICS_CONSENT_KEY,
    getAnalyticsConsent,
    setAnalyticsConsent,
    subscribeToAnalyticsConsent,
} from '../services/analyticsConsent'

export function useAnalyticsConsent() {
    const consent = useSyncExternalStore(
        subscribeToAnalyticsConsent,
        getAnalyticsConsent,
        () => 'pending'
    )

    useEffect(() => {
        const syncOtherTabs = (event: StorageEvent) => {
            if (event.key === ANALYTICS_CONSENT_KEY) {
                // Storage events do not fire in the tab that made the change.
                window.location.reload()
            }
        }
        window.addEventListener('storage', syncOtherTabs)
        return () => window.removeEventListener('storage', syncOtherTabs)
    }, [])

    useEffect(() => {
        if (consent === 'accepted') enableAnalytics()
        else disableAnalytics()
    }, [consent])

    return {
        consent,
        acceptAnalytics: () => setAnalyticsConsent('accepted'),
        rejectAnalytics: () => setAnalyticsConsent('rejected'),
    }
}
