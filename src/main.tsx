import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WorkoutProvider } from './context/WorkoutContext'
import { TimerProvider } from './context/TimerContext'
import App from './App'
import { TrainingProvider } from './features/training/TrainingContext'
import { recoverTrainingRestore, TrainingRecoveryError } from './features/training/backup'
import { initializeStorageGeneration, STORAGE_GENERATION_KEY } from './services/storageGeneration'
import './index.css'
import { AppErrorBoundary } from './components/errors/AppErrorBoundary'

function applyTheme() {
  const theme = localStorage.getItem('gymlab_theme')?.replace(/"/g, '') ?? 'system'
  document.documentElement.classList.toggle('dark',
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
}

async function boot() {
  let recoveryError: TrainingRecoveryError | undefined
  try {
    await recoverTrainingRestore(localStorage)
  } catch (error) {
    if (error instanceof TrainingRecoveryError) recoveryError = error
    else console.error('No se pudo comprobar la restauración de GymLab Training:', error)
  }

  initializeStorageGeneration(localStorage)
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_GENERATION_KEY && event.storageArea === localStorage) window.location.reload()
  })
  applyTheme()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary startupError={!!recoveryError}>
          <BrowserRouter>
            <WorkoutProvider>
              <TimerProvider>
                <TrainingProvider>
                  <App />
                </TrainingProvider>
              </TimerProvider>
            </WorkoutProvider>
          </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>,
  )
}

void boot()
