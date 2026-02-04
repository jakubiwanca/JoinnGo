import React, { useEffect, useState } from 'react'
import PasswordInput from '../components/PasswordInput'
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
  followersCount,
}) {
  const navigate = useNavigate()
  const [createdEvents, setCreatedEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(currentUserUsername ? 'events' : 'settings')

  const [editingEvent, setEditingEvent] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({
    created: false,
    expired: false,
    confirmed: false,
    pending: false,
    rejected: false,
  })

  const [usernameForm, setUsernameForm] = useState(currentUserUsername || '')
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })
  const [usernameError, setUsernameError] = useState('')
  const usernameRef = React.useRef(null)
  const currentPasswordRef = React.useRef(null)
  const newPasswordRef = React.useRef(null)
  const confirmPasswordRef = React.useRef(null)
  const [redirecting, setRedirecting] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const renderSectionHeader = (title, count, color, section) => {
    const isCollapsed = collapsedSections[section]
    return (
      <h3
        onClick={() => toggleSection(section)}
        style={{
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '10px',
          marginBottom: '20px',
          color: color,
          marginTop: 0,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        <span
          style={{
            fontSize: '18px',
            transition: 'transform 0.3s ease',
            display: 'inline-block',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
        {title} ({count})
      </h3>
    )
  }

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
    setUsernameError('')

    if (!usernameForm || usernameForm.trim().length === 0) {
      setUsernameError('Nazwa użytkownika jest wymagana.')
      if (usernameRef.current)
        usernameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (usernameForm.trim().length < 3) {
      setUsernameError('Nazwa użytkownika musi mieć co najmniej 3 znaki.')
      if (usernameRef.current)
        usernameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      await updateProfile({ username: usernameForm })

      const isFirstTime = !currentUserUsername
      const msg = isFirstTime
        ? 'Pomyślnie dodano nazwę użytkownika!'
        : 'Pomyślnie zaktualizowano nazwę użytkownika!'

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
      const errorMsg = err.response?.data || 'Błąd aktualizacji profilu'

      if (
        typeof errorMsg === 'string' &&
        (errorMsg.toLowerCase().includes('nazw') ||
          errorMsg.toLowerCase().includes('name') ||
          errorMsg.toLowerCase().includes('username'))
      ) {
        setUsernameError(errorMsg)
        setProfileMessage({ type: '', text: '' })
        if (usernameRef.current) {
          usernameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setProfileMessage({ type: 'error', text: errorMsg })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordFieldErrors({})

    let hasErrors = false
    const newErrors = {}
    let firstErrorRef = null

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'To pole jest wymagane'
      hasErrors = true
      if (!firstErrorRef) firstErrorRef = currentPasswordRef
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'To pole jest wymagane'
      hasErrors = true
      if (!firstErrorRef) firstErrorRef = newPasswordRef
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'To pole jest wymagane'
      hasErrors = true
      if (!firstErrorRef) firstErrorRef = confirmPasswordRef
    }

    if (!hasErrors && passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Nowe hasła nie są zgodne'
      hasErrors = true
      if (!firstErrorRef) firstErrorRef = confirmPasswordRef
    }

    if (!hasErrors && passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Nowe hasło musi mieć co najmniej 6 znaków'
      hasErrors = true
      if (!firstErrorRef) firstErrorRef = newPasswordRef
    }

    if (hasErrors) {
      setPasswordFieldErrors(newErrors)
      if (firstErrorRef && firstErrorRef.current) {
        firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    try {
      setPasswordLoading(true)
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)

      showConfirm(
        'Sukces',
        'Hasło zostało pomyślnie zmienione.',
        () => {
          hideConfirm()
          setPasswordSuccess('')
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
        false,
        false,
      )
    } catch (err) {
      console.error(err)
      let errorMsg = err.response?.data || 'Błąd zmiany hasła'

      if (typeof errorMsg === 'object' && errorMsg !== null) {
        errorMsg = errorMsg.message || JSON.stringify(errorMsg)
      }

      const lowerMsg = String(errorMsg).toLowerCase()

      if (
        lowerMsg.includes('aktualne') ||
        lowerMsg.includes('obecne') ||
        lowerMsg.includes('current')
      ) {
        setPasswordFieldErrors({ currentPassword: errorMsg })
        if (currentPasswordRef.current)
          currentPasswordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      if (lowerMsg.includes('nowe') || lowerMsg.includes('new password')) {
        setPasswordFieldErrors({ newPassword: errorMsg })
        if (newPasswordRef.current)
          newPasswordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      setPasswordError(String(errorMsg))
      if (currentPasswordRef.current)
        currentPasswordRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    const event = createdEvents.find((e) => e.id === eventId)
    const isRecurring = event?.isRecurring || event?.recurrenceGroupId

    const title = isRecurring ? 'Usuń wydarzenie cykliczne' : 'Usuń wydarzenie'
    const message = isRecurring
      ? 'Czy na pewno chcesz usunąć to wydarzenie cykliczne wraz ze wszystkimi jego instancjami? Ta akcja jest nieodwracalna.'
      : 'Czy na pewno chcesz usunąć to wydarzenie? Ta akcja jest nieodwracalna.'

    showConfirm(
      title,
      message,
      async () => {
        hideConfirm()
        try {
          await deleteEvent(eventId, isRecurring)
          showConfirm('Sukces', 'Wydarzenie zostało usunięte.', hideConfirm, false, false)
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
    const confirmedEvents = joinedEvents.filter((e) => e.myStatus === 'Confirmed' && !e.isExpired)
    const expiredJoinedEvents = joinedEvents.filter(
      (e) => e.myStatus === 'Confirmed' && e.isExpired,
    )
    const expiredCreatedEvents = createdEvents.filter((e) => e.isExpired)
    const allExpiredEvents = [...expiredCreatedEvents, ...expiredJoinedEvents]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Utworzone (nie wygasłe) */}
        <section>
          {renderSectionHeader(
            'Wydarzenia utworzone przeze mnie',
            createdEvents.filter((e) => !e.isExpired).length,
            '#4f46e5',
            'created',
          )}
          {!collapsedSections.created && renderEventList(createdEvents.filter((e) => !e.isExpired))}
        </section>

        {/* Potwierdzone (nie wygasłe) */}
        <section>
          {renderSectionHeader(
            'Wydarzenia, w których biorę udział',
            confirmedEvents.length,
            '#10b981',
            'confirmed',
          )}
          {!collapsedSections.confirmed && renderEventList(confirmedEvents, true)}
        </section>

        {/* Wygasłe (created + joined) */}
        <section>
          {renderSectionHeader('Wygasłe wydarzenia', allExpiredEvents.length, '#6b7280', 'expired')}
          {!collapsedSections.expired && renderEventList(allExpiredEvents, true)}
        </section>

        {/* Oczekujące */}
        <section>
          {renderSectionHeader(
            'Wydarzenia oczekujące na akceptację',
            pendingEvents.length,
            '#f59e0b',
            'pending',
          )}
          {!collapsedSections.pending && renderEventList(pendingEvents, true)}
        </section>
      </div>
    )
  }

  const renderSettingsTab = () => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
        <h3 style={{ marginBottom: '20px', color: '#1f2937', marginTop: 0 }}>Nazwa użytkownika</h3>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group" ref={usernameRef}>
            <input
              type="text"
              name="username"
              value={usernameForm}
              onChange={(e) => setUsernameForm(e.target.value)}
              placeholder="Twoja nazwa użytkownika"
              style={{ width: '100%' }}
            />
            {usernameError && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '5px' }}>{usernameError}</p>
            )}
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
          <div className="form-group" ref={currentPasswordRef}>
            <PasswordInput
              name="currentPassword"
              placeholder="Aktualne hasło"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              style={{ width: '100%' }}
            />
            {passwordFieldErrors.currentPassword && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '5px' }}>
                {passwordFieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="form-group" ref={newPasswordRef}>
            <PasswordInput
              name="newPassword"
              placeholder="Nowe hasło"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              style={{ width: '100%' }}
            />
            {passwordFieldErrors.newPassword && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '5px' }}>
                {passwordFieldErrors.newPassword}
              </p>
            )}
          </div>

          <div className="form-group" ref={confirmPasswordRef}>
            <PasswordInput
              name="confirmPassword"
              placeholder="Potwierdź nowe hasło"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              style={{ width: '100%' }}
            />
            {passwordFieldErrors.confirmPassword && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '5px' }}>
                {passwordFieldErrors.confirmPassword}
              </p>
            )}
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
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>👤 Mój Profil</h2>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/profile/${currentUserId}`)}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Zobacz jak inni widzą Twój profil"
          >
            <span style={{ fontSize: '1.1rem' }}>👁️</span>
            <span>Twój profil publiczny</span>
          </button>
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
            <div
              className="modal-content"
              style={{ textAlign: 'center', padding: '25px', maxWidth: '350px' }}
            >
              <h2
                style={{ color: '#10b981', marginBottom: '10px', fontSize: '1.5rem', marginTop: 0 }}
              >
                Gotowe! 🚀
              </h2>
              <p style={{ margin: '5px 0' }}>Konfiguracja zakończona.</p>
              <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.9rem' }}>
                Przekierowywanie na stronę główną...
              </p>
              <div className="spinner" style={{ margin: '15px auto 0' }}></div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default ProfilePage
