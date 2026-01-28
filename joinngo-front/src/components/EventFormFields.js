import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import LocationAutocomplete from './LocationAutocomplete'
import { MapContainer, TileLayer } from 'react-leaflet'
import { LocationMarker, MapUpdater } from './MapComponents'
import { EVENT_CATEGORIES } from '../constants/categories'
import { DAYS_OF_WEEK } from '../constants/common'

export function TitleField({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label>Tytuł:</label>
      <input
        type="text"
        name="title"
        value={value}
        onChange={onChange}
        placeholder="Np. Mecz piłki nożnej"
        style={{ width: '100%', marginBottom: error ? '4px' : '10px' }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  )
}

export function CategoryField({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label>Kategoria:</label>
      <select
        name="category"
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          marginBottom: '10px',
          color: value === '' || value === 0 ? '#6b7280' : 'var(--text-dark)',
        }}
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
      {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  )
}

export function DescriptionField({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label>Opis:</label>
      <textarea
        name="description"
        value={value}
        onChange={onChange}
        placeholder="Opisz szczegóły..."
        style={{
          width: '100%',
          minHeight: '60px',
          marginBottom: error ? '4px' : '10px',
        }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  )
}

export function DateTimeField({ value, onChange, error, minDate, filterTime }) {
  return (
    <div className="form-group">
      <label>Data i godzina:</label>
      <DatePicker
        selected={value}
        onChange={onChange}
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
        minDate={minDate}
        filterTime={filterTime}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  )
}

export function LocationFields({
  city,
  location,
  onCityChange,
  onLocationChange,
  onLocationSelect,
  cityError,
  locationError,
}) {
  return (
    <div style={{ display: 'flex', gap: '15px' }}>
      <div className="form-group" style={{ flex: 1 }}>
        <label>Miasto:</label>
        <LocationAutocomplete
          value={city}
          onChange={onCityChange}
          onLocationSelect={onLocationSelect}
          placeholder="Wybierz lub wpisz..."
        />
        {cityError && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{cityError}</span>}
      </div>

      <div className="form-group" style={{ flex: 1 }}>
        <label>Dokładne miejsce:</label>
        <LocationAutocomplete
          value={location}
          onChange={onLocationChange}
          onLocationSelect={onLocationSelect}
          placeholder="Np. ul. Prosta 51"
          contextQuery={city}
        />
        {locationError && (
          <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{locationError}</span>
        )}
      </div>
    </div>
  )
}

export function MapField({ mapCenter, markerPosition, setMarkerPosition, setFormData }) {
  return (
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
  )
}

export function PrivateCheckbox({ checked, onChange }) {
  return (
    <div className="form-group checkbox-group" style={{ marginTop: '10px', marginBottom: '20px' }}>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name="isPrivate"
          checked={checked}
          onChange={onChange}
          style={{ marginRight: '8px' }}
        />
        Wydarzenie prywatne (wymaga akceptacji)
      </label>
    </div>
  )
}

export function MaxParticipantsField({ value, onChange }) {
  return (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label>Limit uczestników (0 = brak limitu):</label>
      <input
        type="number"
        name="maxParticipants"
        min="0"
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '8px' }}
      />
    </div>
  )
}

export function RecurringCheckbox({ checked, onChange }) {
  return (
    <div className="form-group checkbox-group" style={{ marginTop: '10px', marginBottom: '20px' }}>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ marginRight: '8px' }}
        />
        Wydarzenie cykliczne
      </label>
    </div>
  )
}

export function RecurrenceConfig({
  recurrence,
  setRecurrence,
  formDate,
  filterRecurrenceEndDate,
  radioName = 'endType',
}) {
  return (
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
            {DAYS_OF_WEEK.map((dayObj) => (
              <label
                key={dayObj.value}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={recurrence.daysOfWeek.includes(dayObj.value)}
                  disabled={formDate && formDate.getDay() === dayObj.value}
                  onChange={(e) => {
                    const newDays = e.target.checked
                      ? [...recurrence.daysOfWeek, dayObj.value]
                      : recurrence.daysOfWeek.filter((d) => d !== dayObj.value)
                    setRecurrence({ ...recurrence, daysOfWeek: newDays })
                  }}
                  style={{ marginRight: '4px' }}
                />
                {dayObj.label}
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
          <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <input
              type="radio"
              name={radioName}
              checked={recurrence.endDate === null}
              onChange={() => setRecurrence({ ...recurrence, endDate: null, maxOccurrences: null })}
              style={{ marginRight: '5px' }}
            />
            Nigdy
          </label>
          <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <input
              type="radio"
              name={radioName}
              checked={recurrence.endDate !== null}
              onChange={() =>
                setRecurrence({ ...recurrence, endDate: new Date(), maxOccurrences: null })
              }
              style={{ marginRight: '5px' }}
            />
            Do daty
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
            filterDate={filterRecurrenceEndDate}
          />
        </div>
      )}
    </div>
  )
}
