import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { changePassword, updateProfile } from '../api/auth'
import { getMyCreatedEvents, getMyJoinedEvents, deleteEvent, leaveEvent } from '../api/events'
import { useConfirm } from '../hooks/useConfirm'
import EditEventModal from '../components/EditEventModal'
import ConfirmModal from '../components/ConfirmModal'
import EventCard from '../components/EventCard'

function ProfilePage({
  role,
  currentUserId,
  refreshTrigger,
  currentUserUsername,
  onProfileUpdate,
}) {
  const navigate = useNavigate()
  const [createdEvents, setCreatedEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(currentUserUsername ? 'events' : 'settings')

  const [editingEvent, setEditingEvent] = useState(null)

  const [usernameForm, setUsernameForm] = useState(currentUserUsername || '')
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })
  const [redirecting, setRedirecting] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  useEffect(() => {
    if (currentUserUsername) setUsernameForm(currentUserUsername)
  }, [currentUserUsername])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [createdRes, joinedRes] = await Promise.all([getMyCreatedEvents(), getMyJoinedEvents()])
      setCreatedEvents(createdRes || [])
      setJoinedEvents(joinedRes || [])
    } catch (err) {
      console.error('Błąd pobierania profilu', err)
      setCreatedEvents([])
      setJoinedEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const handleEditClick = (event) => {
    setEditingEvent(event)
  }

  const handleEditSuccess = () => {
    setEditingEvent(null)
    fetchData()
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMessage({ type: '', text: '' })

    try {
      await updateProfile({ username: usernameForm })

      const isFirstTime = !currentUserUsername
      const msg = isFirstTime
        ? 'Pomyślnie dodano nazwę użytkownika!'
        : 'Pomyślnie zaktualizowano nazwę użytkownika!'

      console.log('Profile update: isFirstTime=', isFirstTime)

      showConfirm(
        'Sukces',
        msg,
        async () => {
          hideConfirm()

          if (isFirstTime) {
            setRedirecting(true)
            setTimeout(() => navigate('/'), 2500)
          }

          if (onProfileUpdate) await onProfileUpdate()
        },
        false,
        false,
      )
    } catch (err) {
      console.error(err)
      setProfileMessage({ type: 'error', text: err.response?.data || 'Błąd aktualizacji profilu' })
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError('Wszystkie pola są wymagane')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Nowe hasła nie są zgodne')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Nowe hasło musi mieć co najmniej 6 znaków')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      setPasswordLoading(true)
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess('Hasło zostało pomyślnie zmienione!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      console.error('Błąd zmiany hasła', err)
      setPasswordError(err.response?.data?.message || 'Błąd zmiany hasła. Sprawdź aktualne hasło.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDismiss = (eventId) => {
    showConfirm(
      'Usuń powiadomienie',
      'Czy chcesz usunąć to wydarzenie z listy odrzuconych?',
      async () => {
        hideConfirm()
        try {
          await leaveEvent(eventId)
          fetchData()
        } catch (err) {
          console.error(err)
        }
      },
      true,
    )
  }

  const handleDelete = (eventId) => {
    showConfirm(
      'Usuń wydarzenie',
      'Czy na pewno chcesz usunąć to wydarzenie? Ta akcja jest nieodwracalna.',
      async () => {
        hideConfirm()
        try {
          await deleteEvent(eventId)
          fetchData()
        } catch (err) {
          showConfirm(
            'Błąd',
            'Nie udało się usunąć: ' + (err.response?.data || err.message),
            hideConfirm,
          )
        }
      },
      true,
    )
  }

  const handleLeave = (eventId) => {
    const event = joinedEvents.find((e) => e.id === eventId)
    const isPending = event?.myStatus === 'Interested'

    const title = isPending ? 'Anuluj prośbę' : 'Opuść wydarzenie'
    const message = isPending
      ? 'Czy na pewno chcesz anulować prośbę o dołączenie do wydarzenia?'
      : 'Czy na pewno chcesz zrezygnować z udziału w tym wydarzeniu?'

    showConfirm(title, message, async () => {
      hideConfirm()
      try {
        await leaveEvent(eventId)
        const successMsg = isPending
          ? 'Anulowano prośbę o dołączenie.'
          : 'Pomyślnie opuszczono wydarzenie.'
        showConfirm('Sukces', successMsg, hideConfirm, false, false)
        fetchData()
      } catch (err) {
        showConfirm(
          'Błąd',
          err.response?.data || 'Błąd podczas opuszczania',
          hideConfirm,
          false,
          false,
        )
      }
    })
  }

  const renderEventList = (events, isJoinedList = false) => {
    if (!events || events.length === 0) {
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
          <EventCard
            key={event.id}
            event={event}
            currentUserId={currentUserId}
            role={role}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onDismiss={handleDismiss}
            onLeave={handleLeave}
            isJoinedList={isJoinedList}
            isOwner={!isJoinedList}
            onCardClick={(id) => navigate(`/event/${id}`)}
          />
        ))}
      </div>
    )
  }

  const renderEventsTab = () => {
    const pendingEvents = joinedEvents.filter((e) => e.myStatus === 'Interested')
    const confirmedEvents = joinedEvents.filter((e) => e.myStatus === 'Confirmed')
    const rejectedEvents = joinedEvents.filter((e) => e.myStatus === 'Rejected')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Utworzone */}
        <section>
          <h3
            style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: '#4f46e5',
              marginTop: 0,
            }}
          >
            Wydarzenia utworzone przeze mnie ({createdEvents.length})
          </h3>
          {renderEventList(createdEvents)}
        </section>

        {/* Potwierdzone */}
        <section>
          <h3
            style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: '#10b981',
              marginTop: 0,
            }}
          >
            Wydarzenia, w których biorę udział ({confirmedEvents.length})
          </h3>
          {renderEventList(confirmedEvents, true)}
        </section>

        {/* Oczekujące */}
        <section>
          <h3
            style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: '#f59e0b',
              marginTop: 0,
            }}
          >
            Wydarzenia oczekujące na akceptację ({pendingEvents.length})
          </h3>
          {renderEventList(pendingEvents, true)}
        </section>

        {/* Odrzucone */}
        <section>
          <h3
            style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: '#ef4444',
              marginTop: 0,
            }}
          >
            Odrzucone zgłoszenia ({rejectedEvents.length})
          </h3>
          {renderEventList(rejectedEvents, true)}
        </section>
      </div>
    )
  }

  const renderSettingsTab = () => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Messages Area - Full Width */}
      {(profileMessage.text || passwordError || passwordSuccess) && (
        <div style={{ width: '100%' }}>
          {profileMessage.text && (
            <div className={`alert alert-${profileMessage.type}`} style={{ marginBottom: '15px' }}>
              {profileMessage.text}
            </div>
          )}
          {passwordError && (
            <div className="alert alert-error" style={{ marginBottom: '15px' }}>
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="alert alert-success" style={{ marginBottom: '15px' }}>
              {passwordSuccess}
            </div>
          )}
        </div>
      )}

      {/* Username Tile */}
      <div
        style={{
          flex: 1,
          minWidth: '300px',
          background: 'var(--card-bg)',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ marginBottom: '20px', color: '#1f2937', marginTop: 0 }}>Dane Użytkownika</h3>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label>Nazwa użytkownika</label>
            <input
              type="text"
              name="username"
              value={usernameForm}
              onChange={(e) => setUsernameForm(e.target.value)}
              required
              minLength={3}
              placeholder="Twój widoczny nick"
              style={{ width: '100%' }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            Zaktualizuj profil
          </button>
        </form>
      </div>

      {/* Password Tile */}
      <div
        style={{
          flex: 1,
          minWidth: '300px',
          background: 'var(--card-bg)',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ marginBottom: '20px', color: '#1f2937', marginTop: 0 }}>Zmiana Hasła</h3>
        <form onSubmit={handlePasswordSubmit} className="password-form-tile">
          <div className="form-group">
            <label>Aktualne hasło</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Nowe hasło</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Potwierdź nowe hasło</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={passwordLoading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {passwordLoading ? 'Zmieniam...' : 'Zmień hasło'}
          </button>
        </form>
      </div>
    </div>
  )

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
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Mój Profil 👤</h2>
        </div>
        {/* Tabs Navigation */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => currentUserUsername && setActiveTab('events')}
            disabled={!currentUserUsername}
            style={!currentUserUsername ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!currentUserUsername ? 'Uzupełnij profil, aby zobaczyć wydarzenia' : ''}
          >
            📅 Wydarzenia
          </button>
          <button
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Ustawienia
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '30px' }}>
          {loading ? (
            <p>Ładowanie profilu...</p>
          ) : (
            <>
              {activeTab === 'events' && renderEventsTab()}
              {activeTab === 'settings' && renderSettingsTab()}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <EditEventModal
          eventToEdit={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={handleEditSuccess}
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

      {redirecting &&
        ReactDOM.createPortal(
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
              <h2 style={{ color: '#10b981', marginBottom: '20px' }}>Gotowe! 🚀</h2>
              <p>Konfiguracja zakończona.</p>
              <p style={{ marginTop: '10px', color: '#6b7280' }}>
                Przekierowywanie na stronę główną...
              </p>
              <div className="spinner" style={{ margin: '20px auto' }}></div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default ProfilePage
