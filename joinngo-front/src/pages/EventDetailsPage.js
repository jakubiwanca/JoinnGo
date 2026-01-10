import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import ParticipantsModal from '../components/ParticipantsModal';
import Comments from '../components/Comments';

const EventDetailsPage = ({ currentUserId }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

  const isUserParticipant = useCallback((theEvent) => {
    if (!theEvent || !theEvent.eventParticipants) return false;
    return theEvent.eventParticipants.some(p => p.userId === currentUserId);
  }, [currentUserId]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await apiClient.get(`event/${id}/comments`);
      setComments(response.data);
    } catch (err) {
      // It's okay if this fails (e.g., user not a participant), don't show an error
      console.error('Could not fetch comments:', err);
      setComments([]); // Ensure comments are cleared if user loses access
    }
  }, [id]);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`event/${id}`)
      const fetchedEvent = response.data;
      setEvent(fetchedEvent);
      if (isUserParticipant(fetchedEvent)) {
        fetchComments();
      }
    } catch (err) {
      console.error(err)
      setError('Nie udało się pobrać szczegółów wydarzenia.')
    } finally {
      setLoading(false)
    }
  }, [id, fetchComments, isUserParticipant]);

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const response = await apiClient.post(`event/${id}/join`)
      alert(response.data)
      fetchEvent()
    } catch (err) {
      alert(err.response?.data || 'Błąd podczas dołączania')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Czy na pewno chcesz zrezygnować z udziału?')) return
    setActionLoading(true)
    try {
      const response = await apiClient.delete(`event/${id}/leave`)
      alert(response.data)
      fetchEvent()
    } catch (err) {
      alert(err.response?.data || 'Błąd podczas opuszczania')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz TRWALE usunąć to wydarzenie?')) return
    setActionLoading(true)
    try {
      await apiClient.delete(`event/${id}`)
      alert('Wydarzenie zostało usunięte.')
      navigate('/')
    } catch (err) {
      alert(err.response?.data || 'Błąd podczas usuwania')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCommentPosted = (newComment) => {
    setComments(prevComments => [...prevComments, newComment]);
  };

  if (loading)
    return (
      <div className="main-container">
        <p style={{ textAlign: 'center' }}>Ładowanie...</p>
      </div>
    )
  if (error)
    return (
      <div className="main-container">
        <p className="text-danger">{error}</p>
      </div>
    )
  if (!event) return null

  const participantsList = event.eventParticipants || []
  const isOrganizer = currentUserId === event.creatorId
  const isJoined = isUserParticipant(event);
  const isFull = event.maxParticipants > 0 && participantsList.length >= event.maxParticipants

  let actionButton

  if (isOrganizer) {
        actionButton = (
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    className="btn-secondary" 
                    onClick={() => setIsParticipantsModalOpen(true)} 
                    style={{ padding: '10px 25px' }}
                >
                    ⚙️ Zarządzaj uczestnikami
                </button>
                <button 
                    className="btn-danger" 
                    onClick={handleDelete} 
                    disabled={actionLoading} 
                    style={{ padding: '10px 25px' }}
                >
                    {actionLoading ? "Usuwanie..." : "Usuń wydarzenie"}
                </button>
            </div>
        );
  } else if (isJoined) {
    actionButton = (
      <button
        className="btn-secondary"
        onClick={handleLeave}
        disabled={actionLoading}
        style={{ padding: '10px 25px' }}
      >
        {actionLoading ? 'Przetwarzanie...' : 'Opuść wydarzenie'}
      </button>
    )
  } else {
    const buttonText = event.isPrivate 
      ? 'Poproś o dołączenie' 
      : 'Dołącz do wydarzenia';

    actionButton = (
      <button
        className="btn-primary"
        disabled={isFull || actionLoading}
        onClick={handleJoin}
        style={{ padding: '10px 25px' }}
      >
        {actionLoading ? 'Przetwarzanie...' : isFull ? 'Brak miejsc' : buttonText}
      </button>
    )
  }

  return (
    <div className="main-container">
      <header className="app-header" style={{ marginBottom: '2rem' }}>
        <div>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            &laquo; Powrót do listy
          </button>
        </div>
        <h2>Szczegóły Wydarzenia</h2>
      </header>

      <div
        className="event-card"
        style={{ maxWidth: '800px', margin: '0 auto', cursor: 'default' }}
      >
        <div className="category-badge">{event.category || 'Inne'}</div>

        <div className="card-header">
          <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
            {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}
          </h1>
        </div>

        <div
          className="card-meta"
          style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}
        >
          <span>
            📍 <b>Lokalizacja:</b> {event.city}, {event.location}
          </span>
          <span>
            📅 <b>Data:</b> {new Date(event.date).toLocaleString()}
          </span>
          <span>
            👤 <b>Organizator:</b> {event.creator?.email || event.creatorId}
          </span>
        </div>

        <div className="card-body">
          <h4 style={{ color: 'var(--text-dark)', marginBottom: '10px' }}>Opis:</h4>
          <p
            className="card-desc"
            style={{ fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
          >
            {event.description}
          </p>
        </div>

        <div
          className="card-footer"
          style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}
        >
          <div className="participants-info" style={{ fontSize: '1.1rem' }}>
            👥 <b>Uczestnicy:</b> {participantsList.length}
            {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>{actionButton}</div>
        </div>
        
        {isJoined && (
            <Comments 
                eventId={id}
                comments={comments}
                onCommentPosted={handleCommentPosted}
                currentUserId={currentUserId}
            />
        )}

      </div>
      {isParticipantsModalOpen && (
                <ParticipantsModal
                    eventId={event.id}
                    onClose={() => setIsParticipantsModalOpen(false)}
                    onStatusChange={fetchEvent}
                />
            )}
    </div>
  )
}

export default EventDetailsPage
