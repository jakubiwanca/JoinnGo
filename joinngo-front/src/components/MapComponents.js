import React, { useEffect } from 'react'
import { Marker, useMapEvents, useMap } from 'react-leaflet'

export function LocationMarker({ position, setPosition, setFormData }) {
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

export function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13)
  }, [center, map])
  return null
}
