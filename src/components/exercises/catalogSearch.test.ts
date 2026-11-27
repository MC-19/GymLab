import { describe, expect, it } from 'vitest'
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog'
import { searchExerciseCatalog } from './catalogSearch'

describe('searchExerciseCatalog', () => {
    it('matches partial names across words, accents and case', () => {
        const matches = searchExerciseCatalog('  PECHO   jalon ')

        expect(matches.map(exercise => exercise.id)).toContain('jalon_pecho')
    })

    it('requires every searched word and respects the selected group', () => {
        expect(searchExerciseCatalog('jalon inventado')).toEqual([])
        expect(searchExerciseCatalog('jalón pecho', 'Espalda').map(exercise => exercise.id)).toContain('jalon_pecho')
        expect(searchExerciseCatalog('jalón pecho', 'Pecho')).toEqual([])
    })

    it('shows the full catalog for a blank search and filters it without a query', () => {
        expect(searchExerciseCatalog('   ')).toEqual(EXERCISE_CATALOG)
        expect(searchExerciseCatalog('', 'Pecho')).toEqual(EXERCISE_CATALOG.filter(exercise => exercise.muscleGroup === 'Pecho'))
    })
})
