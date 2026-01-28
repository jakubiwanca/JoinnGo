import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import AdminPanel from './pages/AdminPanel'
import { getProfile, logout } from './api/auth'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import './App.css'
import EventDetailsPage from './pages/EventDetailsPage'
import Navbar from './components/Navbar'
import CreateEventModal from './components/CreateEventModal'
import OnboardingModal from './components/OnboardingModal'
import ConfirmEmailPage from './pages/ConfirmEmailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RejectionModal from './components/RejectionModal'
import apiClient from './api/axiosClient'
import { leaveEvent } from './api/events'

const AuthenticatedLayout = ({ children, user, handleLogout, setCreateModalOpen }) => {
  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenCreateModal={() => setCreateModalOpen(true)}
      />
      <div style={{ paddingTop: '20px' }}>{children}</div>
    </>
  )
}

const ProtectedRoute = ({ children, user }) => {
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [rejectedEvents, setRejectedEvents] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const userData = await getProfile()
      setUser(userData)
      if (userData) {
        checkRejections()
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const checkRejections = async () => {
    try {
      const res = await apiClient.get('event/my-joined')
      if (res.data) {
        const rejected = res.data.filter((e) => e.myStatus === 'Rejected' || e.myStatus === 2)
        if (rejected.length > 0) {
          setRejectedEvents(rejected)
        }
      }
    } catch (err) {
      console.error('Błąd sprawdzania odrzuconych:', err)
    }
  }

  const handleClearRejections = async () => {
    try {
      await Promise.all(rejectedEvents.map((e) => leaveEvent(e.id)))
      setRejectedEvents([])
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error('Błąd czyszczenia powiadomień:', err)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    await checkSession()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Błąd wylogowania', e)
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  const handleEventCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        Ładowanie aplikacji...
      </div>
    )
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute user={user}>
              <AuthenticatedLayout
                user={user}
                handleLogout={handleLogout}
                setCreateModalOpen={setCreateModalOpen}
              >
                <Home
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                  refreshTrigger={refreshTrigger}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/landing" element={user ? <Navigate to="/home" /> : <LandingPage />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/home" /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/home" /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute user={user}>
              <AuthenticatedLayout
                user={user}
                handleLogout={handleLogout}
                setCreateModalOpen={setCreateModalOpen}
              >
                <PublicProfilePage
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            user && user.role === 'Admin' ? (
              <ProtectedRoute user={user}>
                <AuthenticatedLayout
                  user={user}
                  handleLogout={handleLogout}
                  setCreateModalOpen={setCreateModalOpen}
                >
                  <AdminPanel
                    token={null}
                    currentUserId={parseInt(user.id, 10)}
                    onLogout={handleLogout}
                  />
                </AuthenticatedLayout>
              </ProtectedRoute>
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <AuthenticatedLayout
                user={user}
                handleLogout={handleLogout}
                setCreateModalOpen={setCreateModalOpen}
              >
                <ProfilePage
                  currentUserEmail={user?.email}
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                  refreshTrigger={refreshTrigger}
                  currentUserUsername={user?.username}
                  followersCount={user?.followersCount || 0}
                  onProfileUpdate={checkSession}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/event/:id"
          element={
            <ProtectedRoute user={user}>
              <AuthenticatedLayout
                user={user}
                handleLogout={handleLogout}
                setCreateModalOpen={setCreateModalOpen}
              >
                <EventDetailsPage
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>

      {user && createModalOpen && (
        <CreateEventModal
          onClose={() => setCreateModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}

      {user && !user.username && <OnboardingModal />}

      {rejectedEvents.length > 0 && (
        <RejectionModal
          rejectedEvents={rejectedEvents}
          onConfirm={handleClearRejections}
          onClose={() => {}}
        />
      )}
    </div>
  )
}

export default App
