import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import CreateEventModal from './components/CreateEventModal'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import AdminPanel from './pages/AdminPanel'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '')

  let role = 'User'
  let currentUserId = null
  if (token) {
    try {
      const decoded = jwtDecode(token)

      role =
        decoded.role ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        'User'

      const userIdClaim =
        decoded.nameid ||
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']

      if (userIdClaim) {
        currentUserId = userIdClaim
      }
    } catch (e) {
      localStorage.removeItem('jwtToken')
      setToken('')
    }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('jwtToken')
  }

  const HomeWrapper = () => {
    const navigate = useNavigate()
    return <Home token={token} role={role} onLogout={handleLogout} navigate={navigate} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <HomeWrapper /> : <LoginPage setToken={setToken} />} />

        <Route
          path="/admin"
          element={
            role === 'Admin' && token ? (
              <AdminPanel token={token} currentUserId={currentUserId} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
