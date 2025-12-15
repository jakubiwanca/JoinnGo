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
      dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset())
      const formattedDate = dateObj.toISOString().slice(0, 16)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
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
              type="datetime-local"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
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
