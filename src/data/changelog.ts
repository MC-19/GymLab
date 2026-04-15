import { Sparkles, Dumbbell, Image as ImageIcon, Globe2, Link2, CheckCircle2, Layers, ClockFading } from 'lucide-react'

export interface ChangelogFeature {
    icon: any
    title: string
    description: string
}

export interface ChangelogEntry {
    version: string
    date: string
    title: string
    features: ChangelogFeature[]
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: '1.3.0',
        date: new Date().toISOString().split('T')[0],
        title: 'Programas y Evolución a Vista de Pájaro 🦅',
        features: [
            {
                icon: Layers,
                title: 'Bloques de Entrenamiento (Programas)',
                description: 'La funcionalidad más pedida. Agrupa tus rutinas en bloques (Ej: Hipertrofia Verano, Fuerza). Cambia de programa sin perder tu historial y crea nuevos ciclos.'
            },
            {
                icon: Sparkles,
                title: 'Gráficos de Área Suavizados',
                description: 'Adiós a las barras simples. El nuevo historial usa gráficos de área dinámicos y premium para que visualices tu progreso como debe ser.'
            },
            {
                icon: ClockFading,
                title: 'Filtros de Historial Pro',
                description: 'Ahora puedes filtrar tu progresión por semanas completas, meses o vista trimestral. Además, localiza rápidamente el progreso usando los nuevos filtros rápidos por rutina.'
            }
        ]
    },
    {
        version: '1.2.0',
        date: '2026-03-27',
        title: 'La gran actualización visual 🎨',
        features: [
            {
                icon: Globe2,
                title: '100% en Castellano Castellano',
                description: 'Toda la interfaz, nombres anatómicos (Gemelos, Trapecios) y consejos han sido adaptados perfectamente al español de España.'
            },
            {
                icon: Dumbbell,
                title: 'Catálogo Visual Experto',
                description: 'Nuestra base de datos ha crecido a más de 60 ejercicios. Hemos solucionado todos los enlaces y añadido nueva bibliografía.'
            },
            {
                icon: ImageIcon,
                title: 'Técnica en GIF y Miniaturas',
                description: 'Ahora verás miniaturas de los ejercicios directamente en tu rutina diaria y vídeos de técnica (GIF) al pulsar sobre información.'
            },
            {
                icon: Link2,
                title: 'Vinculación Inteligente',
                description: 'La joya de la corona. Enlaza tus ejercicios personalizados con nuestro catálogo visual y mantén tu propio historial e identidades.'
            }
        ]
    },
    {
        version: '1.1.0',
        date: '2026-03-23',
        title: 'Catálogo y Grupos Musculares',
        features: [
            {
                icon: Sparkles,
                title: 'Catálogo de Ejercicios Inteligente',
                description: 'Olvídate de teclear. Tienes más de 60 ejercicios clasificados con buscador integrado.'
            },
            {
                icon: Layers,
                title: 'Grupos Musculares Detallados',
                description: 'Separa tu volumen de entrenamiento como un pro: Bíceps, Tríceps, Cuádriceps, Femorales y más.'
            },
            {
                icon: CheckCircle2,
                title: 'Edita tus rutinas pasadas',
                description: 'Puedes darle a "Editar" a cualquiera de tus ejercicios antiguos y asignarle un grupo muscular a posteriori.'
            }
        ]
    }
]

export const LATEST_VERSION = CHANGELOG[0].version
