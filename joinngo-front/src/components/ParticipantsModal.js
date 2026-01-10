import React, { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'

function ParticipantsModal({ eventId, onClose, onStatusChange }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchParticipants = async () => {
    try {
      const response = await apiClient.get(`event/${eventId}/participants`)
      setParticipants(response.data)
    } catch (err) {
      console.error('Błąd pobierania uczestników:', err)
      alert('Nie udało się pobrać listy uczestników.')
      onClose()
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
        headers: { 'Content-Type': 'application/json' }
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
      alert('Błąd podczas akceptacji.')
    }
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego uczestnika z wydarzenia?')) return

    try {
      console.log(`Attempting to remove user ${userId} from event ${eventId}. Request URL: event/${eventId}/participants/${userId}`);
      await apiClient.delete(`event/${eventId}/participants/${userId}`)
      
      setParticipants((prev) => prev.filter((p) => p.userId !== userId))
      
      alert('Uczestnik został usunięty.')
      
      if (onStatusChange) onStatusChange()
    } catch (err) {
      console.error('Błąd podczas usuwania:', err)
      alert(err.response?.data || 'Błąd podczas usuwania uczestnika.')
    }
  }

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
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {participants.length === 0 && <p>Brak zgłoszeń.</p>}

            {participants.map((p) => (
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
                  <br />
                  <small>Status: {getStatusLabel(p.status)}</small>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {p.status === 'Interested' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '5px 10px', fontSize: '0.8em', background: '#28a745', border: 'none', borderRadius: '4px', color: 'white' }}
                      onClick={() => handleAccept(p.userId)}
                    >
                      Zatwierdź
                    </button>
                  )}

                  {p.status === 'Confirmed' && <span style={{ color: 'green', fontSize: '1.2em' }}>✅</span>}

                  <button
                    className="btn-danger"
                    style={{ padding: '5px 10px', fontSize: '0.8em', borderRadius: '4px' }}
                    onClick={() => handleRemove(p.userId)}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function getStatusLabel(status) {
  switch (status) {
    case 'Interested':
      return 'Oczekuje ⏳'
    case 'Confirmed':
      return 'Potwierdzony ✅'
    case 'Rejected':
      return 'Odrzucony ❌'
    default:
      return status
  }
}

export default ParticipantsModal