import { EXERCISE_CATALOG } from '../../data/exerciseCatalog'
import type { MuscleGroup } from '../../types'
import { normalizeString } from '../../utils/stringUtils'

const searchableCatalog = EXERCISE_CATALOG.map(exercise => ({
    exercise,
    name: normalizeString(exercise.name),
}))

export function searchExerciseCatalog(query: string, group?: MuscleGroup) {
    const words = query.trim().split(/\s+/).map(normalizeString).filter(Boolean)
    return searchableCatalog
        .filter(({ exercise, name }) => (!group || exercise.muscleGroup === group) && words.every(word => name.includes(word)))
        .map(({ exercise }) => exercise)
}
