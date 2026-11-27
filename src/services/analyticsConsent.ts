export type AnalyticsConsent = 'pending' | 'accepted' | 'rejected'

export const ANALYTICS_CONSENT_KEY = 'gymlab_analytics_consent'
const ACCEPTED_CONSENT = 'accepted-v2'

const listeners = new Set<() => void>()

export function parseAnalyticsConsent(value: string | null): AnalyticsConsent {
    if (value === ACCEPTED_CONSENT) return 'accepted'
    return value === 'rejected' ? 'rejected' : 'pending'
}

export function getAnalyticsConsent(): AnalyticsConsent {
    if (typeof localStorage === 'undefined') return 'pending'
    return parseAnalyticsConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY))
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'pending'>) {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, consent === 'accepted' ? ACCEPTED_CONSENT : consent)
    listeners.forEach(listener => listener())
}

export function subscribeToAnalyticsConsent(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
