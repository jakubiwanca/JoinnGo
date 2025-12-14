import React, { useState } from 'react';
import apiClient from '../api/axiosClient';
import { POLISH_CITIES } from '../constants/cities';
import { EVENT_CATEGORIES } from '../constants/categories';

function CreateEventModal({ onClose, onEventCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        city: '',
        isPrivate: false,
        category: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let newValue = value;
        if (type === 'checkbox') newValue = checked;
        if (name === 'category') newValue = parseInt(value, 10);

        setFormData(prev => ({
            ...prev,
            [name]: newValue
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
                {error && <p className="error-msg" style={{color: 'red'}}>{error}</p>}
                
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
                            style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                        />
                    </div>
                    
                    {/* --- WYBÓR KATEGORII --- */}
                    <div className="form-group">
                        <label>Kategoria:</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange}
                            style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                        >
                            {EVENT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Opis:</label>
                        <textarea 
                            name="description" 
                            required 
                            value={formData.description} 
                            onChange={handleChange}
                            placeholder="Opisz szczegóły..."
                            style={{width: '100%', padding: '8px', minHeight: '60px', marginBottom: '10px'}}
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
                            style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Miasto:</label>
                            <input 
                                list="city-options" 
                                name="city"
                                required
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Wybierz lub wpisz..."
                                autoComplete="off"
                                style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                            />
                            <datalist id="city-options">
                                {POLISH_CITIES.map(city => (
                                    <option key={city} value={city} />
                                ))}
                            </datalist>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Dokładne miejsce:</label>
                            <input 
                                type="text" 
                                name="location" 
                                required 
                                value={formData.location} 
                                onChange={handleChange} 
                                placeholder="Np. Hala sportowa / Park"
                                style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                            />
                        </div>
                    </div>

                    <div className="form-group checkbox-group" style={{marginTop: '10px', marginBottom: '20px'}}>
                        <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                            <input 
                                type="checkbox" 
                                name="isPrivate" 
                                checked={formData.isPrivate} 
                                onChange={handleChange} 
                                style={{marginRight: '8px'}}
                            />
                            Wydarzenie prywatne (wymaga akceptacji)
                        </label>
                    </div>

                    <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose} 
                            disabled={loading}
                            style={{padding: '8px 15px'}}
                        >
                            Anuluj
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading}
                            style={{padding: '8px 15px'}}
                        >
                            {loading ? 'Tworzenie...' : 'Utwórz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEventModal;