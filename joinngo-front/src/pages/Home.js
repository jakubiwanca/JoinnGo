import React, { useState } from 'react'
import { register, login } from '../api/auth'
import { jwtDecode } from 'jwt-decode'

function Home({ token, setToken, profile, role, setProfile, error, setError, onLogout, navigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async () => {
    setError('')
    try {
      const message = await register(email, password)
      alert(message)
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  const handleLogin = async () => {
    setError('')
    try {
      const data = await login(email, password)
      setToken(data.token)
      localStorage.setItem('jwtToken', data.token)

      try {
        const decoded = jwtDecode(data.token)
        const tokenRole = decoded?.role || decoded?.['role'] || 'User'
        if (tokenRole === 'Admin') {
          navigate('/admin')
        }
      } catch {}
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  if (!token) {
    return (
      <div className="container">
        <h2>Zaloguj się lub zarejestruj</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button onClick={handleLogin} className="btn">
          Zaloguj
        </button>
        <button onClick={handleRegister} className="btn">
          Zarejestruj
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h2>Witaj, {profile ? profile.email : '...'}</h2>
        <div className="header-buttons">
          {role === 'Admin' && (
            <button className="header-btn" onClick={() => navigate('/admin')} type="button">
              Panel Admina
            </button>
          )}
          <button className="logout-btn" onClick={onLogout} type="button">
            Wyloguj się
          </button>
        </div>
      </header>
    </div>
  )
}

export default Home
