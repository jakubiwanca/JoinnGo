import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPolishDateTime } from '../utils/dateFormat'
import { getEventColorClass } from '../utils/eventHelpers'
import { toggleFollow } from '../api/users'

const EventCard = ({
  event,
  currentUserId,
  role,
  onJoin,
  onLeave,
  onDelete,
  onEdit,
  onDismiss,
  onManage,
  onCardClick,
  isJoinedList = false,
  isOwner,
}) => {
  const navigate = useNavigate()
  const isMyEvent =
    isOwner !== undefined ? isOwner : String(currentUserId) === String(event.creatorId)
  const isAdmin = role === 'Admin'
  const canDelete = isMyEvent || isAdmin

  const [isFollowed, setIsFollowed] = useState(event.isCreatorFollowed || false)

  useEffect(() => {
    setIsFollowed(event.isCreatorFollowed || false)
  }, [event.isCreatorFollowed])

  const handleStarClick = async (e) => {
    e.stopPropagation()
    const newState = !isFollowed
    setIsFollowed(newState)

    try {
      await toggleFollow(event.creatorId)
    } catch (err) {
      console.error('Failed to toggle follow', err)
      setIsFollowed(!newState)
    }
  }

  const handleOrganizerClick = (e) => {
    e.stopPropagation()
    if (event.creatorId) {
      navigate(`/profile/${event.creatorId}`)
    }
  }

  let myParticipation = null
  if (event.participants) {
    myParticipation = event.participants.find((p) => String(p.userId) === String(currentUserId))
  }

  const isJoined = !!myParticipation || (isJoinedList && event.myStatus)

  let status = myParticipation?.status
  if (isJoinedList && event.myStatus) {
    status = event.myStatus
  }

  const isConfirmed = status === 1 || status === 'Confirmed'
  const isPending = status === 0 || status === 'Interested' || status === 'Pending'
  const isRejected = status === 2 || status === 'Rejected'

  const cardColorClass = getEventColorClass(event, isMyEvent, isJoined, status)

  return (
    <>
      <div
        className={`event-card ${cardColorClass}`}
        onClick={() => onCardClick(event.id)}
        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <div className="category-badge">{event.category || 'Inne'}</div>

        <div
          className="card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <h4 title={event.title} style={{ margin: 0, paddingRight: '30px', flex: 1 }}>
            {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}{' '}
            {(event.recurrence || event.isRecurring) && (
              <span title="Wydarzenie cykliczne">🔄</span>
            )}
          </h4>
          {!isMyEvent && (
            <div
              onClick={handleStarClick}
              title={isFollowed ? 'Obserwujesz tego twórcę' : 'Obserwuj twórcę'}
              style={{
                cursor: 'pointer',
                fontSize: '1.5rem',
                lineHeight: 1,
                color: isFollowed ? '#fbbf24' : '#d1d5db',
                transition: 'color 0.2s',
                zIndex: 10,
                marginTop: '30px',
              }}
              onMouseEnter={(e) => {
                if (!isFollowed) e.currentTarget.style.color = '#fbbf24'
              }}
              onMouseLeave={(e) => {
                if (!isFollowed) e.currentTarget.style.color = '#d1d5db'
              }}
            >
              {isFollowed ? '★' : '☆'}
            </div>
          )}
        </div>

        <div className="card-meta">
          <span>
            📍 {event.city}, {event.location}
          </span>
          <span>📅 {formatPolishDateTime(event.date)}</span>
          <span style={{ fontSize: '0.8rem', marginTop: '2px' }}>
            Organizator:{' '}
            <span
              onClick={handleOrganizerClick}
              style={{ cursor: 'pointer', fontWeight: '600' }}
              title="Zobacz profil"
            >
              {event.creator?.username ||
                event.creatorUsername ||
                event.creator?.email ||
                event.creatorEmail ||
                'N/A'}
            </span>
          </span>
        </div>

        <p className="card-desc">{event.description}</p>

        <div className="card-footer">
          <div className="participants-info" title="Dostępne miejsca">
            👥{' '}
            {event.participantsCount !== undefined
              ? event.participantsCount
              : event.participants?.length || 0}
            {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
            {isMyEvent && event.pendingRequestsCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  marginLeft: '8px',
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                }}
                title={`${event.pendingRequestsCount} oczekujących próśb`}
              >
                +{event.pendingRequestsCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {canDelete && !isJoinedList && !event.isExpired && (
              <button
                className="btn-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(event.id)
                }}
              >
                Usuń
              </button>
            )}

            {isJoinedList && isRejected && null}

            {isMyEvent && onEdit && !event.isExpired && (
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(event)
                }}
              >
                ✏️ Edytuj
              </button>
            )}

            {isMyEvent && !onEdit && onManage && (
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onManage(event.id)
                }}
              >
                Zarządzaj
              </button>
            )}

            {!isMyEvent &&
              (!isJoined ? (
                <button
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                  disabled={
                    (event.maxParticipants > 0 &&
                      (event.participantsCount || event.participants?.length || 0) >=
                        event.maxParticipants) ||
                    (!event.isPrivate && event.isExpired)
                  }
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onJoin) onJoin(event.id)
                  }}
                >
                  {event.maxParticipants > 0 &&
                  (event.participantsCount || event.participants?.length || 0) >=
                    event.maxParticipants
                    ? 'Brak miejsc'
                    : event.isPrivate
                      ? 'Wyślij prośbę'
                      : 'Dołącz'}
                </button>
              ) : isRejected ? (
                !isJoinedList ? null : null
              ) : (
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onLeave) onLeave(event.id)
                  }}
                >
                  {isConfirmed ? 'Opuść' : 'Anuluj'}
                </button>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default EventCard
