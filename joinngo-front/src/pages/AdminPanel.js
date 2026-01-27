import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAllUsers, deleteUser } from '../api/users'
import ConfirmModal from '../components/ConfirmModal'
import EditUserModal from '../components/EditUserModal'
import { useConfirm } from '../hooks/useConfirm'
import AdminEventsTab from '../components/AdminEventsTab'
import AdminStatsTab from '../components/AdminStatsTab'

function AdminPanel({ currentUserId, onLogout }) {
  const location = useLocation()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'stats')

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

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
          showConfirm(
            'Błąd',
            err.message || 'Nie udało się usunąć użytkownika',
            hideConfirm,
            false,
            false,
          )
        }
      },
      true,
    )
  }

  const handleEdit = (user) => {
    setEditingUser(user)
  }

  const handleUserUpdated = () => {
    setEditingUser(null)
    getAllUsers()
      .then((users) => setUsers(users.filter((u) => u.email)))
      .catch((err) => {
        console.error('getAllUsers error:', err)
        setError(err.message || 'Błąd podczas ładowania użytkowników')
      })
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

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            className={activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('stats')}
          >
            📊 Pulpit
          </button>
          <button
            className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('users')}
          >
            👥 Użytkownicy
          </button>
          <button
            className={activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('events')}
          >
            📅 Wydarzenia
          </button>
        </div>

        {activeTab === 'stats' && <AdminStatsTab />}

        {activeTab === 'events' && <AdminEventsTab />}

        {activeTab === 'users' && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#4b5563', fontSize: '1.1rem' }}>
              Zarządzanie Użytkownikami ({users.length})
            </h3>
            {users.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Brak użytkowników lub trwa ładowanie...</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {users.map((u) => {
                  let statusColor = '#10b981' // Zielony (Aktywny)
                  let statusTitle = 'Aktywny'
                  if (!u.emailConfirmed) {
                    statusColor = '#ef4444' // Czerwony (Niepotwierdzony email)
                    statusTitle = 'Niepotwierdzony email'
                  } else if (!u.username) {
                    statusColor = '#f59e0b' // Żółty (Brak nazwy użytkownika)
                    statusTitle = 'Brak nazwy użytkownika'
                  }

                  return (
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
                        <div style={{ position: 'relative' }}>
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
                          <div
                            title={statusTitle}
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: statusColor,
                              border: '2px solid white',
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                            {u.email}
                          </div>
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

                      <div style={{ display: 'flex', gap: '10px' }}>
                        {String(u.id) !== String(currentUserId) ? (
                          <>
                            <button
                              onClick={() => handleEdit(u)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              title="Edytuj użytkownika"
                            >
                              ⚙️
                            </button>
                            <button onClick={() => handleDelete(u.id)} className="btn-danger">
                              Usuń konto
                            </button>
                          </>
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
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}

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

export default AdminPanel
