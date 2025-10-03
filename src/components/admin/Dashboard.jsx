import { Bar, Pie } from 'react-chartjs-2'
import React from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

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

const barData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Collections',
      data: [12, 18, 3, 4, 2, 4, 9],
      backgroundColor: ENV_COLORS.primary,
      borderColor: ENV_COLORS.secondary,
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    },
  ],
}

const pieData = {
  labels: ['Completed', 'In Progress', 'Delayed'],
  datasets: [
    {
      data: [70, 15, 15],
      backgroundColor: [ENV_COLORS.primary, ENV_COLORS.secondary, ENV_COLORS.accent],
      borderColor: ENV_COLORS.white,
      borderWidth: 2,
      hoverBorderColor: ENV_COLORS.light,
      hoverBorderWidth: 3,
    },
  ],
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

// Backend API base
const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api' // Replace koletrash.systemproj.com with your actual Hostinger domain

// Simple colored truck icon (supports dimming via opacity)
const truckIcon = (color, opacity = 1) => L.divIcon({
  html: `<div style="background:${color};opacity:${opacity};width:28px;height:20px;border-radius:6px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">🚛</div>`,
  className: 'truck-marker',
  iconSize: [28, 20],
  iconAnchor: [14, 10]
})

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

  React.useEffect(() => {
    let timer = null
    const load = async () => {
      try {
        setIsLiveLoading(true)
        setLiveError(null)
        const res = await fetch(`${API_BASE_URL}/live_trucks.php?since=300&limit=2`)
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
  return (
    <div className="p-6 max-w-full overflow-x-auto bg-emerald-50 min-h-screen font-sans">
      <div className="mb-4">
        <h1 className="text-3xl text-green-800 mb-1 font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-base text-gray-600 m-0">Track operations and monitor activities</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 my-5">
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Total Collections</div>
              <div className="text-3xl font-semibold text-green-900 mt-0.5">100</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Completed Today</div>
              <div className="text-3xl font-semibold text-green-900 mt-0.5">20</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 13l4 4L19 7"/></svg>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Delayed</div>
              <div className="text-3xl font-semibold text-red-600 mt-0.5">12</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/></svg>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Active Trucks</div>
              <div className="text-3xl font-semibold text-green-900 mt-0.5">2</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="6" rx="1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="mt-6">
        <div className="bg-white rounded-md border border-gray-200 p-4">
          <h2 className="text-lg mb-3 text-green-900 font-medium">Live Map</h2>
          {liveError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{liveError}</div>
          )}
          <div className="h-96 rounded-sm overflow-hidden border border-gray-200">
            <MapContainer
              center={SIPOCOT_CENTER}
              zoom={13}
              className="h-full w-full"
              maxBounds={SIPOCOT_BOUNDS}
              minZoom={10}
              maxZoom={18}
            >
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://srtm.csi.cgiar.org/">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
              />
              <Marker position={SIPOCOT_CENTER}>
                <Popup>
                  <div className="p-2.5 text-center">
                    <h3 className="m-0 mb-1 text-green-800">Sipocot</h3>
                    <p className="m-0 text-gray-800">Camarines Sur</p>
                  </div>
                </Popup>
              </Marker>

              {/* Live trucks (up to two) with stale dimming */}
              {liveTrucks.map((t, idx) => {
                const stale = isStale(t.ts)
                const baseColor = idx === 0 ? '#10b981' : '#f59e0b'
                const markerColor = stale ? '#9ca3af' : baseColor
                const opacity = stale ? 0.6 : 1
                return (
                  <Marker key={`truck-${t.truck_id}`} position={[parseFloat(t.lat), parseFloat(t.lng)]} icon={truckIcon(markerColor, opacity)}>
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

              {/* Auto-fit to include available trucks */}
              <MapAutoFit trucks={liveTrucks} />
            </MapContainer>
          </div>
          {isLiveLoading && (
            <div className="mt-2 text-xs text-gray-600">Loading live trucks…</div>
          )}
          {/* Legend */}
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded-sm" style={{ background:'#10b981' }}></span> Truck 1</div>
              <div className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded-sm" style={{ background:'#f59e0b' }}></span> Truck 2</div>
                <div className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded-sm" style={{ background:'#9ca3af' }}></span> Stale (&gt; 60s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
        <div className="bg-white rounded-md border border-gray-200 p-4 h-96">
          <h2 className="text-lg mb-3 text-green-900 font-medium">Weekly Collection Stats</h2>
          <div className="h-80">
            <Bar data={barData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#ffffff',
                  titleColor: '#2c3e50',
                  bodyColor: '#2c3e50',
                  borderColor: '#e8f5e8',
                  borderWidth: 1,
                  cornerRadius: 6,
                  displayColors: false,
                  titleFont: { size: 13, weight: '500' },
                  bodyFont: { size: 12 }
                }
              },
              scales: { 
                y: { 
                  beginAtZero: true, 
                  ticks: { 
                    stepSize: 4,
                    color: '#7f8c8d',
                    font: { size: 12 }
                  },
                  grid: {
                    color: '#e8f5e8',
                    lineWidth: 1
                  },
                  border: {
                    color: '#e8f5e8'
                  }
                },
                x: {
                  ticks: {
                    color: '#7f8c8d',
                    font: { size: 12 }
                  },
                  grid: {
                    color: '#e8f5e8',
                    lineWidth: 1
                  },
                  border: {
                    color: '#e8f5e8'
                  }
                }
              },
            }} />
          </div>
        </div>
        
        <div className="bg-white rounded-md border border-gray-200 p-4 h-96">
          <h2 className="text-lg mb-3 text-green-900 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 11V7a4 4 0 118 0v4M5 13v-2a4 4 0 118 0v2" />
            </svg>
            Collection Status Distribution
          </h2>
          <div className="h-80">
            <Pie data={pieData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: {
                    color: '#2c3e50',
                    font: { size: 11 },
                    padding: 8,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    generateLabels: (chart) => [
                      { text: 'Completed', fillStyle: '#2d5016' },
                      { text: 'In Progress', fillStyle: '#4a7c59' },
                      { text: 'Delayed', fillStyle: '#8fbc8f' },
                    ],
                  },
                },
                tooltip: {
                  backgroundColor: '#ffffff',
                  titleColor: '#2c3e50',
                  bodyColor: '#2c3e50',
                  borderColor: '#e8f5e8',
                  borderWidth: 1,
                  cornerRadius: 6,
                  displayColors: true,
                  titleFont: { size: 13, weight: '500' },
                  bodyFont: { size: 12 }
                }
              },
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
