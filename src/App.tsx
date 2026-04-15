import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { WorkoutDayPage } from './pages/WorkoutDayPage'
import { ExercisePage } from './pages/ExercisePage'
import { WeekPage } from './pages/WeekPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { BodyWeightPage } from './features/bodyweight/components/BodyWeightPage'
import { TimerWidget } from './components/ui/TimerWidget'
import { PwaReloadPrompt } from './components/ui/PwaReloadPrompt'

export default function App() {
  return (
    <AppShell>
      <PwaReloadPrompt />
      <TimerWidget />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/day/:dayId" element={<WorkoutDayPage />} />
        <Route path="/day/:dayId/exercise/:exerciseId" element={<ExercisePage />} />
        <Route path="/day/:dayId/exercise/:exerciseId/week/:weekId" element={<WeekPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/weight" element={<BodyWeightPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
