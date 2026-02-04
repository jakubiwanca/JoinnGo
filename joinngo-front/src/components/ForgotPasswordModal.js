import React, { useState } from 'react'
import { forgotPassword } from '../api/auth'

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Pole nie może być puste.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Podaj niepoprawny adres email.')
      return
    }

    setLoading(true)

    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.response?.data || 'Wystąpił błąd podczas wysyłania prośby.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: '400px', padding: '25px', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
          <button
            onClick={onClose}
            className="modal-close-btn"
            style={{
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            &times;
          </button>
        </div>

        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Zresetuj hasło</h3>

        {!success ? (
          <>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
              Podaj adres email powiązany z Twoim kontem. Wyślemy na niego link do ustawienia nowego
              hasła.
            </p>

            {error && (
              <div
                className="alert alert-error"
                style={{ marginBottom: '15px', fontSize: '0.9rem' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <input
                  type="email"
                  placeholder="Adres email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📧</div>
            <h4 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Wysłano!</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
              Jeśli konto o podanym adresie istnieje, wkrótce otrzymasz email z instrukcją.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Zamknij
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
