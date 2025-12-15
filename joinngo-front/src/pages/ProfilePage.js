import React, { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import EditEventModal from '../components/EditEventModal'

function ProfilePage({ currentUserEmail, navigate }) {
  const [createdEvents, setCreatedEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [editingEvent, setEditingEvent] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [createdRes, joinedRes] = await Promise.all([
        apiClient.get('/Event/my-created'),
        apiClient.get('/Event/my-joined'),
      ])
      setCreatedEvents(createdRes.data)
      setJoinedEvents(joinedRes.data)
    } catch (err) {
      console.error('Błąd pobierania profilu', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEditClick = (event) => {
    setEditingEvent(event)
  }

  const handleEditSuccess = () => {
    setEditingEvent(null)
    fetchData()
  }

  const renderEventList = (events, isJoinedList = false) => {
    if (events.length === 0) {
      return <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Brak wydarzeń.</p>
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="event-card"
            style={{ borderLeft: isJoinedList ? '4px solid #10b981' : '4px solid #4f46e5' }}
          >
            <div 
                className="card-header" 
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                }}
            >
              <div>
                  <h4 style={{ fontSize: '1.1rem', margin: '0 0 5px 0' }}>{event.title}</h4>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      background: '#f3f4f6',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {event.category}
                  </span>
              </div>

              {!isJoinedList && (
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  onClick={() => handleEditClick(event)}
                >
                  ✏️ Edytuj
                </button>
              )}
            </div>

            <div className="card-meta">
              <span>
                📅 {new Date(event.date).toLocaleDateString()}{' '}
                {new Date(event.date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>
                📍 {event.city}, {event.location}
              </span>
            </div>

            {isJoinedList && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                Organizator: <b>{event.creatorEmail}</b>
                <br />
                Twój status:{' '}
                <span style={{ color: event.myStatus === 'Confirmed' ? 'green' : 'orange' }}>
                  {event.myStatus === 'Confirmed' ? 'Potwierdzony' : event.myStatus}
                </span>
              </div>
            )}

            {!isJoinedList && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#6b7280' }}>
                Uczestników: {event.participantsCount}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <div>
          <h2>Mój Profil 👤</h2>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{currentUserEmail}</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            ← Powrót do wydarzeń
          </button>
        </div>
      </header>

      <div className="main-container">
        {loading ? (
          <p>Ładowanie profilu...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Utworzone */}
            <section>
              <h3
                style={{
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '10px',
                  marginBottom: '20px',
                  color: '#4f46e5',
                }}
              >
                Wydarzenia utworzone przeze mnie ({createdEvents.length})
              </h3>
              {renderEventList(createdEvents)}
            </section>

            {/* Dołączone */}
            <section>
              <h3
                style={{
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '10px',
                  marginBottom: '20px',
                  color: '#10b981',
                }}
              >
                Wydarzenia, w których biorę udział ({joinedEvents.length})
              </h3>
              {renderEventList(joinedEvents, true)}
            </section>
          </div>
        )}
      </div>

      {/* Modal Edycji */}
      {editingEvent && (
        <EditEventModal
          eventToEdit={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={handleEditSuccess}
        />
      )}
    </div>
  )
}

export default ProfilePage