import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmModal from '../components/ConfirmModal'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

function LoginPage({ onLogin }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

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
    setIsLoading(true)

    // Walidacja dla logowania i rejestracji
    if (!formData.email || !formData.password) {
      setError('Wszystkie pola są wymagane.')
      setIsLoading(false)
      return
    }

    // Walidacja dla rejestracji
    if (!isLoginMode) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Proszę podać poprawny adres email.')
        setIsLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.')
        setIsLoading(false)
        return
      }
    }

    try {
      if (isLoginMode) {
        const data = await login(formData.email, formData.password)
        onLogin(data.token, data.role)
      } else {
        const response = await register(formData.email, formData.password)
        setIsLoading(false)
        showConfirm(
          'Sprawdź swoją skrzynkę email',
          `Wysłaliśmy link potwierdzający na adres ${formData.email}.\n\nKliknij w link, aby aktywować konto i móc się zalogować.`,
          hideConfirm,
          false,
          false,
        )
      }
    } catch (err) {
      console.error(err)
      setIsLoading(false)

      let errorMessage = 'Wystąpił błąd. Sprawdź dane lub spróbuj ponownie.'

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (typeof err.response.data === 'object') {
          errorMessage = JSON.stringify(err.response.data)
        }
      }

      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('not confirmed')) {
        setError(
          'Musisz potwierdzić swój adres email przed zalogowaniem. Sprawdź swoją skrzynkę odbiorczą.',
        )
      } else if (errorMessage.includes('Email already exists')) {
        setError('Ten adres email jest już zarejestrowany. Spróbuj się zalogować.')
      } else {
        if (errorMessage.startsWith('{')) {
          setError('Nieprawidłowe dane logowania.')
        } else {
          setError(errorMessage)
        }
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isLoginMode ? 'Zaloguj się' : "Dołącz do Join'nGo"}</h2>

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
            {isLoginMode && (
              <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <span
                  style={{ color: '#4f46e5', fontSize: '0.85rem', cursor: 'pointer' }}
                  onClick={() => setShowForgotPassword(true)}
                >
                  Nie pamiętasz hasła?
                </span>
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            type="submit"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? 'Proszę czekać...' : isLoginMode ? 'Zaloguj się' : 'Zarejestruj się'}
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

      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </div>
  )
}

export default LoginPage
