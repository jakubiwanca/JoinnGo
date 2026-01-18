import React, { useState, useEffect } from 'react'
import apiClient from '../api/axiosClient'
import LocationAutocomplete from './LocationAutocomplete'
import { EVENT_CATEGORIES } from '../constants/categories'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle clicks on map
function LocationMarker({ position, setPosition, setFormData }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng
      setPosition(e.latlng)
      setFormData(prev => ({
          ...prev, 
          latitude: lat, 
          longitude: lng 
      }))

      // Reverse geocoding
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pl`)
        const data = await response.json()
        
        if (data && data.address) {
            const addr = data.address
            const city = addr.city || addr.town || addr.village || addr.municipality
            
            let detailedLocation = ''
            if (addr.road) {
                detailedLocation += addr.road
                if (addr.house_number) detailedLocation += ` ${addr.house_number}`
            } else if (data.name) {
                detailedLocation = data.name
            } else {
                 // Fallback to first part of display name
                 const parts = (data.display_name || '').split(',')
                 if (parts.length > 0) detailedLocation = parts[0]
            }

            setFormData(prev => ({
                ...prev,
                city: city || prev.city,
                location: detailedLocation || prev.location
            }))
        }
      } catch (error) {
        console.error("Error doing reverse geocoding:", error)
      }
    },
  })
  return position ? <Marker position={position} /> : null
}

// Helper to update map center when external location changes
function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13)
  }, [center, map])
  return null
}

function CreateEventModal({ onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    city: '',
    latitude: null,
    longitude: null,
    isPrivate: false,
    category: 0,
  })
  
  const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]) // Default: Warsaw
  const [markerPosition, setMarkerPosition] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    let newValue = value
    if (type === 'checkbox') newValue = checked
    if (name === 'category') newValue = parseInt(value, 10)

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const parsePolishDateToISO = (polishDate) => {
    const parts = polishDate.split(' ')
    if (parts.length !== 2) return null
    
    const dateParts = parts[0].split('/')
    const timeParts = parts[1].split(':')
    
    if (dateParts.length !== 3 || timeParts.length !== 2) return null
    
    const day = parseInt(dateParts[0], 10)
    const month = parseInt(dateParts[1], 10) - 1
    const year = parseInt(dateParts[2], 10)
    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1], 10)
    
    const date = new Date(year, month, day, hours, minutes)
    return date.toISOString()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const isoDate = parsePolishDateToISO(formData.date)
      if (!isoDate) {
        setError('Nieprawidłowy format daty. Użyj: dd/mm/rrrr gg:mm')
        setLoading(false)
        return
      }

      const payload = {
        ...formData,
        date: isoDate,
      }

      await apiClient.post('/Event', payload)
      onEventCreated()
      onClose()
    } catch (err) {
      console.error('Szczegóły błędu:', err.response?.data || err.message)
      const backendError =
        typeof err.response?.data === 'string'
          ? err.response.data
          : 'Nie udało się utworzyć wydarzenia. Sprawdź dane.'
      setError(backendError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Stwórz nowe wydarzenie</h3>
        {error && (
          <p className="error-msg" style={{ color: 'red' }}>
            {error}
          </p>
        )}

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
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
          </div>

          {/* --- WYBÓR KATEGORII --- */}
          <div className="form-group">
            <label>Kategoria:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
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
              style={{ width: '100%', padding: '8px', minHeight: '60px', marginBottom: '10px' }}
            />
          </div>

          <div className="form-group">
            <label>Data i godzina:</label>
            <input
              type="text"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              placeholder="dd/mm/rrrr gg:mm (np. 21/04/2025 15:00)"
              pattern="\d{2}/\d{2}/\d{4} \d{2}:\d{2}"
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Miasto:</label>
              <LocationAutocomplete
                value={formData.city}
                onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                onLocationSelect={(loc) => {
                    setMapCenter([loc.lat, loc.lon])
                    setMarkerPosition({ lat: loc.lat, lng: loc.lon })
                    setFormData(prev => ({ 
                        ...prev, 
                        latitude: loc.lat, 
                        longitude: loc.lon 
                    }))
                }}
                placeholder="Wybierz lub wpisz..."
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Dokładne miejsce:</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Np. Hala sportowa"
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{display: 'block', marginBottom: '8px'}}>Zaznacz na mapie (opcjonalne):</label>
            <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker position={markerPosition} setPosition={setMarkerPosition} setFormData={setFormData} />
                  <MapUpdater center={mapCenter} />
                </MapContainer>
            </div>
            <small style={{ color: '#666' }}>Kliknij na mapę, aby postawić pineskę.</small>
          </div>

          <div
            className="form-group checkbox-group"
            style={{ marginTop: '10px', marginBottom: '20px' }}
          >
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              Wydarzenie prywatne (wymaga akceptacji)
            </label>
          </div>

          <div
            className="modal-actions"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '8px 15px' }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ padding: '8px 15px' }}
            >
              {loading ? 'Tworzenie...' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventModal
