import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminAllEvents, deleteEvent } from '../api/events'
import { formatPolishDateTime } from '../utils/dateFormat'
import ParticipantsModal from './ParticipantsModal'

const AdminEventsTab = ({ onEventDeleted }) => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [participantsModal, setParticipantsModal] = useState({
    isOpen: false,
    eventId: null,
    creatorId: null,
  })

  useEffect(() => {
    fetchEvents()
  }, [page])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await getAdminAllEvents(page)
      if (data && data.data) {
        setEvents(data.data)
        setTotalPages(data.totalPages)
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error('Nie udalo sie pobrac wydarzen', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (event) => {
    const isRecurring = event.isRecurring
    let deleteSeries = false

    if (isRecurring) {
      if (
        window.confirm(
          `To wydarzenie jest cykliczne. Czy chcesz usunąć CAŁĄ SERIĘ wydarzeń?\n(Kliknij OK, aby usunąć serię. Kliknij Anuluj, aby przerwać)`,
        )
      ) {
        deleteSeries = true
      } else {
        return
      }
    } else {
      if (!window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return
    }

    try {
      await deleteEvent(event.id, deleteSeries)
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      if (onEventDeleted) onEventDeleted()
    } catch (err) {
      alert('Nie udało się usunąć wydarzenia.')
      console.error(err)
    }
  }

  if (loading) return <p>Ładowanie wydarzeń...</p>

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#4b5563' }}>
        Wszystkie Wydarzenia ({events.length})
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Tytuł</th>
              <th style={{ padding: '12px' }}>Typ</th>
              <th style={{ padding: '12px' }}>Data</th>
              <th style={{ padding: '12px' }}>Koniec</th>
              <th style={{ padding: '12px' }}>Organizator</th>
              <th style={{ padding: '12px' }}>Uczestnicy</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{e.id}</td>
                <td
                  style={{
                    padding: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: '#4f46e5',
                    textDecoration: 'underline',
                  }}
                  onClick={() => navigate(`/event/${e.id}`, { state: { fromAdmin: true } })}
                  title="Przejdź do szczegółów"
                >
                  {e.title}
                </td>
                <td style={{ padding: '12px' }}>
                  {e.isRecurring ? (
                    <span title="Cykliczne">🔄 Cykliczne</span>
                  ) : (
                    <span title="Standardowe">Jednorazowe</span>
                  )}
                  {e.isPrivate && <span style={{ marginLeft: '5px' }}>🔒</span>}
                </td>
                <td style={{ padding: '12px' }}>{formatPolishDateTime(e.date)}</td>
                <td style={{ padding: '12px' }}>
                  {e.recurrenceEndDate ? formatPolishDateTime(e.recurrenceEndDate) : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div>{e.creatorUsername}</div>
                  <small style={{ color: '#6b7280' }}>{e.creatorEmail}</small>
                </td>
                <td style={{ padding: '12px' }}>
                  <div
                    className="participants-info"
                    onClick={() =>
                      setParticipantsModal({
                        isOpen: true,
                        eventId: e.id,
                        creatorId: e.creatorId,
                      })
                    }
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    title="Pokaż uczestników"
                  >
                    <span style={{ fontSize: '1.1rem' }}>👥</span>
                    <span>{e.participantsCount}</span>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  {e.isExpired ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>Wygasłe</span>
                  ) : (
                    <span style={{ color: 'green' }}>Aktywne</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    onClick={() => handleDelete(e)}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {participantsModal.isOpen && (
        <ParticipantsModal
          eventId={participantsModal.eventId}
          creatorId={participantsModal.creatorId}
          isOwner={true}
          onClose={() => setParticipantsModal({ isOpen: false, eventId: null, creatorId: null })}
          onStatusChange={fetchEvents}
        />
      )}

      {totalPages > 1 && (
        <div
          className="pagination"
          style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}
        >
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &laquo; Poprzednia
          </button>
          <span style={{ alignSelf: 'center' }}>
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
    </div>
  )
}

export default AdminEventsTab
