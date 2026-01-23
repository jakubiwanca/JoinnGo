import React, { useState, useEffect, useRef } from 'react'

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
          // Prepare search query. Context helps narrow down if e.g. city is known.
          // However, Nominatim works best with comma separated values "Startowej 5, Warszawa".
          // We can append contextQuery if provided.
          let searchQuery = query
          if (contextQuery && !query.toLowerCase().includes(contextQuery.toLowerCase())) {
            searchQuery = `${query}, ${contextQuery}`
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=10&countrycodes=pl&accept-language=pl`,
          )

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }
          const data = await response.json()

          const uniqueCities = new Set()
          const mappedSuggestions = []

          data.forEach((item) => {
            const addr = item.address
            const itemCityName = addr.city || addr.town || addr.village || addr.municipality

            // If we are just searching for cities (default behavior when no context), we dedup by city.
            // If we are searching for addresses (with context), we show specific results.
            if (contextQuery) {
              // Strict filtering: ensure the result is actually in the requested city
              // We check against city/town/village fields and also display_name as fallback
              const contextLower = contextQuery.toLowerCase()
              const cityLower = (itemCityName || '').toLowerCase()
              const displayLower = (item.display_name || '').toLowerCase()

              const isMatch =
                cityLower.includes(contextLower) || displayLower.includes(contextLower)

              if (!isMatch) return

              // For address search, try to construct a shorter name (e.g. Street + Number)
              // instead of the full display_name (which includes city, country, postcode etc.)
              let shortName = item.display_name // fallback

              const road = addr.road || addr.pedestrian || addr.street || addr.residential
              const houseNumber = addr.house_number
              const name = item.name

              if (road) {
                shortName = road
                if (houseNumber) shortName += ` ${houseNumber}`
              } else if (name) {
                shortName = name
              } else {
                // fallback if no road/name: first part of display name
                shortName = item.display_name.split(',')[0]
              }

              mappedSuggestions.push({ ...item, cityName: shortName, isAddress: true })
            } else {
              // City search logic
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
  }, [query, contextQuery])

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
