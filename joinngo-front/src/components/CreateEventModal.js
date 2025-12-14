import React, { useState } from 'react';
import apiClient from '../api/axiosClient';

const POLISH_CITIES = [
  "Augustów", "Bełchatów", "Będzin", "Biała Podlaska", "Białystok", "Bielawa", "Bielsko-Biała", 
  "Bolesławiec", "Brodnica", "Bydgoszcz", "Bytom", "Chełm", "Chojnice", "Chorzów", "Ciechanów", 
  "Cieszyn", "Czeladź", "Czechowice-Dziedzice", "Częstochowa", "Dąbrowa Górnicza", "Dębica", 
  "Dzierżoniów", "Elbląg", "Ełk", "Gdańsk", "Gdynia", "Giżycko", "Gliwice", "Głogów", "Gniezno", 
  "Gorzów Wielkopolski", "Grodzisk Mazowiecki", "Grudziądz", "Iława", "Inowrocław", "Jarosław", 
  "Jasło", "Jastrzębie-Zdrój", "Jaworzno", "Jelenia Góra", "Kalisz", "Katowice", "Kielce", 
  "Kluczbork", "Kłodzko", "Knurów", "Kołobrzeg", "Konin", "Koszalin", "Kraków", "Kraśnik", 
  "Krosno", "Kutno", "Kwidzyn", "Legionowo", "Legnica", "Leszno", "Lębork", "Lubin", "Lublin", 
  "Luboń", "Łomża", "Łódź", "Łuków", "Malbork", "Marki", "Mielec", "Mikołów", "Mińsk Mazowiecki", 
  "Mysłowice", "Nowa Sól", "Nowy Sącz", "Nowy Targ", "Nysa", "Olsztyn", "Oława", "Opole", 
  "Ostrołęka", "Ostrowiec Świętokrzyski", "Ostrów Wielkopolski", "Oświęcim", "Otwock", 
  "Pabianice", "Piaseczno", "Piekary Śląskie", "Piła", "Piotrków Trybunalski", "Płock", "Police", 
  "Poznań", "Pruszków", "Przemyśl", "Puławy", "Racibórz", "Radom", "Radomsko", "Reda", 
  "Ruda Śląska", "Rumia", "Rybnik", "Rzeszów", "Sanok", "Siedlce", "Siemianowice Śląskie", 
  "Sieradz", "Skarżysko-Kamienna", "Skierniewice", "Słupsk", "Sopot", "Sosnowiec", "Stalowa Wola", 
  "Starachowice", "Stargard", "Starogard Gdański", "Suwałki", "Szczecin", "Szczecinek", "Świdnica", 
  "Świebodzice", "Świętochłowice", "Świnoujście", "Tarnobrzeg", "Tarnów", "Tczew", 
  "Tomaszów Mazowiecki", "Toruń", "Tychy", "Wałbrzych", "Warszawa", "Wejherowo", "Włocławek", 
  "Wodzisław Śląski", "Wołomin", "Wrocław", "Września", "Zabrze", "Zakopane", "Zamość", 
  "Zawiercie", "Ząbki", "Zduńska Wola", "Zgierz", "Zgorzelec", "Zielona Góra", "Żagań", 
  "Żory", "Żywiec", "Żyrardów"
];

function CreateEventModal({ onClose, onEventCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        city: '',
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