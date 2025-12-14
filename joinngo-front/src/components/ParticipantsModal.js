import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosClient';

function ParticipantsModal({ eventId, onClose, onStatusChange }) {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await apiClient.get(`/Event/${eventId}/participants`);
                setParticipants(response.data);
            } catch (err) {
                console.error("Błąd pobierania uczestników:", err);
                alert("Nie udało się pobrać listy uczestników.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, [eventId, onClose]);

    const handleAccept = async (userId) => {
        try {
            await apiClient.put(
                `/Event/${eventId}/participants/${userId}/status`, 
                "Confirmed" 
            );

            setParticipants(prev => prev.map(p => {
                if (p.userId === userId) return { ...p, status: 'Confirmed' };
                return p;
            }));

            if (onStatusChange) onStatusChange();

        } catch (err) {
            console.error(err);
            alert("Błąd podczas akceptacji.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h3>Uczestnicy wydarzenia</h3>
                    <button onClick={onClose} style={{background:'transparent', border:'none', fontSize:'1.5em', cursor:'pointer'}}>×</button>
                </div>

                {loading ? <p>Ładowanie...</p> : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {participants.length === 0 && <p>Brak zgłoszeń.</p>}
                        
                        {participants.map(p => (
                            <li key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                                <div>
                                    <strong>{p.email}</strong>
                                    <br/>
                                    <small>Status: {getStatusLabel(p.status)}</small>
                                </div>
                                
                                {p.status === 'Interested' && (
                                    <button 
                                        className="btn-primary" 
                                        style={{padding: '5px 10px', fontSize: '0.8em', background: '#28a745'}}
                                        onClick={() => handleAccept(p.userId)}
                                    >
                                        Zatwierdź
                                    </button>
                                )}
                                
                                {p.status === 'Confirmed' && (
                                    <span style={{color: 'green'}}>✅</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function getStatusLabel(status) {
    switch (status) {
        case 'Interested': return 'Oczekuje ⏳';
        case 'Confirmed': return 'Potwierdzony ✅';
        default: return status;
    }
}

export default ParticipantsModal;