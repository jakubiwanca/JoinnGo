import React, { useState, useEffect, useRef } from 'react'
import apiClient from '../api/axiosClient'

const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Wpisz miasto...',
  required = false,
  contextQuery = null,
}) => {
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
          let searchQuery = query
          if (contextQuery && !query.toLowerCase().includes(contextQuery.toLowerCase())) {
            searchQuery = `${query}, ${contextQuery}`
          }

          const response = await apiClient.get(`/geocoding?q=${encodeURIComponent(searchQuery)}`)
          const data = response.data

          const uniqueCities = new Set()
          const mappedSuggestions = []

          data.forEach((item) => {
            const addr = item.address
            const itemCityName = addr.city || addr.town || addr.village || addr.municipality

            if (contextQuery) {
              const contextLower = contextQuery.toLowerCase()
              const cityLower = (itemCityName || '').toLowerCase()
              const displayLower = (item.display_name || '').toLowerCase()

              const isMatch =
                cityLower.includes(contextLower) || displayLower.includes(contextLower)

              if (!isMatch) return

              let shortName = item.display_name

              const road = addr.road || addr.pedestrian || addr.street || addr.residential
              const houseNumber = addr.house_number
              const name = item.name

              if (road) {
                shortName = road
                if (houseNumber) shortName += ` ${houseNumber}`
              } else if (name) {
                shortName = name
              } else {
                shortName = item.display_name.split(',')[0]
              }

              mappedSuggestions.push({ ...item, cityName: shortName, isAddress: true })
            } else {
              if (itemCityName) {
                if (!uniqueCities.has(itemCityName)) {
                  uniqueCities.add(itemCityName)
                  mappedSuggestions.push({ ...item, cityName: itemCityName })
                }
              }
            }
          })

          setSuggestions(mappedSuggestions)
        } catch (error) {
          console.error('Error fetching location data:', error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query, isOpen, contextQuery])

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
        display_name: item.display_name,
      })
    }
    setIsOpen(false)
    setSuggestions([])
  }

  return (
    <div
      ref={wrapperRef}
      className="location-autocomplete-wrapper"
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className="location-input"
        autoComplete="off"
        onFocus={() => query.length > 2 && setIsOpen(true)}
        style={{ width: '100%' }}
      />

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <ul className="location-dropdown-list">
          {isLoading && suggestions.length === 0 && <li className="loading-item">Szukam...</li>}

          {!isLoading &&
            suggestions.map((item, index) => (
              <li key={index} onClick={() => handleSelect(item)}>
                {item.isAddress ? (
                  <span>
                    {item.cityName}{' '}
                    <span style={{ fontSize: '0.8em', color: '#6b7280' }}>
                      ({item.display_name})
                    </span>
                  </span>
                ) : (
                  <>
                    {item.cityName}{' '}
                    <span style={{ fontSize: '0.8em', color: '#6b7280' }}>
                      ({item.display_name})
                    </span>
                  </>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default LocationAutocomplete
