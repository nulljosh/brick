import { createContext, useContext, useEffect, useState } from 'react'
import { defaultPlace, streetsNear } from '../lib/geo'
import { generateListings } from '../data/listings'

const PlaceContext = createContext(null)
const STORAGE_KEY = 'roost-place'

function storedPlace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultPlace
  } catch {
    return defaultPlace
  }
}

export function PlaceProvider({ children }) {
  const [place, setPlaceState] = useState(storedPlace)
  const [mode, setMode] = useState(() => localStorage.getItem('roost-mode') || 'sale')
  const [streets, setStreets] = useState([])
  const [streetsUnavailable, setStreetsUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState([])

  // Street names come from Overpass once per place; the listings themselves are
  // derived, so there is nothing else to fetch when the sale/rent mode flips.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    streetsNear(place, controller.signal)
      .then(({ streets, unavailable }) => {
        setStreets(streets)
        setStreetsUnavailable(unavailable)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [place.id])

  // Real inventory from /api/listings. Empty when no provider covers the place
  // or no key is set, and then the sample homes below stand in, labeled as such.
  useEffect(() => {
    const controller = new AbortController()
    setLive([])
    const q = new URLSearchParams({ lat: place.lat, lng: place.lng, country: place.countryCode || '', city: place.name, mode })
    fetch(`/api/listings?${q}`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : { listings: [] }))
      .then(d => setLive(d.listings || []))
      .catch(() => {})
    return () => controller.abort()
  }, [place.id, mode])

  const isLive = live.length > 0
  const listings = isLive ? live : generateListings(place, streets, mode)

  function setPlace(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setPlaceState(next)
  }

  function changeMode(next) {
    localStorage.setItem('roost-mode', next)
    setMode(next)
  }

  return (
    <PlaceContext.Provider value={{ place, setPlace, mode, setMode: changeMode, listings, isLive, loading, streetsUnavailable }}>
      {children}
    </PlaceContext.Provider>
  )
}

export function usePlace() {
  return useContext(PlaceContext)
}
