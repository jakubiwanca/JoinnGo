import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicProfile, toggleFollow, getMyFollowers } from '../api/users'
import { getEventsByUser, joinEvent, leaveEvent } from '../api/events'
import EventCard from '../components/EventCard'
import EditEventModal from '../components/EditEventModal'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmModal from '../components/ConfirmModal'

const PublicProfilePage = ({ currentUserId, role }) => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followersListLoading, setFollowersListLoading] = useState(false)

  const handleOpenFollowers = async () => {
    setShowFollowersModal(true)
    setFollowersListLoading(true)
    try {
      const list = await getMyFollowers()
      setFollowersList(list)
    } catch (err) {
      console.error(err)
      setFollowersList([])
    } finally {
      setFollowersListLoading(false)
    }
  }

  const fetchProfileAndEvents = useCallback(async () => {
    setLoading(true)
    try {
      const [profileData, eventsData] = await Promise.all([
        getPublicProfile(userId),
        getEventsByUser(userId),
      ])
      setProfile(profileData)
      setEvents(eventsData)
    } catch (err) {
      console.error('Failed to load profile', err)
      if (err.response && err.response.status === 404) {
        showConfirm(
          'Błąd',
          `Użytkownik nie istnieje. (Status: ${err.response.status})`,
          hideConfirm,
        )
      } else {
        showConfirm('Błąd', `Błąd ładowania profilu: ${err.message}`, hideConfirm)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, showConfirm, hideConfirm])

  useEffect(() => {
    fetchProfileAndEvents()
  }, [fetchProfileAndEvents])

  const handleToggleFollow = async () => {
    if (!profile) return
    setFollowLoading(true)
    try {
      const result = await toggleFollow(userId)
      setProfile((prev) => ({
        ...prev,
        isFollowed: result.isLeading,
        followersCount: result.isLeading ? prev.followersCount + 1 : prev.followersCount - 1,
      }))
    } catch (err) {
      console.error(err)
      if (err.response?.data) {
        alert(err.response.data)
      } else {
        alert('Wystąpił błąd podczas zmiany statusu obserwowania.')
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const handleJoin = async (eventId) => {
    try {
      const response = await joinEvent(eventId)
      showConfirm('Sukces', response || 'Dołączono do wydarzenia!', hideConfirm, false, false)
      fetchProfileAndEvents()
    } catch (err) {
      showConfirm('Błąd', err.response?.data || 'Błąd', hideConfirm)
    }
  }

  const handleLeave = async (eventId) => {
    showConfirm('Opuść', 'Czy na pewno chcesz opuścić to wydarzenie?', async () => {
      hideConfirm()
      try {
        await leaveEvent(eventId)
        showConfirm('Sukces', 'Opuszczono wydarzenie.', hideConfirm, false, false)
        fetchProfileAndEvents()
      } catch (err) {
        showConfirm('Błąd', err.response?.data || 'Błąd', hideConfirm)
      }
    })
  }

  const handleEditClick = (event) => {
    setEditingEvent(event)
  }

  const handleEditSuccess = () => {
    setEditingEvent(null)
    fetchProfileAndEvents()
  }

  if (loading) return <div className="main-container">Ładowanie profilu...</div>
  if (!profile) return null

  const isMe = String(currentUserId) === String(profile.id)

  return (
    <div className="main-container">
      <div
        style={{
          background: 'var(--card-bg)',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '30px',
          textAlign: 'center',
          position: 'relative',
          border: '1px solid #e5e7eb',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.2rem',
            color: '#6b7280',
            cursor: 'pointer',
          }}
          title="Wróć"
        >
          ✕
        </button>

        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#e0e7ff',
            color: 'var(--primary-color)',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px auto',
          }}
        >
          {profile.username ? profile.username[0].toUpperCase() : '?'}
        </div>

        <h1 style={{ margin: '0 0 5px 0', color: 'var(--text-dark)' }}>
          {profile.username || 'Użytkownik'}
        </h1>

        <div style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          {isMe ? (
            <button
              className="btn-secondary"
              onClick={handleOpenFollowers}
              style={{
                fontSize: '0.9rem',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
              }}
              title="Zobacz kto Cię obserwuje"
            >
              Obserwujących: <strong>{profile.followersCount}</strong>
            </button>
          ) : (
            <span>
              Obserwujących: <b>{profile.followersCount}</b>
            </span>
          )}
        </div>

        {!isMe && (
          <button
            className={profile.isFollowed ? 'btn-secondary' : 'btn-primary'}
            onClick={handleToggleFollow}
            disabled={followLoading}
            style={{ minWidth: '150px' }}
          >
            {followLoading ? '...' : profile.isFollowed ? 'Obserwujesz' : 'Obserwuj'}
          </button>
        )}
      </div>

      <h3 style={{ color: 'var(--text-dark)', marginBottom: '20px' }}>
        Wydarzenia utworzone przez {profile.username}
      </h3>

      {events.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Ten użytkownik nie utworzył jeszcze żadnych wydarzeń.</p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              role={role}
              isOwner={isMe}
              onEdit={isMe ? handleEditClick : undefined}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onCardClick={(id) => navigate(`/event/${id}`)}
            />
          ))}
        </div>
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

      {editingEvent && (
        <EditEventModal
          eventToEdit={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={handleEditSuccess}
        />
      )}

      {showFollowersModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '400px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
              }}
            >
              <h3>Moi Obserwujący ({profile.followersCount})</h3>
              <button onClick={() => setShowFollowersModal(false)} className="modal-close-btn">
                &times;
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followersListLoading ? (
                <p>Ładowanie...</p>
              ) : followersList.length === 0 ? (
                <p style={{ color: '#6b7280' }}>Nikt Cię jeszcze nie obserwuje.</p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {followersList.map((f) => (
                    <li
                      key={f.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          {f.username[0].toUpperCase()}
                        </div>
                        <strong
                          onClick={() => {
                            setShowFollowersModal(false)
                            navigate(`/profile/${f.id}`)
                          }}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {f.username}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
