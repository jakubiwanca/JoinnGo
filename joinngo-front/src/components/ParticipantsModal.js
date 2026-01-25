import React, { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import ConfirmModal from './ConfirmModal'

function ParticipantsModal({ eventId, creatorId, onClose, onStatusChange }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

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

  const fetchParticipants = async () => {
    try {
      const response = await apiClient.get(`event/${eventId}/participants`)
      setParticipants(response.data)
    } catch (err) {
      console.error('Błąd pobierania uczestników:', err)
      showConfirm('Błąd', 'Nie udało się pobrać listy uczestników.', () => {
        hideConfirm()
        onClose()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [eventId])

  const handleAccept = async (userId) => {
    try {
      await apiClient.put(`event/${eventId}/participants/${userId}/status`, 'Confirmed', {
        headers: { 'Content-Type': 'application/json' },
      })

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.userId === userId) return { ...p, status: 'Confirmed' }
          return p
        }),
      )

      if (onStatusChange) onStatusChange()
    } catch (err) {
      console.error(err)
      showConfirm('Błąd', 'Błąd podczas akceptacji.', hideConfirm)
    }
  }

  const handleReject = async (userId) => {
    try {
      await apiClient.put(`event/${eventId}/participants/${userId}/status`, 'Rejected', {
        headers: { 'Content-Type': 'application/json' },
      })

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.userId === userId) return { ...p, status: 'Rejected' }
          return p
        }),
      )

      if (onStatusChange) onStatusChange()
    } catch (err) {
      console.error(err)
      showConfirm('Błąd', 'Błąd podczas odrzucania.', hideConfirm)
    }
  }

  const handleRemove = (userId, email) => {
    showConfirm(
      'Usuń uczestnika',
      `Czy na pewno chcesz usunąć uczestnika ${email} z tego wydarzenia?`,
      async () => {
        hideConfirm()
        try {
          await apiClient.delete(`event/${eventId}/participants/${userId}`)
          setParticipants((prev) => prev.filter((p) => p.userId !== userId))
          if (onStatusChange) onStatusChange()
        } catch (err) {
          console.error('Błąd podczas usuwania:', err)
          showConfirm(
            'Błąd',
            err.response?.data || 'Błąd podczas usuwania uczestnika.',
            hideConfirm,
          )
        }
      },
      true,
    )
  }

  const pendingParticipants = participants.filter((p) => p.status === 'Interested')
  const confirmedParticipants = participants.filter((p) => p.status === 'Confirmed')

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3>Uczestnicy wydarzenia</h3>
          <button onClick={onClose} className="modal-close-btn">
            &times;
          </button>
        </div>

        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* PENDING / OCZEKUJĄCE */}
            {pendingParticipants.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '1rem' }}>
                  Oczekujące zgłoszenia ({pendingParticipants.length})
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pendingParticipants.map((p) => (
                    <li
                      key={p.userId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div>
                        <strong>{p.email}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.8em',
                            background: '#10b981', // green
                            border: 'none',
                          }}
                          onClick={() => handleAccept(p.userId)}
                        >
                          Akceptuj
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '5px 10px', fontSize: '0.8em' }}
                          onClick={() => handleReject(p.userId)}
                        >
                          Odrzuć
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CONFIRMED / UCZESTNICY */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#4f46e5', fontSize: '1rem' }}>
                Uczestnicy ({confirmedParticipants.length})
              </h4>
              {confirmedParticipants.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#6b7280' }}>Brak uczestników.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {confirmedParticipants.map((p) => (
                    <li
                      key={p.userId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div>
                        <strong>{p.email}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span
                          style={{
                            color: '#059669', // darker green
                            fontSize: '0.9em',
                            marginRight: '10px',
                            fontWeight: '600',
                            backgroundColor: '#d1fae5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          Potwierdzony
                        </span>
                        {p.userId !== creatorId && (
                          <button
                            className="btn-danger"
                            style={{ padding: '5px 10px', fontSize: '0.8em' }}
                            onClick={() => handleRemove(p.userId, p.email)}
                          >
                            Usuń
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

function getStatusLabel(status) {
  switch (status) {
    case 'Interested':
      return 'Oczekuje na akceptację ⏳'
    case 'Confirmed':
      return 'Potwierdzony ✅'
    case 'Rejected':
      return 'Odrzucony ❌'
    default:
      return status
  }
}

export default ParticipantsModal
