import { describe, expect, it } from 'vitest'
import { parseAnalyticsConsent } from './analyticsConsent'

describe('analytics consent', () => {
    it('keeps analytics pending when no valid choice exists', () => {
        expect(parseAnalyticsConsent(null)).toBe('pending')
        expect(parseAnalyticsConsent('unknown')).toBe('pending')
    })

    it('recognizes accepted and rejected choices', () => {
        expect(parseAnalyticsConsent('accepted-v2')).toBe('accepted')
        expect(parseAnalyticsConsent('rejected')).toBe('rejected')
    })

    it('asks again before applying an old acceptance to another analytics provider', () => {
        expect(parseAnalyticsConsent('accepted')).toBe('pending')
    })
})
