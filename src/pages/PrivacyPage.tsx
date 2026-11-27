import { ArrowLeft, Database, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/layout/PageHeader'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function PrivacyPage() {
    const navigate = useNavigate()
    useDocumentTitle('Privacidad y cookies — GymLab')

    return (
        <div>
            <PageHeader>
                <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-5">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Volver"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="min-w-0 flex-1 text-base font-bold leading-tight text-gray-900 dark:text-white">Privacidad y cookies</h1>
                    <ThemeToggle />
                </div>
            </PageHeader>

            <main className="page-enter mx-auto max-w-lg space-y-6 px-5 pb-28 pt-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                <div className="rounded-3xl border border-blue-200/60 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-200">Tus entrenamientos son privados</p>
                            <p className="mt-0.5 text-xs text-blue-800/80 dark:text-blue-300/80">
                                GymLab no necesita una cuenta y guarda tus datos deportivos en tu dispositivo.
                            </p>
                        </div>
                    </div>
                </div>

                <PolicySection title="1. Datos almacenados en tu dispositivo">
                    <p>
                        Las rutinas, programas, ejercicios, series, pesos, notas, historial, peso corporal, temporizador y preferencias se guardan localmente en el almacenamiento de tu navegador.
                    </p>
                    <p>
                        GymLab no envía estos datos a un servidor propio. Puedes exportarlos, importarlos o eliminarlos desde <Link to="/settings" className="font-medium text-blue-600 underline underline-offset-2 dark:text-blue-400">Ajustes</Link>.
                    </p>
                </PolicySection>

                <PolicySection title="2. Google Analytics">
                    <p>
                        Con tu permiso, GymLab utiliza Google Analytics 4 para conocer datos generales como visitas, dispositivo aproximado, páginas consultadas y duración de la sesión. Esta información ayuda a detectar problemas y mejorar la aplicación.
                    </p>
                    <p>
                        No enviamos a Analytics el contenido de tus rutinas, pesos levantados, peso corporal, notas, series ni archivos de backup. Las señales publicitarias y la personalización de anuncios están desactivadas.
                    </p>
                    <p>
                        Analytics permanece bloqueado hasta que eliges “Aceptar analítica”. Puedes retirar o conceder el permiso posteriormente desde Ajustes.
                    </p>
                </PolicySection>

                <PolicySection title="3. Cookies y almacenamiento">
                    <div className="overflow-hidden rounded-2xl border border-gray-200/70 dark:border-white/10">
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-200/70 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <span className="font-medium text-gray-900 dark:text-white">Almacenamiento esencial</span>
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">Siempre activo</span>
                        </div>
                        <p className="px-4 py-3 text-xs">
                            Conserva entrenamientos, tema, temporizador, backups y tu elección de privacidad. Es necesario para que la aplicación funcione.
                        </p>
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-y border-gray-200/70 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <span className="font-medium text-gray-900 dark:text-white">Cookies analíticas (_ga)</span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Opcional</span>
                        </div>
                        <p className="px-4 py-3 text-xs">
                            Solo se crean después de aceptar Analytics. Al retirar el permiso, GymLab bloquea los envíos y elimina las cookies analíticas que puede identificar.
                        </p>
                    </div>
                </PolicySection>

                <PolicySection title="4. Proveedores externos">
                    <p>
                        Google presta el servicio de Analytics y puede tratar información técnica conforme a sus propias condiciones. Las fuentes de la interfaz están incluidas en GymLab y no requieren conectarse con Google Fonts.
                    </p>
                    <p>
                        Algunas demostraciones visuales de ejercicios proceden de FitnessProgramer y solo se solicitan cuando consultas contenido que las utiliza. Ese proveedor puede recibir información técnica básica de la conexión, como la dirección IP.
                    </p>
                    <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-blue-600 underline underline-offset-2 dark:text-blue-400"
                    >
                        Política de privacidad de Google
                        <ExternalLink size={13} />
                    </a>
                </PolicySection>

                <PolicySection title="5. Control y conservación">
                    <p>
                        Puedes rechazar la analítica sin perder ninguna función de GymLab. Los datos locales permanecen hasta que los elimines, borres los datos del navegador o desinstales la PWA. Los plazos aplicables a Analytics son los configurados en la propiedad de Google Analytics.
                    </p>
                </PolicySection>

                <PolicySection title="6. Responsable y contacto">
                    <div className="rounded-2xl border border-gray-200/70 bg-gray-50 p-4 text-xs dark:border-white/10 dark:bg-white/5">
                        <dl className="space-y-2">
                            <div>
                                <dt className="font-semibold text-gray-900 dark:text-white">Responsable</dt>
                                <dd>Mario Cristian Dascalu Marisca</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-gray-900 dark:text-white">País</dt>
                                <dd>España</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-gray-900 dark:text-white">Contacto de privacidad</dt>
                                <dd>
                                    <a className="text-blue-600 underline underline-offset-2 dark:text-blue-400" href="mailto:mc.software.dev09@gmail.com">
                                        mc.software.dev09@gmail.com
                                    </a>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </PolicySection>

                <div className="flex items-start gap-3 rounded-3xl border border-blue-200/70 bg-blue-50 p-4 text-xs text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/8 dark:text-blue-300">
                    <Database size={16} className="mt-0.5 shrink-0" />
                    <p>
                        Para ejercer derechos relacionados con la información gestionada por GymLab o realizar una consulta de privacidad, utiliza el correo indicado arriba.
                    </p>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                    Última actualización: 29 de agosto de 2026
                </p>
            </main>
        </div>
    )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2.5">
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            {children}
        </section>
    )
}
