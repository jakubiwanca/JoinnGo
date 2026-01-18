import React, { useState } from 'react'
import apiClient from '../api/axiosClient'
import LocationAutocomplete from './LocationAutocomplete'
import { EVENT_CATEGORIES } from '../constants/categories'

function CreateEventModal({ onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    city: '',
    isPrivate: false,
    category: 0,
  })
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
