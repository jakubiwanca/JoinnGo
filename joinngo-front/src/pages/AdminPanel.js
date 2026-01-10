import React, { useEffect, useState } from 'react'
import { getAllUsers, deleteUser } from '../api/users'
import { Link } from 'react-router-dom'

function AdminPanel({ currentUserId, onLogout }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((err) => {
        console.error('getAllUsers error:', err)
        setError(err.message || 'Błąd podczas ładowania użytkowników')
      })
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return

    try {
      await deleteUser(id)
      setUsers(users.filter((u) => String(u.id) !== String(id)))
    } catch (err) {
      console.error('deleteUser error:', err)
      setError(err.message || 'Nie udało się usunąć użytkownika')
    }
  }

  return (
    <div>
      <header className="app-header">
        <div>
          <h2>Panel Administratora 🛠️</h2>
        </div>
        <div className="header-actions">
          <Link
            to="/"
            className="btn-secondary"
            style={{ textDecoration: 'none', marginRight: '10px' }}
          >
            ← Wróć na stronę główną
          </Link>
          <button onClick={onLogout} className="logout-btn">
            Wyloguj
          </button>
        </div>
      </header>

      <div className="main-container">
        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <h3 style={{ marginBottom: '20px', color: '#4b5563', fontSize: '1.1rem' }}>
          Zarządzanie Użytkownikami ({users.length})
        </h3>

        {users.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Brak użytkowników lub trwa ładowanie...</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  background: 'var(--card-bg)',
                  padding: '15px 20px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #f3f4f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#e0e7ff',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                    }}
                  >
                    {u.email && u.email[0] ? u.email[0].toUpperCase() : '?'}
                  </div>

                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{u.email}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ID: {u.id} • Rola:{' '}
                      <span
                        style={{
                          fontWeight: '500',
                          color: u.role === 'Admin' ? 'var(--primary-color)' : 'inherit',
                        }}
                      >
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {String(u.id) !== String(currentUserId) ? (
                    <button onClick={() => handleDelete(u.id)} className="btn-danger">
                      Usuń konto
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        padding: '6px 12px',
                        background: '#d1fae5',
                        borderRadius: '8px',
                      }}
                    >
                      (zalogowany)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
