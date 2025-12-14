import React, { useEffect, useState, useCallback } from 'react'
import apiClient from '../api/axiosClient'
import { jwtDecode } from 'jwt-decode'
import CreateEventModal from '../components/CreateEventModal'
import ParticipantsModal from '../components/ParticipantsModal'
import { POLISH_CITIES } from '../constants/cities';
import { EVENT_CATEGORIES } from '../constants/categories';

function Home({ token, onLogout, navigate, role }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [managingEventId, setManagingEventId] = useState(null)
  
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    date: '',
    category: ''
  })

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token)
        setCurrentUserEmail(decoded.email || decoded.unique_name || 'Użytkownik')

        const userIdFromToken =
          decoded.nameid ||
          decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']

        if (userIdFromToken) {
          setCurrentUserId(parseInt(userIdFromToken, 10))
        }
      } catch (e) {
        console.error('Błąd dekodowania tokena', e)
      }
    }
  }, [token])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      if (filters.date) params.append('date', filters.date)
      if (filters.category !== '') params.append('category', filters.category)
      
      params.append('page', page)
      params.append('pageSize', 10)

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
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); 
  };

  const handleSearchClick = () => {
      setPage(1);
      fetchEvents();
  }

  const clearFilters = () => {
      setFilters({ search: '', location: '', date: '', category: '' });
      setPage(1);
  };

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
    <div className="container">
      <header
        className="header"
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2>Witaj, {currentUserEmail}</h2>
        </div>
        <div className="header-buttons" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            + Stwórz wydarzenie
          </button>

          {role === 'Admin' && (
            <button className="header-btn" onClick={() => navigate('/admin')}>
              Panel Admina
            </button>
          )}

          <button className="logout-btn" onClick={onLogout}>
            Wyloguj się
          </button>
        </div>
      </header>

      <h3>Dostępne Wydarzenia</h3>

      {/* --- PASEK FILTRÓW --- */}
      <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'end'
      }}>
        {/* Szukaj */}
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{display: 'block', fontSize: '0.8em', marginBottom: '5px'}}>Szukaj (nazwa/opis):</label>
            <input 
                type="text" 
                name="search" 
                placeholder="np. Piłka nożna..." 
                value={filters.search}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
        </div>

        {/* Kategoria */}
        <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{display: 'block', fontSize: '0.8em', marginBottom: '5px'}}>Kategoria:</label>
            <select 
                name="category" 
                value={filters.category} 
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="">Wszystkie</option>
                {EVENT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
        </div>

        {/* Miasto */}
        <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{display: 'block', fontSize: '0.8em', marginBottom: '5px'}}>Miasto:</label>
            <input 
                list="cities-datalist"
                type="text" 
                name="location" 
                placeholder="np. Warszawa" 
                value={filters.location}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <datalist id="cities-datalist">
                {POLISH_CITIES.map(city => <option key={city} value={city} />)}
            </datalist>
        </div>

        {/* Data */}
        <div style={{ flex: 1, minWidth: '130px' }}>
            <label style={{display: 'block', fontSize: '0.8em', marginBottom: '5px'}}>Data:</label>
            <input 
                type="date" 
                name="date" 
                value={filters.date}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
        </div>

        <button 
            className="btn-primary" 
            onClick={handleSearchClick}
            style={{ height: '38px', minWidth: '80px' }}
        >
            Szukaj 🔍
        </button>
        
        {(filters.search || filters.location || filters.date || filters.category) && (
             <button 
                onClick={clearFilters}
                style={{ height: '38px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px' }}
             >
                Wyczyść ✕
            </button>
        )}
      </div>
      {/* --------------------- */}

      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <>
        <div className="events-list" style={{ display: 'grid', gap: '15px' }}>
          {events.length === 0 && <p>Brak wydarzeń spełniających kryteria.</p>}

          {events.map((event) => {
            const isMyEvent = currentUserId === event.creatorId
            const isAdmin = role === 'Admin'
            const canDelete = isMyEvent || isAdmin

            const myParticipation = event.participants?.find((p) => p.userId === currentUserId)
            const isJoined = !!myParticipation
            const isConfirmed = myParticipation?.status === 1 

            return (
              <div
                key={event.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  borderRadius: '8px',
                  background: '#fff',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#e9ecef', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75em', fontWeight: 'bold', color: '#495057' }}>
                   {event.category || 'Inne'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginRight: '60px'
                  }}
                >
                  <h4 style={{ margin: '0 0 5px 0' }}>
                    {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}
                  </h4>
                </div>

                <p style={{marginTop: '5px', color: '#333'}}>{event.description}</p>
                <small style={{display: 'block', marginBottom: '10px', color: '#666'}}>
                  📍 {event.location} | 📅 {new Date(event.date).toLocaleString()}
                </small>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.85em', color: '#555' }}>
                        Uczestników: {event.participants?.length || 0}
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        {canDelete && (
                            <button
                            onClick={() => handleDelete(event.id)}
                            style={{
                                color: 'white',
                                background: '#dc3545',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                            }}
                            >
                            {isAdmin && !isMyEvent ? 'Usuń (Admin)' : 'Usuń'}
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {!isMyEvent && (
                    <>
                      {!isJoined && (
                        <button className="btn" onClick={() => handleJoin(event.id)}>
                          {event.isPrivate ? 'Poproś o dołączenie' : 'Dołącz'}
                        </button>
                      )}

                      {isJoined && (
                        <button
                          className="btn-secondary"
                          style={{ background: '#ffc107', color: '#000', border: 'none' }}
                          onClick={() => handleLeave(event.id)}
                        >
                          {isConfirmed ? 'Opuść wydarzenie' : 'Anuluj prośbę'}
                        </button>
                      )}
                    </>
                  )}

                  {isMyEvent && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.9em' }}
                      onClick={() => setManagingEventId(event.id)}
                    >
                      👥 Zarządzaj ({event.participants?.filter((p) => p.status === 0).length || 0}{' '}
                      oczekuje)
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* --- PAGINACJA --- */}
        {totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                <button 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => p - 1)}
                    style={{ padding: '8px 12px', cursor: 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                >
                    &laquo; Poprzednia
                </button>
                <span>Strona {page} z {totalPages}</span>
                <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '8px 12px', cursor: 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                >
                    Następna &raquo;
                </button>
            </div>
        )}
        </>
      )}

      {isCreateModalOpen && (
        <CreateEventModal
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={() => {
              setPage(1); 
              fetchEvents();
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