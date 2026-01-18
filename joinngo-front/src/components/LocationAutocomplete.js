import React, { useState, useEffect, useRef } from 'react'

const LocationAutocomplete = ({ value, onChange, onLocationSelect, placeholder = 'Wpisz miasto...', required = false }) => {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2 && isOpen) {
        setIsLoading(true)
        try {
          // Switch to Nominatim API using Polish language
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=pl&accept-language=pl`)
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }
          const data = await response.json()
          
          const uniqueCities = new Set()
          const mappedSuggestions = []

          data.forEach(item => {
             const addr = item.address
             const cityName = addr.city || addr.town || addr.village || addr.municipality || item.name
             
             if (cityName) {
                 if (!uniqueCities.has(cityName)) {
                     uniqueCities.add(cityName)
                     // Store full item and extracted city name
                     mappedSuggestions.push({ ...item, cityName })
                 }
             }
          })

          setSuggestions(mappedSuggestions)
        } catch (error) {
          console.error("Error fetching location data:", error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 500) 

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setIsOpen(true)
  }

  const handleSelect = (item) => {
    setQuery(item.cityName)
    onChange(item.cityName)
    if (onLocationSelect) {
        onLocationSelect({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name
        })
    }
    setIsOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="location-autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className="location-input"
        autoComplete="off"
        onFocus={() => query.length > 2 && setIsOpen(true)}
        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
      />
      
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <ul className="location-dropdown-list">
          {isLoading && suggestions.length === 0 && <li className="loading-item">Szukam...</li>}
          
          {!isLoading && suggestions.map((item, index) => (
            <li key={index} onClick={() => handleSelect(item)}>
              {item.cityName} <span style={{fontSize: '0.8em', color: '#6b7280'}}>({item.display_name})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LocationAutocomplete
