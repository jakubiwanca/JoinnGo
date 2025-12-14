import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode';
import CreateEventModal from '../components/CreateEventModal';
import ParticipantsModal from '../components/ParticipantsModal';

function Home({ token, onLogout, navigate, role }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [managingEventId, setManagingEventId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserEmail(decoded.email || decoded.unique_name || 'Użytkownik');
        
        const userIdFromToken = decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        
        if (userIdFromToken) {
            setCurrentUserId(parseInt(userIdFromToken, 10));
        }
      } catch (e) {
        console.error("Błąd dekodowania tokena", e);
      }
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/Event');
      setEvents(response.data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleJoin = async (eventId) => {
    try {
      const response = await apiClient.post(`/Event/${eventId}/join`);
      alert(response.data);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data || 'Błąd');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return;
    try {
      await apiClient.delete(`/Event/${eventId}`);
      // Aktualizacja lokalna listy, żeby nie odświeżać całej strony
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      alert("Nie udało się usunąć: " + (err.response?.data || err.message));
    }
  };

  const handleLeave = async (eventId) => {
    if (!window.confirm('Czy na pewno chcesz zrezygnować z udziału?')) return;
    try {
      const response = await apiClient.delete(`/Event/${eventId}/leave`);
      alert(response.data);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data || 'Błąd podczas opuszczania');
    }
  };

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

      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="events-list" style={{ display: 'grid', gap: '15px' }}>
          {events.length === 0 && <p>Brak wydarzeń. Bądź pierwszy i stwórz coś!</p>}
          
          {events.map((event) => {
            const isMyEvent = currentUserId === event.creatorId;
            const isAdmin = role === 'Admin';
            
            const canDelete = isMyEvent || isAdmin;
            
            const myParticipation = event.participants?.find((p) => p.userId === currentUserId);
            const isJoined = !!myParticipation;
            const isConfirmed = myParticipation?.status === 1; // 1 = Confirmed, 0 = Interested

            return (
              <div
                key={event.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  borderRadius: '8px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4>
                    {event.title} {event.isPrivate && <span title="Prywatne">🔒</span>}
                  </h4>
                  
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
                        marginLeft: '10px'
                      }}
                    >
                      {isAdmin && !isMyEvent ? 'Usuń (Admin)' : 'Usuń'}
                    </button>
                  )}
                </div>

                <p>{event.description}</p>
                <small>
                  📍 {event.location} | 📅 {new Date(event.date).toLocaleString()}
                </small>
                
                <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#555' }}>
                  Uczestników: {event.participants?.length || 0}
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                      👥 Zarządzaj ({event.participants?.filter((p) => p.status === 0).length || 0} oczekuje)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tworzenia */}
      {isCreateModalOpen && (
        <CreateEventModal
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={fetchEvents}
        />
      )}

      {/* Modal - lista uczestników */}
      {managingEventId && (
        <ParticipantsModal
          eventId={managingEventId}
          onClose={() => setManagingEventId(null)}
          onStatusChange={fetchEvents}
        />
      )}
    </div>
  );
}

export default Home;