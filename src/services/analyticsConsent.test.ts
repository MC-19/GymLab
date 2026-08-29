import { describe, expect, it } from 'vitest'
import { parseAnalyticsConsent } from './analyticsConsent'

describe('analytics consent', () => {
    it('keeps analytics pending when no valid choice exists', () => {
        expect(parseAnalyticsConsent(null)).toBe('pending')
        expect(parseAnalyticsConsent('unknown')).toBe('pending')
    })

    it('recognizes accepted and rejected choices', () => {
        expect(parseAnalyticsConsent('accepted')).toBe('accepted')
        expect(parseAnalyticsConsent('rejected')).toBe('rejected')
    })
})
