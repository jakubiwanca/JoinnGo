import React, { useState, useEffect } from 'react'
import { createEvent } from '../api/events'
import ConfirmModal from './ConfirmModal'
import { useConfirm } from '../hooks/useConfirm'
import { setupLeafletIcon } from '../utils/leafletSetup'
import { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { pl } from 'date-fns/locale/pl'
import { differenceInCalendarWeeks, differenceInCalendarMonths } from 'date-fns'
import 'leaflet/dist/leaflet.css'

import {
  TitleField,
  CategoryField,
  DescriptionField,
  DateTimeField,
  LocationFields,
  MapField,
  PrivateCheckbox,
  MaxParticipantsField,
  RecurringCheckbox,
  RecurrenceConfig,
} from './EventFormFields'

registerLocale('pl', pl)
setupLeafletIcon()

function CreateEventModal({ onClose, onEventCreated }) {
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
    category: '',
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

  const [mapCenter, setMapCenter] = useState([52.2297, 21.0122])
  const [markerPosition, setMarkerPosition] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const lastAutoSelectedDayRef = React.useRef(null)

  useEffect(() => {
    if (formData.date && isRecurring && recurrence.type === 1) {
      const dayIndex = formData.date.getDay()

      if (lastAutoSelectedDayRef.current !== null && lastAutoSelectedDayRef.current !== dayIndex) {
        const prevDay = lastAutoSelectedDayRef.current
        setRecurrence((prev) => {
          const newDays = prev.daysOfWeek.filter((d) => d !== prevDay)
          if (!newDays.includes(dayIndex)) {
            newDays.push(dayIndex)
          }
          return { ...prev, daysOfWeek: newDays }
        })
      } else if (!recurrence.daysOfWeek.includes(dayIndex)) {
        setRecurrence((prev) => ({
          ...prev,
          daysOfWeek: [...prev.daysOfWeek, dayIndex],
        }))
      }

      lastAutoSelectedDayRef.current = dayIndex
    }
  }, [formData.date, isRecurring, recurrence.type, recurrence.daysOfWeek])

  const { confirmModal, showConfirm, hideConfirm } = useConfirm()

  const filterRecurrenceEndDate = (date) => {
    if (!isRecurring) return true
    if (formData.date && date < formData.date) return false

    const startDate = new Date(formData.date)
    const interval = recurrence.interval || 1

    if (recurrence.type === 1) {
      if (recurrence.daysOfWeek.length === 0) return true
      if (!recurrence.daysOfWeek.includes(date.getDay())) return false
      const diffWeeks = differenceInCalendarWeeks(date, startDate, { locale: pl })
      return diffWeeks % interval === 0
    }

    if (recurrence.type === 2) {
      if (!formData.date) return true
      if (date.getDate() !== startDate.getDate()) return false
      const diffMonths = differenceInCalendarMonths(date, startDate)
      return diffMonths % interval === 0
    }

    return true
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value
    if (type === 'checkbox') newValue = checked
    if (name === 'category' || name === 'maxParticipants') newValue = parseInt(value, 10)

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const handleLocationSelect = (loc) => {
    setMapCenter([loc.lat, loc.lon])
    setMarkerPosition({ lat: loc.lat, lng: loc.lon })
    setFormData((prev) => ({
      ...prev,
      latitude: loc.lat,
      longitude: loc.lon,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const errors = {}
    if (!formData.title || formData.title.trim() === '') {
      errors.title = 'Proszę wpisać tytuł wydarzenia.'
    }
    if (formData.category === '' || formData.category === null) {
      errors.category = 'Proszę wybrać kategorię.'
    }
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Proszę wpisać opis wydarzenia.'
    }
    if (!formData.date) {
      errors.date = 'Proszę wybrać datę i godzinę.'
    }
    if (!formData.city || formData.city.trim() === '') {
      errors.city = 'Proszę wpisać miasto.'
    }
    if (!formData.location || formData.location.trim() === '') {
      errors.location = 'Proszę wpisać dokładne miejsce.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      if (modalTopRef.current)
        modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      const isoDate = formData.date.toISOString()
      const payload = { ...formData, date: isoDate }

      if (isRecurring) {
        if (recurrence.endDate) {
          const endD = new Date(recurrence.endDate)
          const startD = new Date(formData.date)

          if (endD <= startD) {
            setError('Data zakończenia musi być późniejsza niż data rozpoczęcia.')
            setLoading(false)
            return
          }

          const interval = recurrence.interval || 1

          if (recurrence.type === 1) {
            if (
              recurrence.daysOfWeek.length > 0 &&
              !recurrence.daysOfWeek.includes(endD.getDay())
            ) {
              setError('Data zakończenia musi wypadać w jeden z wybranych dni powtarzania.')
              setLoading(false)
              return
            }
            const diffWeeks = differenceInCalendarWeeks(endD, startD, { locale: pl })
            if (diffWeeks % interval !== 0) {
              setError(`Data zakończenia nie pasuje do cyklu (co ${interval} tygodni).`)
              setLoading(false)
              return
            }
          } else if (recurrence.type === 2) {
            if (endD.getDate() !== startD.getDate()) {
              setError(
                `Dla powtarzania miesięcznego data zakończenia musi być tym samym dniem miesiąca.`,
              )
              setLoading(false)
              return
            }
            const diffMonths = differenceInCalendarMonths(endD, startD)
            if (diffMonths % interval !== 0) {
              setError(`Data zakończenia nie pasuje do cyklu (co ${interval} miesięcy).`)
              setLoading(false)
              return
            }
          }
        }

        payload.recurrence = {
          type: recurrence.type,
          interval: recurrence.interval,
          daysOfWeek: recurrence.daysOfWeek.length > 0 ? recurrence.daysOfWeek : null,
          endDate: recurrence.endDate ? new Date(recurrence.endDate).toISOString() : null,
          maxOccurrences: recurrence.maxOccurrences || null,
        }
      }

      await createEvent(payload)
      showConfirm(
        'Sukces',
        'Wydarzenie zostało pomyślnie utworzone!',
        () => {
          hideConfirm()
          onEventCreated()
          onClose()
        },
        false,
        false,
      )
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

  const filterTime = (time) => {
    const now = new Date()
    const selectedDate = formData.date || new Date()
    if (selectedDate.toDateString() === now.toDateString()) {
      return time.getTime() >= now.getTime()
    }
    return true
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
            Stwórz nowe wydarzenie
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
          <TitleField value={formData.title} onChange={handleChange} error={fieldErrors.title} />
          <CategoryField
            value={formData.category}
            onChange={handleChange}
            error={fieldErrors.category}
          />
          <DescriptionField
            value={formData.description}
            onChange={handleChange}
            error={fieldErrors.description}
          />
          <DateTimeField
            value={formData.date}
            onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
            error={fieldErrors.date}
            minDate={new Date()}
            filterTime={filterTime}
          />
          <LocationFields
            city={formData.city}
            location={formData.location}
            onCityChange={(val) => setFormData((prev) => ({ ...prev, city: val }))}
            onLocationChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
            onLocationSelect={handleLocationSelect}
            cityError={fieldErrors.city}
            locationError={fieldErrors.location}
          />
          <MapField
            mapCenter={mapCenter}
            markerPosition={markerPosition}
            setMarkerPosition={setMarkerPosition}
            setFormData={setFormData}
          />
          <PrivateCheckbox checked={formData.isPrivate} onChange={handleChange} />
          <MaxParticipantsField value={formData.maxParticipants} onChange={handleChange} />
          <RecurringCheckbox
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />

          {isRecurring && (
            <RecurrenceConfig
              recurrence={recurrence}
              setRecurrence={setRecurrence}
              formDate={formData.date}
              filterRecurrenceEndDate={filterRecurrenceEndDate}
              radioName="endType"
            />
          )}

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

export default CreateEventModal
