import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Download, Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { getGymLabStorageKeys } from '../../utils/backup'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    backupError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, backupError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true, backupError: false }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[GymLab] Error no recuperable en la interfaz:', error, info)
    }

    private exportEmergencyBackup = () => {
        try {
            const storedData = Object.fromEntries(
                getGymLabStorageKeys(localStorage).map(key => [key, localStorage.getItem(key) ?? ''])
            )
            // Preserve the raw storage even if the corruption caused this boundary.
            let days: unknown[] = []
            try {
                const legacy: unknown = JSON.parse(storedData.gymlab_days ?? '[]')
                if (Array.isArray(legacy)) days = legacy
            } catch {
                // The original storage is still included below.
            }
            const backup = JSON.stringify({
                version: 2,
                exportedAt: new Date().toISOString(),
                emergency: true,
                days,
                localStorage: storedData,
            }, null, 2)
            const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }))
            const link = document.createElement('a')
            link.href = url
            link.download = `gymlab-backup-emergencia-${new Date().toISOString().slice(0, 10)}.json`
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('[GymLab] No se pudo crear el backup de emergencia:', error)
            this.setState({ backupError: true })
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <main className="flex min-h-dvh items-center justify-center bg-white px-5 text-gray-900 dark:bg-black dark:text-white">
                <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <TriangleAlert size={24} />
                    </div>
                    <h1 className="mt-4 text-xl font-bold">GymLab ha encontrado un problema</h1>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        Tus datos siguen guardados en el dispositivo. Puedes descargar una copia antes de intentar recuperar la aplicación.
                    </p>
                    {this.state.backupError && (
                        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
                            No se ha podido crear el backup. No borres los datos del navegador.
                        </p>
                    )}
                    <div className="mt-5 space-y-2">
                        <button onClick={this.exportEmergencyBackup} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                            <Download size={16} />
                            Descargar backup de emergencia
                        </button>
                        <button onClick={() => window.location.reload()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
                            <RefreshCw size={16} />
                            Recargar aplicación
                        </button>
                        <button onClick={() => window.location.assign('/')} className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <Home size={15} />
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </main>
        )
    }
}
