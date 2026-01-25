import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import ConfirmModal from '../components/ConfirmModal'
import { useConfirm } from '../hooks/useConfirm'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('Wszystkie pola są wymagane.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są identyczne.')
      return
    }

    if (newPassword.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.')
      return
    }

    if (!token) {
      setError('Brak tokenu resetującego. Kliknij w link z emaila ponownie.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      showConfirm(
        'Sukces',
        'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować nowym hasłem.',
        () => {
          hideConfirm()
          navigate('/login')
        },
        false,
        false,
      )
    } catch (err) {
      console.error(err)
      setError(err.response?.data || 'Wystąpił błąd podczas zmiany hasła.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h2>Resetowanie hasła</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Wprowadź nowe hasło dla swojego konta.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {token ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nowe hasło</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nowe hasło"
                required
              />
            </div>
            <div className="form-group">
              <label>Potwierdź hasło</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Powtórz hasło"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Zmieniam hasło...' : 'Zmień hasło'}
            </button>
          </form>
        ) : (
          <div className="alert alert-error">
            Nieprawidłowy link resetujący. Sprawdź czy skopiowałeś cały adres URL.
          </div>
        )}
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

export default ResetPasswordPage
