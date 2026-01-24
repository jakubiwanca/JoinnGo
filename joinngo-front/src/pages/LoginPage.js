import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { login } from '../api/auth'
import ConfirmModal from '../components/ConfirmModal'

function LoginPage({ onLogin }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: true,
    danger: false,
  })

  const showConfirm = (title, message, onConfirm, danger = false, showCancel = true) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, danger, showCancel })
  }

  const hideConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false, onConfirm: null })
  }

  useEffect(() => {
    setIsLoginMode(location.pathname === '/login')
  }, [location.pathname])

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
