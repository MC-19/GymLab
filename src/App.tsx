import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { WorkoutDayPage } from './pages/WorkoutDayPage'
import { ExercisePage } from './pages/ExercisePage'
import { WeekPage } from './pages/WeekPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { RoutinesPage } from './pages/RoutinesPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/day/:dayId" element={<WorkoutDayPage />} />
        <Route path="/day/:dayId/exercise/:exerciseId" element={<ExercisePage />} />
        <Route path="/day/:dayId/exercise/:exerciseId/week/:weekId" element={<WeekPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
