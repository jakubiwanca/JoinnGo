import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { changePassword } from '../api/auth'
import EditEventModal from '../components/EditEventModal'
import ConfirmModal from '../components/ConfirmModal'
import EventCard from '../components/EventCard'

function ProfilePage({ role, currentUserId, refreshTrigger }) {
  const navigate = useNavigate()
  const [createdEvents, setCreatedEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('events')

  const [editingEvent, setEditingEvent] = useState(null)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

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

  const fetchData = async () => {
    try {
      setLoading(true)
      const [createdRes, joinedRes] = await Promise.all([
        apiClient.get('/Event/my-created'),
        apiClient.get('/Event/my-joined'),
      ])
      setCreatedEvents(createdRes.data || [])
      setJoinedEvents(joinedRes.data || [])
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

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // walidacja
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
          await apiClient.delete(`/Event/${eventId}/leave`)
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
          await apiClient.delete(`/Event/${eventId}`)
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
            }}
          >
            Wydarzenia utworzone przeze mnie ({createdEvents.length})
          </h3>
          {renderEventList(createdEvents)}
        </section>

        {/* Oczekujące */}
        {pendingEvents.length > 0 && (
          <section>
            <h3
              style={{
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '10px',
                marginBottom: '20px',
                color: '#f59e0b',
              }}
            >
              Oczekujące zgłoszenia ({pendingEvents.length})
            </h3>
            {renderEventList(pendingEvents, true)}
          </section>
        )}

        {/* Potwierdzone */}
        <section>
          <h3
            style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px',
              marginBottom: '20px',
              color: '#10b981',
            }}
          >
            Wydarzenia, w których biorę udział ({confirmedEvents.length})
          </h3>
          {renderEventList(confirmedEvents, true)}
        </section>

        {/* Odrzucone */}
        {rejectedEvents.length > 0 && (
          <section>
            <h3
              style={{
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '10px',
                marginBottom: '20px',
                color: '#ef4444',
              }}
            >
              Odrzucone zgłoszenia ({rejectedEvents.length})
            </h3>
            {renderEventList(rejectedEvents, true)}
          </section>
        )}
      </div>
    )
  }

  const renderSettingsTab = () => (
    <div className="password-form-container">
      <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Zmień hasło</h3>

      <form onSubmit={handlePasswordSubmit} className="password-form">
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

        <div className="form-group">
          <label>Aktualne hasło</label>
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            required
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
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={passwordLoading}
          style={{ width: 'auto', marginTop: '10px' }}
        >
          {passwordLoading ? 'Zmieniam...' : 'Zmień hasło'}
        </button>
      </form>
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
            onClick={() => setActiveTab('events')}
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
        danger={confirmModal.danger}
      />
    </div>
  )
}

export default ProfilePage
