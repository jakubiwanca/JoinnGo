import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents, joinEvent, leaveEvent, deleteEvent } from '../api/events'
import { useConfirm } from '../hooks/useConfirm'
import ParticipantsModal from '../components/ParticipantsModal'
import EditEventModal from '../components/EditEventModal'
import EventCard from '../components/EventCard'
import ConfirmModal from '../components/ConfirmModal'
import LocationAutocomplete from '../components/LocationAutocomplete'
import { EVENT_CATEGORIES } from '../constants/categories'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { pl } from 'date-fns/locale/pl'

registerLocale('pl', pl)

function Home({ role, currentUserId, refreshTrigger }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [managingEventId, setManagingEventId] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)

  const handleEditClick = (event) => {
    setEditingEvent(event)
  }

  const handleEditSuccess = () => {
    setEditingEvent(null)
    fetchEvents()
  }

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  const [filters, setFilters] = useState({
    search: '',
    location: '',
    date: '',
    category: '',
  })

  const [locationInput, setLocationInput] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput.length >= 3 || locationInput.length === 0) {
        setFilters((prev) => {
          if (prev.location !== locationInput) {
            setPage(1)
            return { ...prev, location: locationInput }
          }
          return prev
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [locationInput])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 3 || searchInput.length === 0) {
        setFilters((prev) => {
          if (prev.search !== searchInput) {
            setPage(1)
            return { ...prev, search: searchInput }
          }
          return prev
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)

      let clientSideDateFilter = null
      if (filters.date) {
        const dateParts = filters.date.split('.').filter((part) => part !== '')
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

      const data = await getEvents(params)

      let events = []
      if (data && data.data) {
        events = data.data
        setTotalPages(data.totalPages)
      } else {
        events = Array.isArray(data) ? data : []
      }

      if (clientSideDateFilter) {
        events = events.filter((event) => {
          const eventDate = new Date(event.date)
          const eventDay = String(eventDate.getDate()).padStart(2, '0')
          const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0')

          if (clientSideDateFilter.length === 1) {
            return eventDay === clientSideDateFilter[0].padStart(2, '0')
          }
          if (clientSideDateFilter.length === 2) {
            return (
              eventDay === clientSideDateFilter[0].padStart(2, '0') &&
              eventMonth === clientSideDateFilter[1].padStart(2, '0')
            )
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
  }, [fetchEvents, refreshTrigger])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPage(1)
  }

  const handleDateChange = (date) => {
    if (date) {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const formattedDate = `${day}.${month}.${year}`
      setFilters((prev) => ({ ...prev, date: formattedDate }))
    } else {
      setFilters((prev) => ({ ...prev, date: '' }))
    }
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', location: '', date: '', category: '' })
    setLocationInput('')
    setSearchInput('')
    setPage(1)
  }

  const handleJoin = async (eventId) => {
    try {
      const data = await joinEvent(eventId)
      showConfirm('Sukces', data, hideConfirm, false, false)
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
          await deleteEvent(eventId)
          setEvents((prev) => prev.filter((e) => e.id !== eventId))
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
    const event = events.find((e) => e.id === eventId)
    const myParticipant = event?.participants?.find((p) => p.userId === currentUserId)
    const isPending = myParticipant?.status === 'Interested'

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
        fetchEvents()
      } catch (err) {
        showConfirm('Błąd', err.response?.data || 'Błąd podczas opuszczania', hideConfirm)
      }
    })
  }

  return (
    <div>
      <div className="main-container">
        {/* FILTERS */}
        <div className="filters-bar">
          <div className="filter-item">
            <label>Szukaj</label>
            <input
              type="text"
              name="search"
              placeholder="Nazwa wydarzenia..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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

          <div className="filter-item" style={{ flex: 1 }}>
            <label>Miasto</label>
            <LocationAutocomplete
              value={locationInput}
              onChange={(val) => setLocationInput(val)}
              placeholder="Wpisz miasto..."
            />
          </div>

          <div className="filter-item" style={{ flex: 0.5 }}>
            <label>Data</label>
            <DatePicker
              selected={
                filters.date
                  ? (() => {
                      const [d, m, y] = filters.date.split('.')
                      return new Date(y, m - 1, d)
                    })()
                  : null
              }
              onChange={handleDateChange}
              dateFormat="dd.MM.yyyy"
              locale="pl"
              placeholderText="dd.mm.rrrr"
              className="date-picker-input"
              isClearable
              wrapperClassName="date-picker-wrapper"
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

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={currentUserId}
                    role={role}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onDelete={handleDelete}
                    onEdit={handleEditClick}
                    onCardClick={(id) => navigate(`/event/${id}`)}
                  />
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
      {managingEventId && (
        <ParticipantsModal
          eventId={managingEventId}
          onClose={() => setManagingEventId(null)}
          onStatusChange={fetchEvents}
        />
      )}

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
    </div>
  )
}

export default Home
