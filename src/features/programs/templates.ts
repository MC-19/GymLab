import { EXERCISE_CATALOG } from '../../data/exerciseCatalog'
import type { ExerciseGoals, WorkoutDay } from '../../types'
import { generateId } from '../../utils/helpers'
import { DEFAULT_GOALS } from './goals'

interface TemplateDay {
    name: string
    main: string[]
    accessories: string[]
}

export interface ProgramTemplate {
    id: string
    name: string
    days: TemplateDay[]
    strength?: true
}

const fullBody: TemplateDay[] = [
    { name: 'Cuerpo completo A', main: ['sentadilla_libre', 'press_banca_plano', 'remo_barra'], accessories: ['curl_femoral_tumbado', 'elevaciones_laterales'] },
    { name: 'Cuerpo completo B', main: ['peso_muerto_rumano', 'press_militar_barra', 'jalon_pecho'], accessories: ['zancadas_mancuernas', 'crunch_abdominal'] },
    { name: 'Cuerpo completo C', main: ['prensa_45', 'press_inclinado_mancuernas', 'remo_gironda'], accessories: ['hip_thrust', 'elevacion_talones_pie'] },
]

const upperLower: TemplateDay[] = [
    { name: 'Torso A', main: ['press_banca_plano', 'remo_barra'], accessories: ['jalon_pecho', 'elevaciones_laterales', 'triceps'] },
    { name: 'Pierna A', main: ['sentadilla_libre', 'peso_muerto_rumano'], accessories: ['curl_femoral_tumbado', 'elevacion_talones_pie'] },
    { name: 'Torso B', main: ['press_militar_barra', 'press_inclinado_mancuernas'], accessories: ['remo_gironda', 'face_pulls', 'curl_biceps_barra'] },
    { name: 'Pierna B', main: ['prensa_45', 'hip_thrust'], accessories: ['extension_cuadriceps', 'curl_femoral_tumbado', 'elevacion_talones_sentado'] },
]

const ppl: TemplateDay[] = [
    { name: 'Empuje', main: ['press_banca_plano', 'press_militar_mancuernas'], accessories: ['elevaciones_laterales', 'triceps'] },
    { name: 'Tirón', main: ['remo_barra', 'jalon_pecho'], accessories: ['face_pulls', 'curl_biceps_barra'] },
    { name: 'Piernas', main: ['sentadilla_libre', 'peso_muerto_rumano'], accessories: ['extension_cuadriceps', 'elevacion_talones_pie'] },
]
const pplB: TemplateDay[] = [
    { name: 'Empuje B', main: ['press_inclinado_mancuernas', 'press_militar_mancuernas'], accessories: ['cruces_polea', 'triceps'] },
    { name: 'Tirón B', main: ['remo_gironda', 'jalon_pecho'], accessories: ['pajaros', 'curl_martillo'] },
    { name: 'Piernas B', main: ['prensa_45', 'hip_thrust'], accessories: ['curl_femoral_tumbado', 'elevacion_talones_sentado'] },
]

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
    { id: 'full-body', name: 'Full Body · 3 días', days: fullBody },
    { id: 'upper-lower', name: 'Upper/Lower · 4 días', days: upperLower },
    { id: 'ppl-3', name: 'Push Pull Legs · 3 días', days: ppl },
    { id: 'ppl-6', name: 'Push Pull Legs · 6 días', days: [...ppl.map(day => ({ ...day, name: `${day.name} A` })), ...pplB] },
    { id: 'strength', name: 'Fuerza · 4 días', strength: true, days: [
        { name: 'Fuerza · Banca', main: ['press_banca_plano'], accessories: ['remo_barra', 'press_militar_mancuernas', 'triceps'] },
        { name: 'Fuerza · Sentadilla', main: ['sentadilla_libre'], accessories: ['prensa_45', 'curl_femoral_tumbado', 'elevacion_talones_pie'] },
        { name: 'Fuerza · Press militar', main: ['press_militar_barra'], accessories: ['press_mancuernas_plano', 'jalon_pecho', 'remo_gironda'] },
        { name: 'Fuerza · Bisagra', main: ['peso_muerto_rumano'], accessories: ['sentadilla_libre', 'hip_thrust', 'crunch_abdominal'] },
    ] },
]

const strengthGoals: ExerciseGoals = { sets: 4, minReps: 3, maxReps: 5, targetRir: 2, restSeconds: 180, incrementKg: 2.5 }
const accessoryGoals: ExerciseGoals = { ...DEFAULT_GOALS, minReps: 10, maxReps: 15, restSeconds: 90, incrementKg: 1 }

export function buildTemplateDays(template: ProgramTemplate, now = new Date()): WorkoutDay[] {
    return template.days.map((day, order) => ({
        id: generateId(), name: day.name, order, createdAt: now.toISOString(),
        exercises: [...day.main, ...day.accessories].map((catalogId, index) => {
            const exercise = EXERCISE_CATALOG.find(entry => entry.id === catalogId)
            if (!exercise) throw new Error(`Ejercicio de plantilla desconocido: ${catalogId}`)
            const goals = index >= day.main.length ? accessoryGoals : template.strength ? strengthGoals : DEFAULT_GOALS
            return { id: generateId(), catalogId, name: exercise.name, muscleGroup: exercise.muscleGroup, goals: { ...goals }, weeks: [] }
        }),
    }))
}
