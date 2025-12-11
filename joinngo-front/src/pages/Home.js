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
        if (userIdFromToken) setCurrentUserId(parseInt(userIdFromToken, 10));
      } catch (e) {}
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

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleJoin = async (eventId) => {
    try {
        const response = await apiClient.post(`/Event/${eventId}/join`);
        alert(response.data);
    } catch (err) {
        alert(err.response?.data || 'Błąd');
    }
  };

  const handleDelete = async (eventId) => {
      if(!window.confirm("Usunąć wydarzenie?")) return;
      try {
          await apiClient.delete(`/Event/${eventId}`);
          setEvents(prev => prev.filter(e => e.id !== eventId));
      } catch (err) { alert(err.message); }
  };

  return (
    <div className="container">
      <header className="header" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Witaj, {currentUserEmail}</h2>
        <div className="header-buttons" style={{display: 'flex', gap: '10px'}}>
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Stwórz wydarzenie</button>
          {role === 'Admin' && <button className="header-btn" onClick={() => navigate('/admin')}>Panel Admina</button>}
          <button className="logout-btn" onClick={onLogout}>Wyloguj się</button>
        </div>
      </header>

      <h3>Dostępne Wydarzenia</h3>
      
      {loading ? <p>Ładowanie...</p> : (
        <div className="events-list" style={{ display: 'grid', gap: '15px' }}>
          {events.map(event => {
            const isMyEvent = currentUserId === event.creatorId;
            return (
                <div key={event.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#fff' }}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                      <h4>{event.title} {event.isPrivate && <span>🔒</span>}</h4>
                      {isMyEvent && <button onClick={() => handleDelete(event.id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Usuń</button>}
                  </div>
                  <p>{event.description}</p>
                  <small>📍 {event.location} | 📅 {new Date(event.date).toLocaleString()}</small>
                  
                  <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                    {!isMyEvent && (
                        <button className="btn" onClick={() => handleJoin(event.id)}>
                            {event.isPrivate ? 'Poproś o dołączenie' : 'Dołącz'}
                        </button>
                    )}
                    
                    {isMyEvent && (
                        <button 
                            className="btn-secondary" 
                            style={{fontSize: '0.9em'}}
                            onClick={() => setManagingEventId(event.id)}
                        >
                            👥 Zarządzaj uczestnikami
                        </button>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      )}

      {/* modal tworzenia */}
      {isCreateModalOpen && (
        <CreateEventModal onClose={() => setIsCreateModalOpen(false)} onEventCreated={fetchEvents} />
      )}

      {/* modal - lista uczestników */}
      {managingEventId && (
        <ParticipantsModal 
            eventId={managingEventId} 
            onClose={() => setManagingEventId(null)} 
        />
      )}
    </div>
  );
}

export default Home;