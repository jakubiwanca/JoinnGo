import React, { useState, useEffect } from 'react'
import { updateUser } from '../api/users'

function EditUserModal({ user, onClose, onUserUpdated }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setEmail(user.email)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Proszę podać poprawny adres email.')
      return
    }

    setLoading(true)

    try {
      await updateUser(user.id, { email })
      onUserUpdated()
      onClose()
    } catch (err) {
      console.error('Update user error:', err)
      setError(err.response?.data || 'Nie udało się zaktualizować użytkownika')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: 0 }}>Edytuj użytkownika</h3>
          <button onClick={onClose} className="modal-close-btn">
            &times;
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
