import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import AdminPanel from './pages/AdminPanel'
import { getProfile, logout } from './api/auth'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const HomeWrapper = () => {
    const navigate = useNavigate()
    return (
      <Home
        currentUserId={user ? parseInt(user.id, 10) : null}
        currentUserEmail={user ? user.email : ''}
        token={null}
        role={user?.role || 'User'}
        onLogout={handleLogout}
        navigate={navigate}
      />
    )
  }

  const ProfileWrapper = () => {
    const navigate = useNavigate()
    return <ProfilePage currentUserEmail={user?.email} navigate={navigate} />
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
      <Routes>
        <Route path="/" element={user ? <HomeWrapper /> : <LoginPage onLogin={handleLogin} />} />

        {/* Routing dla Admina */}
        <Route
          path="/admin"
          element={
            user && user.role === 'Admin' ? (
              <AdminPanel token={null} currentUserId={parseInt(user.id)} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route path="/profile" element={user ? <ProfileWrapper /> : <Navigate to="/" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
