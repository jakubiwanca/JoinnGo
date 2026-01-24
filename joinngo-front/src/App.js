import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import AdminPanel from './pages/AdminPanel'
import { getProfile, logout } from './api/auth'
import ProfilePage from './pages/ProfilePage'
import './App.css'
import EventDetailsPage from './pages/EventDetailsPage'
import Navbar from './components/Navbar'
import CreateEventModal from './components/CreateEventModal'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const userData = await getProfile()
      setUser(userData)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
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
    }
  }

  const handleEventCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Layout for authenticated pages
  const AuthenticatedLayout = ({ children }) => {
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

  const ProtectedRoute = ({ children }) => {
    const location = window.location

    if (!user) {
      return <Navigate to="/landing" replace />
    }

    // Onboarding check
    if (!user.username && window.location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />
    }

    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        Ładowanie aplikacji...
      </div>
    )
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                  refreshTrigger={refreshTrigger}
                />
              </ProtectedRoute>
            }
          />

          <Route path="/landing" element={user ? <Navigate to="/" /> : <LandingPage />} />

          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
          />

          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
          />

          <Route
            path="/admin"
            element={
              user && user.role === 'Admin' ? (
                <ProtectedRoute>
                  <AdminPanel
                    token={null}
                    currentUserId={parseInt(user.id, 10)}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage
                  currentUserEmail={user?.email}
                  currentUserId={user ? parseInt(user.id, 10) : null}
                  role={user?.role || 'User'}
                  refreshTrigger={refreshTrigger}
                  currentUserUsername={user?.username}
                  onProfileUpdate={checkSession}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/event/:id"
            element={
              <ProtectedRoute>
                <EventDetailsPage currentUserId={user ? parseInt(user.id, 10) : null} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {user && createModalOpen && (
          <CreateEventModal
            onClose={() => setCreateModalOpen(false)}
            onEventCreated={handleEventCreated}
          />
        )}
      </div>
    </Router>
  )
}

export default App
