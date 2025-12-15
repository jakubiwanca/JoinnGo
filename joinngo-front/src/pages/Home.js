import React, { useEffect, useState, useCallback } from 'react'
import apiClient from '../api/axiosClient'
import CreateEventModal from '../components/CreateEventModal'
import ParticipantsModal from '../components/ParticipantsModal'
import { POLISH_CITIES } from '../constants/cities'
import { EVENT_CATEGORIES } from '../constants/categories'

function Home({ onLogout, navigate, role, currentUserId, currentUserEmail }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [managingEventId, setManagingEventId] = useState(null)

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
      if (filters.date) params.append('date', filters.date)
      if (filters.category !== '') params.append('category', filters.category)

      params.append('page', page)
      params.append('pageSize', 9)

      const response = await apiClient.get(`/Event?${params.toString()}`)

      if (response.data && response.data.data) {
        setEvents(response.data.data)
        setTotalPages(response.data.totalPages)
      } else {
        setEvents(Array.isArray(response.data) ? response.data : [])
      }
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
      alert(response.data)
      fetchEvents()
    } catch (err) {
      alert(err.response?.data || 'Błąd')
    }
  }

  const handleDelete = async (eventId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return
    try {
      await apiClient.delete(`/Event/${eventId}`)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (err) {
      alert('Nie udało się usunąć: ' + (err.response?.data || err.message))
    }
  }

  const handleLeave = async (eventId) => {
    if (!window.confirm('Czy na pewno chcesz zrezygnować z udziału?')) return
    try {
      const response = await apiClient.delete(`/Event/${eventId}/leave`)
      alert(response.data)
      fetchEvents()
    } catch (err) {
      alert(err.response?.data || 'Błąd podczas opuszczania')
    }
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
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />
          </div>

          {(filters.search || filters.location || filters.date || filters.category) && (
            <button className="btn-secondary" onClick={clearFilters} style={{ height: '42px' }}>
              Wyczyść filtry
            </button>
          )}
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

                return (
                  <div key={event.id} className="event-card">
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
                      <span>📅 {new Date(event.date).toLocaleString()}</span>
                    </div>

                    <p className="card-desc">{event.description}</p>

                    <div className="card-footer">
                      <div className="participants-info">
                        👥 {event.participants?.length || 0} osób
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {canDelete && (
                          <button className="btn-danger" onClick={() => handleDelete(event.id)}>
                            Usuń
                          </button>
                        )}

                        {!isMyEvent ? (
                          !isJoined ? (
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                              onClick={() => handleJoin(event.id)}
                            >
                              {event.isPrivate ? 'Poproś' : 'Dołącz'}
                            </button>
                          ) : (
                            <button
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                              onClick={() => handleLeave(event.id)}
                            >
                              {isConfirmed ? 'Opuść' : 'Anuluj'}
                            </button>
                          )
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                            onClick={() => setManagingEventId(event.id)}
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
    </div>
  )
}

export default Home
