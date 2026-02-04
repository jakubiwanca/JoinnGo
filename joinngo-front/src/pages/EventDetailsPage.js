import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getEvent, joinEvent, leaveEvent, deleteEvent, getEventComments } from '../api/events'
import { useConfirm } from '../hooks/useConfirm'

import ParticipantsModal from '../components/ParticipantsModal'
import Comments from '../components/Comments'
import ConfirmModal from '../components/ConfirmModal'
import { formatPolishDateTime } from '../utils/dateFormat'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { getEventColorClass } from '../utils/eventHelpers'

const EventDetailsPage = ({ currentUserId, role }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [event, setEvent] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)
  const [participantsModalMode, setParticipantsModalMode] = useState('view')

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

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

  const getUserParticipation = useCallback(
    (theEvent) => {
      if (!theEvent || !theEvent.participants) return null
      return theEvent.participants.find((p) => p.userId === currentUserId)
    },
    [currentUserId],
  )

  const fetchComments = useCallback(async () => {
    try {
      const data = await getEventComments(id)
      setComments(data)
    } catch (err) {
      console.error('Could not fetch comments:', err)
      setComments([])
    }
  }, [id])

  const fetchEvent = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedEvent = await getEvent(id)
      setEvent(fetchedEvent)
      const participation = getUserParticipation(fetchedEvent)
      if (participation && participation.status === 'Confirmed') {
        fetchComments()
      }
    } catch (err) {
      console.error(err)
      setError('Nie udało się pobrać szczegółów wydarzenia.')
    } finally {
      setLoading(false)
    }
  }, [id, fetchComments, getUserParticipation])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      await joinEvent(id)
      const successTitle = 'Sukces'
      const successMsg = event.isPrivate
        ? 'Wysłano prośbę o dołączenie do wydarzenia.'
        : 'Pomyślnie dołączono do wydarzenia!'

      showConfirm(successTitle, successMsg, hideConfirm, false, false)
      fetchEvent()
    } catch (err) {
      showConfirm(
        'Błąd',
        err.response?.data || 'Błąd podczas dołączania',
        hideConfirm,
        false,
        false,
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = () => {
    const isPending = userParticipation?.status === 'Interested'
    const isRejected = userParticipation?.status === 'Rejected'

    let title = 'Opuść wydarzenie'
    let message = 'Czy na pewno chcesz zrezygnować z udziału?'

    if (isPending) {
      title = 'Anuluj prośbę'
      message = 'Czy na pewno chcesz anulować prośbę o dołączenie do wydarzenia?'
    } else if (isRejected) {
      title = 'Usuń powiadomienie'
      message = 'Czy chcesz usunąć to wydarzenie z listy odrzuconych?'
    }

    showConfirm(title, message, async () => {
      hideConfirm()
      setActionLoading(true)
      try {
        await leaveEvent(id)
        let successMsg = 'Pomyślnie opuszczono wydarzenie.'
        if (isPending) successMsg = 'Anulowano prośbę o dołączenie.'
        if (isRejected) successMsg = 'Usunięto powiadomienie.'

        showConfirm('Sukces', successMsg, hideConfirm, false, false)
        fetchEvent()
      } catch (err) {
        showConfirm(
          'Błąd',
          err.response?.data || 'Błąd podczas opuszczania',
          hideConfirm,
          false,
          false,
        )
      } finally {
        setActionLoading(false)
      }
    })
  }

  const handleDelete = () => {
    const isRecurring = event?.isRecurring || event?.recurrenceGroupId || event?.recurrence

    const title = isRecurring ? 'Usuń wydarzenie cykliczne' : 'Usuń wydarzenie'
    const message = isRecurring
      ? 'Czy na pewno chcesz usunąć to wydarzenie cykliczne wraz ze wszystkimi jego instancjami?'
      : 'Czy na pewno chcesz trwale usunąć to wydarzenie?'

    showConfirm(
      title,
      message,
      async () => {
        hideConfirm()
        setActionLoading(true)
        try {
          await deleteEvent(id, isRecurring)
          showConfirm('Sukces', 'Wydarzenie zostało usunięte.', () => {
            hideConfirm()
            navigate('/home')
          })
        } catch (err) {
          showConfirm(
            'Błąd',
            err.response?.data || 'Błąd podczas usuwania',
            hideConfirm,
            false,
            false,
          )
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

  const participantsList = (event.participants || []).filter(
    (p) => p.status === 'Confirmed' || p.status === 1,
  )
  const isOrganizer = currentUserId === event.creatorId
  const userParticipation = getUserParticipation(event)
  const isJoined = !!userParticipation
  const isConfirmed = userParticipation?.status === 'Confirmed'
  const isRejected = userParticipation?.status === 'Rejected'
  const isPending = userParticipation?.status === 'Interested'
  const isFull = event.maxParticipants > 0 && participantsList.length >= event.maxParticipants

  let manageButton = null
  let participationButton = null

  if ((isOrganizer || role === 'Admin') && !event.isExpired) {
    manageButton = (
      <button
        className="btn-secondary"
        onClick={() => {
          setParticipantsModalMode('manage')
          setIsParticipantsModalOpen(true)
        }}
        style={{ padding: '10px 25px' }}
      >
        ⚙️ Zarządzaj uczestnikami
        {event.pendingRequestsCount > 0 && (
          <span
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 8px',
              fontSize: '0.8rem',
              marginLeft: '8px',
              fontWeight: 'bold',
            }}
          >
            {event.pendingRequestsCount}
          </span>
        )}
      </button>
    )
  }

  if (!isOrganizer) {
    if (isJoined && !event.isExpired) {
      let buttonText = 'Opuść wydarzenie'
      let buttonClass = 'btn-secondary'

      if (isPending) {
        buttonText = 'Anuluj prośbę'
      } else if (isRejected) {
        return
      }

      participationButton = (
        <button
          className={buttonClass}
          onClick={handleLeave}
          disabled={actionLoading}
          style={{ padding: '10px 25px' }}
        >
          {actionLoading ? 'Przetwarzanie...' : buttonText}
        </button>
      )
    } else if (!event.isExpired) {
      const buttonText = event.isPrivate ? 'Wyślij prośbę' : 'Dołącz do wydarzenia'

      participationButton = (
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
  }

  const cardColorClass = getEventColorClass(event, isOrganizer, isJoined, userParticipation?.status)

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
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Szczegóły Wydarzenia</h2>
        <button
          onClick={() => {
            if (location.state?.fromAdmin) {
              navigate('/admin', { state: { activeTab: 'events' } })
            } else {
              navigate(-1)
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '5px 10px',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
            e.currentTarget.style.color = '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6b7280'
          }}
          title="Wróć"
        >
          ✕
        </button>
      </div>

      <div
        className={`event-card ${cardColorClass}`}
        style={{ margin: '0 auto', cursor: 'default' }}
      >
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
            {(role === 'Admin' || (isOrganizer && !event.isExpired)) && (
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
              👤 <b>Organizator:</b>{' '}
              {event.creator?.username || event.creator?.email || event.creatorId}
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
                ? `${formatPolishDateTime(event.recurrence.endDate)}`
                : event.recurrence.maxOccurrences
                  ? `po ${event.recurrence.maxOccurrences} ${event.recurrence.type === 1 ? 'tygodniach' : 'miesiącach'}`
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
          <div
            className="participants-info"
            style={{ fontSize: '1.1rem', cursor: 'pointer' }}
            onClick={() => {
              setParticipantsModalMode('view')
              setIsParticipantsModalOpen(true)
            }}
            title="Kliknij, aby zobaczyć uczestników"
          >
            👥 <b>Uczestnicy:</b> {participantsList.length}
            {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {manageButton}
            {participationButton}
          </div>
        </div>

        {(isConfirmed || role === 'Admin') && (
          <Comments
            eventId={id}
            comments={comments}
            onCommentPosted={handleCommentPosted}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
            currentUserId={currentUserId}
            role={role}
            isExpired={event.isExpired}
            eventCreatorId={event.creatorId}
          />
        )}
      </div>
      {isParticipantsModalOpen && (
        <ParticipantsModal
          eventId={event.id}
          creatorId={event.creatorId}
          isOwner={participantsModalMode === 'manage' && (isOrganizer || role === 'Admin')}
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
