import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmModal from '../components/ConfirmModal'

function LoginPage({ onLogin }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  useEffect(() => {
    setIsLoginMode(location.pathname === '/login')
  }, [location.pathname])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Walidacja dla rejestracji
    if (!isLoginMode) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Proszę podać poprawny adres email.')
        return
      }

      if (formData.password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.')
        return
      }
    }

    try {
      if (isLoginMode) {
        const data = await login(formData.email, formData.password)
        onLogin(data.token, data.role)
      } else {
        await register(formData.email, formData.password)
        showConfirm(
          'Sukces',
          'Rejestracja udana! Możesz się teraz zalogować.',
          hideConfirm,
          false,
          false,
        )
        navigate('/login')
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

        <form onSubmit={handleSubmit} noValidate>
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
          <span
            className="toggle-link"
            onClick={() => navigate(isLoginMode ? '/register' : '/login')}
          >
            {isLoginMode ? 'Zarejestruj się' : 'Zaloguj się'}
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
        showCancel={confirmModal.showCancel}
        danger={confirmModal.danger}
      />
    </div>
  )
}

export default LoginPage
