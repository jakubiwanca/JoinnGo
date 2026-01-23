import React, { useEffect, useState } from 'react'
import { getAllUsers, deleteUser } from '../api/users'
import ConfirmModal from '../components/ConfirmModal'

function AdminPanel({ currentUserId, onLogout }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false,
  })

  const showConfirm = (title, message, onConfirm, danger = false) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, danger })
  }

  const hideConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false, onConfirm: null })
  }

  useEffect(() => {
    getAllUsers()
      .then((users) => setUsers(users.filter((u) => u.email)))
      .catch((err) => {
        console.error('getAllUsers error:', err)
        setError(err.message || 'Błąd podczas ładowania użytkowników')
      })
  }, [])

  const handleDelete = (id) => {
    showConfirm(
      'Usuń użytkownika',
      'Czy na pewno chcesz usunąć tego użytkownika?',
      async () => {
        hideConfirm()
        try {
          await deleteUser(id)
          setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)))
        } catch (err) {
          console.error('deleteUser error:', err)
          showConfirm('Błąd', err.message || 'Nie udało się usunąć użytkownika', hideConfirm)
        }
      },
      true,
    )
  }

  return (
    <div>
      <div className="main-container">
        <div
          style={{
            background: 'var(--card-bg)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '30px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Panel Administratora 🛠️</h2>
        </div>
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
        danger={confirmModal.danger}
      />
    </div>
  )
}

export default AdminPanel
