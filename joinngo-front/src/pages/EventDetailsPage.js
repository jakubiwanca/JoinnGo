import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import ParticipantsModal from '../components/ParticipantsModal'
import Comments from '../components/Comments'
import ConfirmModal from '../components/ConfirmModal'
import { formatPolishDateTime } from '../utils/dateFormat'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

const EventDetailsPage = ({ currentUserId }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: true,
    danger: false,
  })

  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy functionality', err)
    }
  }

  const showConfirm = (title, message, onConfirm, danger = false, showCancel = true) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, danger, showCancel })
  }

  const hideConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false, onConfirm: null })
  }

  const isUserParticipant = useCallback(
    (theEvent) => {
      if (!theEvent || !theEvent.participants) return false
      return theEvent.participants.some((p) => p.userId === currentUserId)
    },
    [currentUserId],
  )

  const fetchComments = useCallback(async () => {
    try {
      const response = await apiClient.get(`event/${id}/comments`)
      setComments(response.data)
    } catch (err) {
      console.error('Could not fetch comments:', err)
      setComments([])
    }
  }, [id])

  const fetchEvent = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`event/${id}`)
      const fetchedEvent = response.data
      setEvent(fetchedEvent)
      if (isUserParticipant(fetchedEvent)) {
        fetchComments()
      }
    } catch (err) {
      console.error(err)
      setError('Nie udało się pobrać szczegółów wydarzenia.')
    } finally {
      setLoading(false)
    }
  }, [id, fetchComments, isUserParticipant])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const response = await apiClient.post(`event/${id}/join`)
      showConfirm('Sukces', 'Pomyślnie dołączono do wydarzenia!', hideConfirm, false, false)
      fetchEvent()
    } catch (err) {
      showConfirm('Błąd', err.response?.data || 'Błąd podczas dołączania', hideConfirm)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = () => {
    showConfirm('Opuść wydarzenie', 'Czy na pewno chcesz zrezygnować z udziału?', async () => {
      hideConfirm()
      setActionLoading(true)
      try {
        const response = await apiClient.delete(`event/${id}/leave`)
        showConfirm('Sukces', 'Pomyślnie opuszczono wydarzenie.', hideConfirm)
        fetchEvent()
      } catch (err) {
        showConfirm('Błąd', err.response?.data || 'Błąd podczas opuszczania', hideConfirm)
      } finally {
        setActionLoading(false)
      }
    })
  }

  const handleDelete = () => {
    showConfirm(
      'Usuń wydarzenie',
      'Czy na pewno chcesz trwale usunąć to wydarzenie?',
      async () => {
        hideConfirm()
        setActionLoading(true)
        try {
          await apiClient.delete(`event/${id}`)
          showConfirm('Sukces', 'Wydarzenie zostało usunięte.', () => {
            hideConfirm()
            navigate('/')
          })
        } catch (err) {
          showConfirm('Błąd', err.response?.data || 'Błąd podczas usuwania', hideConfirm)
        } finally {
          setActionLoading(false)
        }
      },
      true,
    )
  }

  const handleCommentPosted = (newComment) => {
    setComments((prevComments) => [...prevComments, newComment])
  }

  const handleCommentUpdated = (updatedComment) => {
    setComments((prevComments) =>
      prevComments.map((c) => (c.id === updatedComment.id ? { ...c, ...updatedComment } : c)),
    )
  }

  const handleCommentDeleted = (commentId) => {
    setComments((prevComments) => prevComments.filter((c) => c.id !== commentId))
  }

  if (loading)
    return (
      <div className="main-container">
        <p style={{ textAlign: 'center' }}>Ładowanie...</p>
      </div>
    )
  if (error)
    return (
      <div className="main-container">
        <p className="text-danger">{error}</p>
      </div>
    )
  if (!event) return null

  const participantsList = event.participants || []
  const isOrganizer = currentUserId === event.creatorId
  const isJoined = isUserParticipant(event)
  const isFull = event.maxParticipants > 0 && participantsList.length >= event.maxParticipants

  let actionButton

  if (isOrganizer) {
    actionButton = (
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn-secondary"
          onClick={() => setIsParticipantsModalOpen(true)}
          style={{ padding: '10px 25px' }}
        >
          ⚙️ Zarządzaj uczestnikami
        </button>
      </div>
    )
  } else if (isJoined) {
    actionButton = (
      <button
        className="btn-secondary"
        onClick={handleLeave}
        disabled={actionLoading}
        style={{ padding: '10px 25px' }}
      >
        {actionLoading ? 'Przetwarzanie...' : 'Opuść wydarzenie'}
      </button>
    )
  } else {
    const buttonText = event.isPrivate ? 'Poproś o dołączenie' : 'Dołącz do wydarzenia'

    actionButton = (
      <button
        className="btn-primary"
        disabled={isFull || actionLoading}
        onClick={handleJoin}
        style={{ padding: '10px 25px' }}
      >
        {actionLoading ? 'Przetwarzanie...' : isFull ? 'Brak miejsc' : buttonText}
      </button>
    )
  }

  return (
    <div className="main-container">
      <div
        style={{
          background: 'var(--card-bg)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Szczegóły Wydarzenia</h2>
      </div>

      <div className="event-card" style={{ margin: '0 auto', cursor: 'default' }}>
        <div className="category-badge">{event.category || 'Inne'}</div>

        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
            {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}{' '}
            {event.recurrence && <span title="Wydarzenie cykliczne">🔄</span>}
          </h1>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginTop: '25px',
            }}
          >
            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.9rem',
              }}
              title="Kopiuj link do wydarzenia"
            >
              🔗 {copied ? 'Skopiowano link' : 'Udostępnij'}
            </button>
            {isOrganizer && (
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={actionLoading}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                🗑️ {actionLoading ? 'Usuwanie...' : 'Usuń'}
              </button>
            )}
          </div>
        </div>

        <div
          className="card-meta"
          style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}
        >
          <span>
            📍 <b>Lokalizacja:</b> {event.city}, {event.location}
          </span>
          <span>
            📅 <b>Data:</b> {formatPolishDateTime(event.date)}
          </span>
          {event.creator && (
            <span>
              👤 <b>Organizator:</b> {event.creator?.email || event.creatorId}
            </span>
          )}
        </div>

        {event.recurrence && (
          <div
            className="recurrence-info"
            style={{
              marginBottom: '1rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
              color: '#4b5563',
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>🔄 Szczegóły:</div>
            <div>
              • Powtarzanie:{' '}
              {event.recurrence.type === 1
                ? event.recurrence.interval === 1
                  ? 'Co tydzień'
                  : `Co ${event.recurrence.interval} tygodnie`
                : event.recurrence.interval === 1
                  ? 'Co miesiąc'
                  : `Co ${event.recurrence.interval} miesiące`}
            </div>
            {event.recurrence.type === 1 && event.recurrence.daysOfWeek && (
              <div>
                • Dni:{' '}
                {event.recurrence.daysOfWeek
                  .map((d) => ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'][d])
                  .join(', ')}
              </div>
            )}
            <div>
              • Koniec:{' '}
              {event.recurrence.endDate
                ? `do ${formatPolishDateTime(event.recurrence.endDate)}`
                : event.recurrence.maxOccurrences
                  ? `po ${event.recurrence.maxOccurrences} wystąpieniach`
                  : 'Brak daty końcowej'}
            </div>
          </div>
        )}

        <div className="card-body">
          <h4 style={{ color: 'var(--text-dark)', marginBottom: '10px' }}>Opis:</h4>
          <p
            className="card-desc"
            style={{ fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
          >
            {event.description}
          </p>
        </div>

        {event.latitude && event.longitude && (
          <div
            style={{
              height: '300px',
              width: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              margin: '20px 0',
              border: '1px solid #ddd',
            }}
          >
            <MapContainer
              center={[event.latitude, event.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[event.latitude, event.longitude]}>
                <Popup>{event.title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        <div
          className="card-footer"
          style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}
        >
          <div className="participants-info" style={{ fontSize: '1.1rem' }}>
            👥 <b>Uczestnicy:</b> {participantsList.length}
            {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>{actionButton}</div>
        </div>

        {isJoined && (
          <Comments
            eventId={id}
            comments={comments}
            onCommentPosted={handleCommentPosted}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
            currentUserId={currentUserId}
          />
        )}
      </div>
      {isParticipantsModalOpen && (
        <ParticipantsModal
          eventId={event.id}
          onClose={() => setIsParticipantsModalOpen(false)}
          onStatusChange={fetchEvent}
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

export default EventDetailsPage
