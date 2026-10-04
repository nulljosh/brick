import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { listingFormatters } from '../lib/format'
import { visibleForZoom } from '../lib/mapPins'
import { useI18n } from '../i18n'
import './MapView.css'

function createPriceIcon(label, isFav) {
  const width = label.length * 9 + 20
  const bg = isFav ? '#B5836A' : '#96654E'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="32">
    <rect width="100%" height="24" rx="12" fill="${bg}"/>
    <text x="50%" y="16" fill="#fff" font-family="DM Sans,sans-serif" font-size="11" font-weight="600" text-anchor="middle">${label}</text>
    <polygon points="${width / 2 - 4},24 ${width / 2 + 4},24 ${width / 2},30" fill="${bg}"/>
  </svg>`
  return L.divIcon({ html: svg, className: 'price-marker', iconSize: [width, 32], iconAnchor: [width / 2, 30] })
}

function MapMarkers({ listings, favorites }) {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [zoom, setZoom] = useState(() => 12)
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) })

  return visibleForZoom(listings, zoom,
    listing => listingFormatters(listing, language, t).priceCompact).map(listing => {
    const fmt = listingFormatters(listing, language, t)
    return (
      <Marker
        key={listing.id}
        position={[listing.lat, listing.lng]}
        icon={createPriceIcon(fmt.priceCompact, favorites.includes(listing.id))}
        zIndexOffset={Math.round((90 - listing.lat) * 100)}
        riseOnHover
        eventHandlers={{ click: () => navigate(`/listing/${listing.id}`) }}
      >
        <Popup className="roost-popup">
          <div className="popup-content">
            {listing.photo && <img src={listing.photo} alt="" />}
            <div className="popup-info">
              <strong>{fmt.price}</strong>
              <span>{listing.beds} {t('bd')} / {listing.baths} {t('ba')} / {fmt.area}</span>
              <span className="popup-address">{listing.address}</span>
            </div>
          </div>
        </Popup>
      </Marker>
    )
  })
}

// Browsing to a new city has to move the map; Leaflet keeps its own view state.
function RecenterOn({ place }) {
  const map = useMap()
  useEffect(() => {
    map.setView([place.lat, place.lng], 12)
  }, [place.id, place.lat, place.lng, map])
  return null
}

export default function MapView({ listings, favorites, place }) {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="map-container">
      <MapContainer
        center={[place.lat, place.lng]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
        />
        {!dark && <TileLayer
          attribution='&copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        />}
        <RecenterOn place={place} />
        <MapMarkers listings={listings} favorites={favorites} />
      </MapContainer>
    </div>
  )
}
