import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WorkoutProvider } from './context/WorkoutContext'
import App from './App'
import './index.css'

  // Apply theme before paint (avoid flash)
  ; (function () {
    const saved = localStorage.getItem('gymlab_theme')?.replace(/"/g, '') as string | null
    const theme = saved ?? 'system'
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  })()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WorkoutProvider>
        <App />
      </WorkoutProvider>
    </BrowserRouter>
  </StrictMode>
)
