import React from 'react'
import { formatPolishDateTime } from '../utils/dateFormat'

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
  const isMyEvent =
    isOwner !== undefined ? isOwner : String(currentUserId) === String(event.creatorId)
  const isAdmin = role === 'Admin'
  const canDelete = isMyEvent || isAdmin

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

  let cardColorClass = 'event-public'
  if (isMyEvent) {
    cardColorClass = 'event-created'
  } else if (isJoined) {
    if (isPending) {
      cardColorClass = 'event-pending'
    } else if (isRejected) {
      cardColorClass = 'event-rejected'
    } else {
      cardColorClass = 'event-joined'
    }
  } else if (event.isPrivate) {
    cardColorClass = 'event-private'
  }

  return (
    <div
      className={`event-card ${cardColorClass}`}
      onClick={() => onCardClick(event.id)}
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div className="category-badge">{event.category || 'Inne'}</div>

      <div className="card-header">
        <h4 title={event.title}>
          {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}{' '}
          {(event.recurrence || event.isRecurring) && <span title="Wydarzenie cykliczne">🔄</span>}
        </h4>
      </div>

      <div className="card-meta">
        <span>
          📍 {event.city}, {event.location}
        </span>
        <span>📅 {formatPolishDateTime(event.date)}</span>
      </div>

      <p className="card-desc">{event.description}</p>

      {isJoinedList && (
        <div style={{ marginTop: '5px', marginBottom: '10px', fontSize: '0.9rem' }}>
          Organizator: <b>{event.creatorEmail}</b>
          <br />
          Twój status:{' '}
          <span
            style={{
              color:
                status === 'Confirmed' || status === 1
                  ? 'green'
                  : status === 'Rejected' || status === 2
                    ? 'red'
                    : 'orange',
            }}
          >
            {status === 'Confirmed' || status === 1
              ? 'Potwierdzony'
              : status === 'Rejected' || status === 2
                ? 'Odrzucony'
                : 'Oczekuje na akceptację'}
          </span>
        </div>
      )}

      <div className="card-footer">
        <div className="participants-info">
          👥{' '}
          {event.participantsCount !== undefined
            ? event.participantsCount
            : event.participants?.length || 0}
          {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canDelete && !isJoinedList && (
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

          {isJoinedList && isRejected && (
            <button
              className="btn-danger"
              onClick={(e) => {
                e.stopPropagation()
                if (onDismiss) onDismiss(event.id)
              }}
              title="Usuń z listy"
            >
              🗑️ Usuń
            </button>
          )}

          {isMyEvent && onEdit && (
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
                onClick={(e) => {
                  e.stopPropagation()
                  if (onJoin) onJoin(event.id)
                }}
              >
                {event.isPrivate ? 'Poproś' : 'Dołącz'}
              </button>
            ) : (
              !isRejected && (
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
              )
            ))}
        </div>
      </div>
    </div>
  )
}

export default EventCard
