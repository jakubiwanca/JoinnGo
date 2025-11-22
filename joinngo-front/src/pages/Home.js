import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode';

function Home({ token, onLogout, navigate, role }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserEmail(decoded.email || decoded.unique_name || 'Użytkownik');
      } catch (e) {}
    }
  }, [token]);

  // wydarzenia
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/Event');
        setEvents(response.data);
      } catch (err) {
        console.error("Błąd pobierania wydarzeń:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleJoin = async (eventId) => {
    try {
        const response = await apiClient.post(`/Event/${eventId}/join`);
        alert(response.data);
    } catch (err) {
        alert(err.response?.data || 'Błąd podczas dołączania');
    }
  };

  return (
    <div className="container">
      <header className="header" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between'}}>
        <h2>Witaj, {currentUserEmail}</h2>
        <div className="header-buttons">
          {role === 'Admin' && (
            <button className="header-btn" onClick={() => navigate('/admin')}>Panel Admina</button>
          )}
          <button className="logout-btn" onClick={onLogout}>Wyloguj się</button>
        </div>
      </header>

      <h3>Dostępne Wydarzenia</h3>
      
      {loading ? <p>Ładowanie...</p> : (
        <div className="events-list" style={{ display: 'grid', gap: '15px' }}>
          {events.map(event => (
            <div key={event.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h4>{event.title} {event.isPrivate && <span>🔒</span>}</h4>
              <p>{event.description}</p>
              <small>📍 {event.location} | 📅 {new Date(event.date).toLocaleString()}</small>
              <div style={{marginTop: '10px'}}>
                <button className="btn" onClick={() => handleJoin(event.id)}>
                    {event.isPrivate ? 'Poproś o dołączenie' : 'Dołącz'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;