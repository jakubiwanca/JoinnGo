import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { login } from '../api/auth'

function LoginPage({ onLogin }) {
  const location = useLocation()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('register') === 'true') {
      setIsLoginMode(false)
    }
  }, [location])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isLoginMode) {
        const data = await login(formData.email, formData.password)
        onLogin(data.token, data.role)
      } else {
        await apiClient.post('/User/register', {
          email: formData.email,
          password: formData.password,
        })
        alert('Rejestracja udana! Możesz się teraz zalogować.')
        setIsLoginMode(true)
      }
    } catch (err) {
      console.error(err)
      setError('Wystąpił błąd. Sprawdź dane lub spróbuj ponownie.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isLoginMode ? 'Witaj ponownie 👋' : "Dołącz do Join'nGo 🚀"}</h2>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              name="email"
              type="email"
              placeholder="Adres email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              name="password"
              type="password"
              placeholder="Hasło"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn-primary" type="submit" style={{ width: '100%' }}>
            {isLoginMode ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="toggle-text">
          {isLoginMode ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
          <span className="toggle-link" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? 'Zarejestruj się' : 'Zaloguj się'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
