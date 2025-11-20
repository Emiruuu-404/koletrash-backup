import React from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { buildApiUrl } from '../../config/api'

const ENV_COLORS = {
  primary: '#2d5016',
  secondary: '#4a7c59',
  accent: '#8fbc8f',
  light: '#f8faf5',
  white: '#ffffff',
  text: '#2c3e50',
  textLight: '#7f8c8d',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  border: '#e8f5e8',
  shadow: 'rgba(45, 80, 22, 0.08)',
  bark: '#5d4e37',
  moss: '#9caa7b',
  leaf: '#6b8e23',
  soil: '#8b4513'
}

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Sipocot map config
const SIPOCOT_CENTER = [13.7766, 122.9826]
const SIPOCOT_BOUNDS = [
  [13.6000, 122.7000], // Southwest (wider city/country buffer)
  [13.9000, 123.2000], // Northeast
]

const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('access_token')
  } catch (err) {
    console.warn('Unable to read access token', err)
    return null
  }
}

const getAuthHeaders = (extra = {}) => {
  const token = getAuthToken()
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

const truckMarkerIcon = (scale = 1) => {
  const size = 36 * scale
  const anchorX = size / 2
  const anchorY = size * 0.85
  const popupY = size * 0.75

  return L.divIcon({
    className: 'truck-marker-icon',
    html: `<div style="font-size:${size}px; line-height:1; transform: translate(-50%, -70%);">🚛</div>`,
    iconSize: [size, size],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, -popupY]
  })
}

// Auto-fit helper component
function MapAutoFit({ trucks }) {
  const map = useMap()
  React.useEffect(() => {
    if (!trucks || trucks.length === 0) return
    const points = trucks
      .map(t => [parseFloat(t.lat), parseFloat(t.lng)])
      .filter(arr => Number.isFinite(arr[0]) && Number.isFinite(arr[1]))
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 })
  }, [trucks, map])
  return null
}

const isStale = (ts, thresholdMs = 60000) => {
  if (!ts) return true
  const t = new Date(ts).getTime()
  if (!Number.isFinite(t)) return true
  return (Date.now() - t) > thresholdMs
}

export default function Dashboard() {
  const [liveTrucks, setLiveTrucks] = React.useState([])
  const [isLiveLoading, setIsLiveLoading] = React.useState(false)
  const [liveError, setLiveError] = React.useState(null)
  const [destinations, setDestinations] = React.useState([]) // today's scheduled destinations

  React.useEffect(() => {
    let timer = null
    const load = async () => {
      try {
        setIsLiveLoading(true)
        setLiveError(null)
        const res = await fetch(`${buildApiUrl('live_trucks.php')}?since=300&limit=2`, {
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data?.success) {
          setLiveTrucks(Array.isArray(data.trucks) ? data.trucks : [])
        } else {
          setLiveError(data?.message || 'Failed to load live trucks')
        }
      } catch (e) {
        setLiveError(e.message || 'Network error')
      } finally {
        setIsLiveLoading(false)
        timer = setTimeout(load, 5000)
      }
    }
    load()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  // Load today's scheduled destination pins (barangay/collection points)
  React.useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const today = new Date().toISOString().slice(0,10)
        const res = await fetch(`${buildApiUrl('get_scheduled_routes.php')}?date=${today}`, {
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data?.success && Array.isArray(data.routes)) {
          const pins = data.routes
            .map(r => {
              const coord = Array.isArray(r.coordinates) && r.coordinates.length === 2 ? r.coordinates : null
              const lat = Number(r.latitude ?? (coord ? coord[0] : NaN))
              const lng = Number(r.longitude ?? (coord ? coord[1] : NaN))
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
              return {
                lat, lng,
                name: r.barangay || r.barangay_name || 'Destination',
                time: r.time || r.start_time || '',
              }
            })
            .filter(Boolean)
          setDestinations(pins)
        } else {
          setDestinations([])
        }
      } catch (_) {
        setDestinations([])
      }
    }
    fetchDestinations()
  }, [])
  return (
    <div className="max-w-full overflow-x-auto bg-emerald-50/40 min-h-screen font-sans">
      <div className="px-6 pb-6 mt-3">
        {/* Top: KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Total Collections', value: 100, hint: 'this month', icon: (
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v4H3z"/><path d="M5 7v14h14V7"/></svg>
            ) },
            { label: 'Completed Today', value: 20, hint: 'marked completed', icon: (
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            ) },
            { label: 'Total Requests', value: 45, hint: 'this month', icon: (
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            ) },
            { label: 'Recently Uploaded', value: 45, hint: 'this month', icon: (
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/></svg>
            ) },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-emerald-100 shadow-soft p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm text-emerald-900 font-semibold">{k.label}</div>
                {k.icon}
              </div>
              <div className="mt-1 text-4xl font-extrabold tracking-tight text-emerald-900">{k.value}</div>
              <div className="mt-1 text-[11px] text-emerald-700/70">{k.hint}</div>
            </div>
          ))}
        </div>

        {/* Middle: Full-width Live Map */}
        <div className="grid grid-cols-12 gap-4 xl:gap-6 items-start mb-4">
          <div className="col-span-12 bg-white rounded-lg border border-emerald-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-emerald-900 font-medium">Live Map</h2>
              <button onClick={() => window.location.reload()} className="text-xs px-2 py-1 rounded-md border border-emerald-100 text-emerald-700 hover:bg-emerald-50" title="Refresh">Refresh</button>
            </div>
            {liveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">{liveError}</div>
            )}
            <div className="h-96 rounded-md overflow-hidden border border-emerald-100">
              <MapContainer center={SIPOCOT_CENTER} zoom={13} className="h-full w-full" maxBounds={SIPOCOT_BOUNDS} minZoom={10} maxZoom={18}>
                <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://srtm.csi.cgiar.org/">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' />
                <Marker position={SIPOCOT_CENTER} icon={truckMarkerIcon(0.9)}>
                  <Popup>
                    <div className="p-2.5 text-center">
                      <h3 className="m-0 mb-1 text-green-800">Sipocot</h3>
                      <p className="m-0 text-gray-800">Camarines Sur</p>
                    </div>
                  </Popup>
                </Marker>
                {liveTrucks.map((t) => {
                  const stale = isStale(t.ts)
                  const opacity = stale ? 0.6 : 1
                  return (
                    <Marker key={`truck-${t.truck_id}`} position={[parseFloat(t.lat), parseFloat(t.lng)]} icon={truckMarkerIcon(1.05)} opacity={opacity}>
                      <Popup>
                        <div className="text-sm">
                          <div><strong>{t.plate || `Truck ${t.truck_id}`}</strong> {stale && <span className="text-xs text-gray-500">(Stale)</span>}</div>
                          <div>Driver: {t.driver || 'N/A'}</div>
                          <div>Speed: {t.speed ?? 0} km/h</div>
                          <div>Accuracy: {t.accuracy ?? '—'} m</div>
                          <div>Updated: {new Date(t.ts).toLocaleTimeString()}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
                {destinations.map((d, i) => (
                  <Marker key={`dest-${i}`} position={[d.lat, d.lng]} icon={truckMarkerIcon(0.75)}>
                    <Popup>
                      <div className="text-sm">
                        <div><strong>{d.name}</strong></div>
                        {d.time && (<div>Time: {String(d.time).slice(0,5)}</div>)}
                        <div>Lat/Lng: {d.lat.toFixed(5)}, {d.lng.toFixed(5)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <MapAutoFit trucks={liveTrucks} />
              </MapContainer>
            </div>
            {isLiveLoading && (<div className="mt-2 text-xs text-emerald-700/70">Loading live trucks…</div>)}
          </div>
        </div>

        {/* Bottom: Three blank containers */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({length:3}).map((_,i)=> (
            <div key={i} className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm h-56 flex items-center justify-center text-emerald-700/60 text-sm">Blank</div>
          ))}
        </div>
      </div>
    </div>
  )
}
