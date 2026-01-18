import React, { useState, useEffect } from 'react'
import apiClient from '../api/axiosClient'
import { POLISH_CITIES } from '../constants/cities'
import { EVENT_CATEGORIES } from '../constants/categories'

function EditEventModal({ eventToEdit, onClose, onEventUpdated }) {
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

  useEffect(() => {
    if (eventToEdit) {
      const dateObj = new Date(eventToEdit.date)
      const day = String(dateObj.getDate()).padStart(2, '0')
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const year = dateObj.getFullYear()
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`

      const categoryObj = EVENT_CATEGORIES.find((c) => c.name === eventToEdit.category)
      const categoryId = categoryObj ? categoryObj.id : 0

      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: formattedDate,
        location: eventToEdit.location,
        city: eventToEdit.city,
        isPrivate: eventToEdit.isPrivate,
        category: categoryId,
      })
    }
  }, [eventToEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value
    if (type === 'checkbox') newValue = checked
    if (name === 'category') newValue = parseInt(value, 10)

    setFormData((prev) => ({ ...prev, [name]: newValue }))
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

      await apiClient.put(`/Event/${eventToEdit.id}`, payload)

      alert('Wydarzenie zaktualizowane!')
      onEventUpdated()
      onClose()
    } catch (err) {
      console.error('Błąd edycji:', err)
      setError(
        typeof err.response?.data === 'string' ? err.response.data : 'Nie udało się zapisać zmian.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edytuj wydarzenie</h3>
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
              <input
                list="city-options"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                autoComplete="off"
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              <datalist id="city-options">
                {POLISH_CITIES.map((city) => (
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
              Wydarzenie prywatne
            </label>
          </div>

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
    </div>
  )
}

export default EditEventModal
