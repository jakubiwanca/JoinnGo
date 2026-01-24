import React, { useState, useEffect } from 'react'
import apiClient from '../api/axiosClient'
import ConfirmModal from './ConfirmModal'
import LocationAutocomplete from './LocationAutocomplete'
import { EVENT_CATEGORIES } from '../constants/categories'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { pl } from 'date-fns/locale/pl'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

registerLocale('pl', pl)

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

function LocationMarker({ position, setPosition, setFormData }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng
      setPosition(e.latlng)
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }))

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pl`,
        )
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
            const parts = (data.display_name || '').split(',')
            if (parts.length > 0) detailedLocation = parts[0]
          }

          setFormData((prev) => ({
            ...prev,
            city: city || prev.city,
            location: detailedLocation || prev.location,
          }))
        }
      } catch (error) {
        console.error('Error doing reverse geocoding:', error)
      }
    },
  })
  return position ? <Marker position={position} /> : null
}

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13)
  }, [center, map])
  return null
}

function EditEventModal({ eventToEdit, onClose, onEventUpdated }) {
  const modalTopRef = React.useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: null,
    location: '',
    city: '',
    latitude: null,
    longitude: null,
    isPrivate: false,
    category: 0,
    maxParticipants: 0,
  })

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState({
    type: 1,
    interval: 1,
    daysOfWeek: [],
    endDate: null,
    maxOccurrences: null,
  })

  const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]) // Default: Warszawa
  const [markerPosition, setMarkerPosition] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: true,
    danger: false,
  })

  const showConfirm = (title, message, onConfirm, danger = false, showCancel = true) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, danger, showCancel })
  }

  const hideConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false, onConfirm: null })
  }

  useEffect(() => {
    if (eventToEdit) {
      const dateObj = new Date(eventToEdit.date)

      const categoryObj = EVENT_CATEGORIES.find((c) => c.name === eventToEdit.category)
      const categoryId = categoryObj ? categoryObj.id : 0

      const lat = eventToEdit.latitude || 52.2297
      const lng = eventToEdit.longitude || 21.0122

      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: dateObj,
        location: eventToEdit.location,
        city: eventToEdit.city,
        latitude: eventToEdit.latitude,
        longitude: eventToEdit.longitude,
        isPrivate: eventToEdit.isPrivate,
        category: categoryId,
        maxParticipants: eventToEdit.maxParticipants || 0,
      })

      if (eventToEdit.latitude && eventToEdit.longitude) {
        setMapCenter([eventToEdit.latitude, eventToEdit.longitude])
        setMarkerPosition({ lat: eventToEdit.latitude, lng: eventToEdit.longitude })
      }

      if (eventToEdit.recurrence) {
        setIsRecurring(true)
        setRecurrence({
          type: eventToEdit.recurrence.type,
          interval: eventToEdit.recurrence.interval,
          daysOfWeek: eventToEdit.recurrence.daysOfWeek || [],
          endDate: eventToEdit.recurrence.endDate ? new Date(eventToEdit.recurrence.endDate) : null,
          maxOccurrences: eventToEdit.recurrence.maxOccurrences || null,
        })
      } else {
        setIsRecurring(false)
        setRecurrence({
          type: 1,
          interval: 1,
          daysOfWeek: [],
          endDate: null,
          maxOccurrences: null,
        })
      }
    }
  }, [eventToEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value
    if (type === 'checkbox') newValue = checked
    if (name === 'category' || name === 'maxParticipants') newValue = parseInt(value, 10)

    setFormData((prev) => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.date) {
        setError('Proszę wybrać datę i godzinę.')
        setLoading(false)
        return
      }

      if (!formData.category) {
        setError('Proszę wybrać kategorię.')
        setLoading(false)
        return
      }

      const isoDate = formData.date.toISOString()

      const payload = {
        ...formData,
        date: isoDate,
      }

      if (isRecurring) {
        payload.recurrence = {
          type: recurrence.type,
          interval: recurrence.interval,
          daysOfWeek: recurrence.daysOfWeek.length > 0 ? recurrence.daysOfWeek : null,
          endDate: recurrence.endDate ? new Date(recurrence.endDate).toISOString() : null,
          maxOccurrences: recurrence.maxOccurrences || null,
        }
      }

      await apiClient.put(`/Event/${eventToEdit.id}`, payload)

      showConfirm(
        'Sukces',
        'Wydarzenie zaktualizowane!',
        () => {
          hideConfirm()
          onEventUpdated()
          onClose()
        },
        false,
        false,
      )
    } catch (err) {
      console.error('Błąd edycji:', err)
      setError(
        typeof err.response?.data === 'string' ? err.response.data : 'Nie udało się zapisać zmian.',
      )
      if (modalTopRef.current) {
        modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 ref={modalTopRef} style={{ margin: 0 }}>
            Edytuj wydarzenie
          </h3>
          <button onClick={onClose} className="modal-close-btn">
            &times;
          </button>
        </div>
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
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
          </div>

          <div className="form-group">
            <label>Kategoria:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                marginBottom: '10px',
                color:
                  formData.category === 0 || formData.category === ''
                    ? '#6b7280'
                    : 'var(--text-dark)',
              }}
              required
            >
              <option value="" disabled>
                Wybierz kategorię
              </option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ color: 'var(--text-dark)' }}>
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
              style={{ width: '100%', minHeight: '60px', marginBottom: '10px' }}
            />
          </div>

          <div className="form-group">
            <label>Data i godzina:</label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              timeCaption="Godzina"
              dateFormat="dd.MM.yyyy HH:mm"
              locale="pl"
              placeholderText="Wybierz datę i godzinę"
              className="date-picker-input"
              wrapperClassName="date-picker-wrapper"
              popperProps={{ strategy: 'fixed' }}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Miasto:</label>
              <LocationAutocomplete
                value={formData.city}
                onChange={(val) => setFormData((prev) => ({ ...prev, city: val }))}
                onLocationSelect={(loc) => {
                  setMapCenter([loc.lat, loc.lon])
                  setMarkerPosition({ lat: loc.lat, lng: loc.lon })
                  setFormData((prev) => ({
                    ...prev,
                    latitude: loc.lat,
                    longitude: loc.lon,
                  }))
                }}
                placeholder="Wybierz lub wpisz..."
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Dokładne miejsce:</label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                onLocationSelect={(loc) => {
                  setMapCenter([loc.lat, loc.lon])
                  setMarkerPosition({ lat: loc.lat, lng: loc.lon })
                  setFormData((prev) => ({
                    ...prev,
                    latitude: loc.lat,
                    longitude: loc.lon,
                  }))
                }}
                placeholder="Np. ul. Prosta 51"
                required
                contextQuery={formData.city}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Zaznacz na mapie (opcjonalne):
            </label>
            <div
              style={{
                height: '300px',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #ddd',
              }}
            >
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={markerPosition}
                  setPosition={setMarkerPosition}
                  setFormData={setFormData}
                />
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
              Wydarzenie prywatne
            </label>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Limit uczestników (0 = brak limitu):</label>
            <input
              type="number"
              name="maxParticipants"
              min="0"
              value={formData.maxParticipants}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Recurring Event Checkbox */}
          <div
            className="form-group checkbox-group"
            style={{ marginTop: '10px', marginBottom: '20px' }}
          >
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Wydarzenie cykliczne
            </label>
          </div>

          {isRecurring && (
            <div
              style={{
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div className="form-group">
                <label>Częstotliwość:</label>
                <select
                  value={recurrence.type}
                  onChange={(e) => setRecurrence({ ...recurrence, type: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value={1}>Tygodniowo</option>
                  <option value={2}>Miesięcznie</option>
                </select>
              </div>

              {recurrence.type === 1 && (
                <div className="form-group">
                  <label>Dni tygodnia:</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'].map((day, index) => (
                      <label
                        key={index}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={recurrence.daysOfWeek.includes(index)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...recurrence.daysOfWeek, index]
                              : recurrence.daysOfWeek.filter((d) => d !== index)
                            setRecurrence({ ...recurrence, daysOfWeek: newDays })
                          }}
                          style={{ marginRight: '4px' }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Co ile {recurrence.type === 1 ? 'tygodni' : 'miesięcy'}:</label>
                <input
                  type="number"
                  min="1"
                  value={recurrence.interval}
                  onChange={(e) =>
                    setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                  }
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div className="form-group">
                <label>Zakończenie:</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="editEndType"
                      checked={recurrence.endDate !== null}
                      onChange={() =>
                        setRecurrence({ ...recurrence, endDate: new Date(), maxOccurrences: null })
                      }
                      style={{ marginRight: '5px' }}
                    />
                    Do daty
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="editEndType"
                      checked={recurrence.maxOccurrences !== null}
                      onChange={() =>
                        setRecurrence({ ...recurrence, endDate: null, maxOccurrences: 10 })
                      }
                      style={{ marginRight: '5px' }}
                    />
                    Po X wystąpieniach
                  </label>
                </div>
              </div>

              {recurrence.endDate !== null && (
                <div className="form-group">
                  <label>Data zakończenia:</label>
                  <DatePicker
                    selected={recurrence.endDate}
                    onChange={(date) => setRecurrence({ ...recurrence, endDate: date })}
                    dateFormat="dd.MM.yyyy"
                    locale="pl"
                    placeholderText="Wybierz datę zakończenia"
                    className="date-picker-input"
                    wrapperClassName="date-picker-wrapper"
                    popperProps={{ strategy: 'fixed' }}
                    minDate={new Date()}
                  />
                </div>
              )}

              {recurrence.maxOccurrences !== null && (
                <div className="form-group">
                  <label>Liczba wystąpień:</label>
                  <input
                    type="number"
                    min="1"
                    value={recurrence.maxOccurrences}
                    onChange={(e) =>
                      setRecurrence({
                        ...recurrence,
                        maxOccurrences: parseInt(e.target.value) || 1,
                      })
                    }
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              )}
            </div>
          )}

          <div
            className="modal-actions"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
        showCancel={confirmModal.showCancel}
        danger={confirmModal.danger}
      />
    </div>
  )
}
export default EditEventModal
