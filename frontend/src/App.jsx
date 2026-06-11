import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'

import SplashScreen from './components/SplashScreen'
import Navbar from './components/Navbar'
import ToastNotifications from './components/ToastNotifications'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import GamePage from './pages/GamePage'
import MultiplayerPage from './pages/MultiplayerPage'
import MultiplayerArenaPage from './pages/MultiplayerArenaPage'
import DashboardPage from './pages/DashboardPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000)
    return () => clearTimeout(t)
  }, [])

  if (loading) return null

  return (
    <div data-theme="dark">
      <div className="app-bg" />
      {showSplash && <SplashScreen />}
      <Navbar />
      <ToastNotifications />
      <div className="page-wrapper">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/game" element={
            <ProtectedRoute><GamePage /></ProtectedRoute>
          } />
          <Route path="/multiplayer" element={
            <ProtectedRoute><MultiplayerPage /></ProtectedRoute>
          } />
          <Route path="/multiplayer/arena" element={
            <ProtectedRoute><MultiplayerArenaPage /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
