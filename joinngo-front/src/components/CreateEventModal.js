import React, { useState } from 'react';
import apiClient from '../api/axiosClient';

function CreateEventModal({ onClose, onEventCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        isPrivate: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                date: new Date(formData.date).toISOString() 
            };

            await apiClient.post('/Event', payload);
            onEventCreated(); 
            onClose(); 
        } catch (err) {
            console.error("Szczegóły błędu:", err.response?.data || err.message);
            
            const backendError = typeof err.response?.data === 'string' 
                ? err.response.data 
                : 'Nie udało się utworzyć wydarzenia. Sprawdź dane.';
                
            setError(backendError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Stwórz nowe wydarzenie</h3>
                {error && <p className="error-msg">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tytuł:</label>
                        <input 
                            type="text" 
                            name="title" 
                            required 
                            value={formData.title} 
                            onChange={handleChange} 
                            placeholder="Np. Mecz piłki nożnej"
                        />
                    </div>

                    <div className="form-group">
                        <label>Opis:</label>
                        <textarea 
                            name="description" 
                            required 
                            value={formData.description} 
                            onChange={handleChange}
                            placeholder="Opisz szczegóły..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Data i godzina:</label>
                        <input 
                            type="datetime-local" 
                            name="date" 
                            required 
                            value={formData.date} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="form-group">
                        <label>Lokalizacja:</label>
                        <input 
                            type="text" 
                            name="location" 
                            required 
                            value={formData.location} 
                            onChange={handleChange} 
                            placeholder="Np. Orlik przy ul. Polnej"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input 
                                type="checkbox" 
                                name="isPrivate" 
                                checked={formData.isPrivate} 
                                onChange={handleChange} 
                            />
                            Wydarzenie prywatne
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Anuluj
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Tworzenie...' : 'Utwórz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEventModal;