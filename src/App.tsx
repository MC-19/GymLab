import { useLayoutEffect } from 'react'
import { Route, Routes, useLocation, useMatch, useNavigationType } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AnalyticsConsentBanner } from './components/ui/AnalyticsConsentBanner'
import { PwaReloadPrompt } from './components/ui/PwaReloadPrompt'
import { StorageErrorNotifier } from './components/ui/StorageErrorNotifier'
import { TimerWidget } from './components/ui/TimerWidget'
import { VercelAnalytics } from './components/ui/VercelAnalytics'
import { BodyWeightPage } from './features/bodyweight/components/BodyWeightPage'
import { SessionHistoryPage } from './features/training/SessionHistoryPage'
import { TrainingPage } from './features/training/TrainingPage'
import { Dashboard } from './pages/Dashboard'
import { ExercisePage } from './pages/ExercisePage'
import { HistoryPage } from './pages/HistoryPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { SettingsPage } from './pages/SettingsPage'
import { WeekPage } from './pages/WeekPage'
import { WorkoutDayPage } from './pages/WorkoutDayPage'

export default function App() {
  const isTraining = useMatch('/training') !== null
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return (
    <AppShell training={isTraining}>
      <PwaReloadPrompt />
      <AnalyticsConsentBanner />
      <VercelAnalytics />
      <StorageErrorNotifier />
      {!isTraining && <TimerWidget />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/day/:dayId" element={<WorkoutDayPage />} />
        <Route path="/day/:dayId/exercise/:exerciseId" element={<ExercisePage />} />
        <Route path="/day/:dayId/exercise/:exerciseId/week/:weekId" element={<WeekPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/history" element={<SessionHistoryPage />} />
        <Route path="/history/sessions" element={<SessionHistoryPage />} />
        <Route path="/history/sessions/:sessionId" element={<SessionHistoryPage />} />
        <Route path="/history/progression" element={<HistoryPage />} />
        <Route path="/weight" element={<BodyWeightPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </AppShell>
  )
}
