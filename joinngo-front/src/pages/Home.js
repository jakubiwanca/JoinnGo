import React, { useEffect, useState, useCallback } from 'react'
import apiClient from '../api/axiosClient'
import CreateEventModal from '../components/CreateEventModal'
import ParticipantsModal from '../components/ParticipantsModal'
import ConfirmModal from '../components/ConfirmModal'
import { POLISH_CITIES } from '../constants/cities'
import { EVENT_CATEGORIES } from '../constants/categories'
import { Link } from 'react-router-dom';
import { formatPolishDateTime } from '../utils/dateFormat';

function Home({ onLogout, navigate, role, currentUserId, currentUserEmail }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [managingEventId, setManagingEventId] = useState(null)

  // Confirm modal state
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

  const [filters, setFilters] = useState({
    search: '',
    location: '',
    date: '',
    category: '',
  })

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      
      let clientSideDateFilter = null
      if (filters.date) {
        const dateParts = filters.date.split('/').filter(part => part !== '')
        if (dateParts.length === 3 && dateParts[2].length === 4) {
          const day = dateParts[0].padStart(2, '0')
          const month = dateParts[1].padStart(2, '0')
          const year = dateParts[2]
          const isoDate = `${year}-${month}-${day}`
          params.append('date', isoDate)
        } else if (dateParts.length > 0) {
          clientSideDateFilter = dateParts
        }
      }
      
      if (filters.category !== '') params.append('category', filters.category)

      params.append('page', page)
      params.append('pageSize', 9)

      const response = await apiClient.get(`/Event?${params.toString()}`)

      let events = []
      if (response.data && response.data.data) {
        events = response.data.data
        setTotalPages(response.data.totalPages)
      } else {
        events = Array.isArray(response.data) ? response.data : []
      }

      if (clientSideDateFilter) {
        events = events.filter(event => {
          const eventDate = new Date(event.date)
          const eventDay = String(eventDate.getDate()).padStart(2, '0')
          const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0')
          
          if (clientSideDateFilter.length === 1) {
            return eventDay === clientSideDateFilter[0].padStart(2, '0')
          }
          if (clientSideDateFilter.length === 2) {
            return eventDay === clientSideDateFilter[0].padStart(2, '0') &&
                   eventMonth === clientSideDateFilter[1].padStart(2, '0')
          }
          return false
        })
      }

      setEvents(events)
    } catch (err) {
      console.error(err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', location: '', date: '', category: '' })
    setPage(1)
  }

  const handleJoin = async (eventId) => {
    try {
      const response = await apiClient.post(`/Event/${eventId}/join`)
      showConfirm('Sukces', response.data, hideConfirm)
      fetchEvents()
    } catch (err) {
      showConfirm('Błąd', err.response?.data || 'Błąd', hideConfirm)
    }
  }

  const handleDelete = (eventId) => {
    showConfirm(
      'Usuń wydarzenie',
      'Czy na pewno chcesz usunąć to wydarzenie? Ta akcja jest nieodwracalna.',
      async () => {
        hideConfirm()
        try {
          await apiClient.delete(`/Event/${eventId}`)
          setEvents((prev) => prev.filter((e) => e.id !== eventId))
        } catch (err) {
          showConfirm('Błąd', 'Nie udało się usunąć: ' + (err.response?.data || err.message), hideConfirm)
        }
      },
      true
    )
  }

  const handleLeave = (eventId) => {
    showConfirm(
      'Opuść wydarzenie',
      'Czy na pewno chcesz zrezygnować z udziału w tym wydarzeniu?',
      async () => {
        hideConfirm()
        try {
          await apiClient.delete(`/Event/${eventId}/leave`)
          fetchEvents()
        } catch (err) {
          showConfirm('Błąd', err.response?.data || 'Błąd podczas opuszczania', hideConfirm)
        }
      }
    )
  }

  return (
    <div>
      {/* HEADER */}
      <header className="app-header">
        <div>
          <h2>Join'nGo</h2>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Zalogowany jako: <b>{currentUserEmail}</b>
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/profile')}>
            👤 Mój Profil
          </button>
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            + Nowe Wydarzenie
          </button>
          {role === 'Admin' && (
            <button className="btn-secondary" onClick={() => navigate('/admin')}>
              Panel Admina
            </button>
          )}
          <button className="logout-btn" onClick={onLogout}>
            Wyloguj
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* FILTERS */}
        <div className="filters-bar">
          <div className="filter-item">
            <label>Szukaj</label>
            <input
              type="text"
              name="search"
              placeholder="Nazwa wydarzenia..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item" style={{ flex: 0.5 }}>
            <label>Kategoria</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">Wszystkie</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item" style={{ flex: 0.7 }}>
            <label>Miasto</label>
            <input
              list="cities-datalist"
              type="text"
              name="location"
              placeholder="Wpisz miasto..."
              value={filters.location}
              onChange={handleFilterChange}
            />
            <datalist id="cities-datalist">
              {POLISH_CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>

          <div className="filter-item" style={{ flex: 0.5 }}>
            <label>Data</label>
            <input 
              type="text" 
              name="date" 
              value={filters.date} 
              onChange={handleFilterChange}
              placeholder="dd/mm/rrrr"
              pattern="\d{2}/\d{2}/\d{4}"
            />
          </div>

          <button className="btn-secondary" onClick={clearFilters} style={{ height: '42px' }}>
            Wyczyść filtry
          </button>
        </div>

        {/* EVENTS GRID */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Ładowanie wydarzeń...</p>
        ) : (
          <>
            <div className="events-grid">
              {events.length === 0 && <p>Brak wydarzeń spełniających kryteria.</p>}

              {events.map((event) => {
                const isMyEvent = currentUserId === event.creatorId
                const isAdmin = role === 'Admin'
                const canDelete = isMyEvent || isAdmin
                const myParticipation = event.participants?.find((p) => p.userId === currentUserId)
                const isJoined = !!myParticipation
                const isConfirmed = myParticipation?.status === 1

                let cardColorClass = 'event-public'
                if (isJoined) {
                  cardColorClass = 'event-joined'
                } else if (event.isPrivate) {
                  cardColorClass = 'event-private'
                }

                return (
                  <div 
                    key={event.id} 
                    className={`event-card ${cardColorClass}`}
                    onClick={() => navigate(`/event/${event.id}`)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div className="category-badge">{event.category || 'Inne'}</div>

                    <div className="card-header">
                      <h4>
                        {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}
                      </h4>
                    </div>

                    <div className="card-meta">
                      <span>
                        📍 {event.city}, {event.location}
                      </span>
                      <span>📅 {formatPolishDateTime(event.date)}</span>
                    </div>

                    <p className="card-desc">{event.description}</p>

                    <div className="card-footer">
                      <div className="participants-info">
                        👥 {event.participants?.length || 0} osób
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {canDelete && (
                          <button 
                            className="btn-danger" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                          >
                            Usuń
                          </button>
                        )}

                        {!isMyEvent ? (
                          !isJoined ? (
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                              onClick={(e) => { e.stopPropagation(); handleJoin(event.id); }}
                            >
                              {event.isPrivate ? 'Poproś' : 'Dołącz'}
                            </button>
                          ) : (
                            <button
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                              onClick={(e) => { e.stopPropagation(); handleLeave(event.id); }}
                            >
                              {isConfirmed ? 'Opuść' : 'Anuluj'}
                            </button>
                          )
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                            onClick={(e) => { e.stopPropagation(); setManagingEventId(event.id); }}
                          >
                            Zarządzaj
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  &laquo; Poprzednia
                </button>
                <span>
                  Strona {page} z {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Następna &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateEventModal
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={() => {
            setPage(1)
            fetchEvents()
          }}
        />
      )}

      {managingEventId && (
        <ParticipantsModal
          eventId={managingEventId}
          onClose={() => setManagingEventId(null)}
          onStatusChange={fetchEvents}
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

export default Home