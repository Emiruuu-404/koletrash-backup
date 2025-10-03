import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
})

const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api'
const MAPBOX_TOKEN = (import.meta && import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || null

export default function RouteRun(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [stops, setStops] = React.useState([])
  const [routeName, setRouteName] = React.useState('')
  const [currentPos, setCurrentPos] = React.useState(null)
  const [status, setStatus] = React.useState('requesting')
  const [follow, setFollow] = React.useState(true)
  const watchIdRef = React.useRef(null)
  const lastSentRef = React.useRef(0)
  const [routeLine, setRouteLine] = React.useState([])
  const [routeLoading, setRouteLoading] = React.useState(false)
  const [routeError, setRouteError] = React.useState(null)
  const [targetStop, setTargetStop] = React.useState(null)
  const [routeSummary, setRouteSummary] = React.useState(null)
  const [routeSteps, setRouteSteps] = React.useState([])
  const [showAllSteps, setShowAllSteps] = React.useState(false)
  const [lastAction, setLastAction] = React.useState(null) // { stopId, prevStatus }
  const [showUndo, setShowUndo] = React.useState(false)
  const [showStatusModal, setShowStatusModal] = React.useState(false)
  const [statusChoice, setStatusChoice] = React.useState('pending')
  const [truckFull, setTruckFull] = React.useState(false)
  const [note, setNote] = React.useState('')
  const [landfillMode, setLandfillMode] = React.useState(false)
  const [resumeTarget, setResumeTarget] = React.useState(null) // remember where to return after landfill
  const MANTILA_COORDS = React.useMemo(() => ({ lat: 13.7817000, lng: 123.0203000 }), [])

  const MIN_INTERVAL_MS = 5000

  async function postLocation(coords){
    // Try to include driver_id as fallback
    let driverId = null
    try {
      driverId = Number(localStorage.getItem('user_id') || sessionStorage.getItem('user_id')) || null
      if (!driverId) {
        const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')
        driverId = Number(u?.user_id || u?.id)
      }
    } catch {}
    const url = driverId ? `${API_BASE_URL}/post_gps.php?driver_id=${driverId}` : `${API_BASE_URL}/post_gps.php`
    const payload = {
      lat: coords.latitude,
      lng: coords.longitude,
      speed: Number.isFinite(coords.speed) ? coords.speed : null,
      heading: Number.isFinite(coords.heading) ? coords.heading : null,
      accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
    }
    try {
      await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
    } catch {}
  }

  function formatDistance(m){
    if (!Number.isFinite(m)) return '—'
    if (m >= 1000) return (m/1000).toFixed(1) + ' km'
    return Math.round(m) + ' m'
  }
  function formatDuration(s){
    if (!Number.isFinite(s)) return '—'
    const m = Math.round(s/60)
    if (m >= 60) return `${Math.floor(m/60)}h ${m%60}m`
    return `${m} min`
  }

  async function fetchSuggestedRoute(here, dest){
    // Prefer Mapbox if token is set; fallback to OSRM demo
    try {
      if (MAPBOX_TOKEN) {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${here.lng},${here.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
        const r = await fetch(url)
        const j = await r.json()
        if (j?.routes?.length) {
          const route = j.routes[0]
          const coords = route.geometry?.coordinates || []
          const latlngs = coords.map(([lng, lat]) => [lat, lng])
          const steps = (route.legs?.[0]?.steps || []).map(s => ({
            name: s.name,
            distance: s.distance,
            duration: s.duration,
            maneuver: s.maneuver?.type,
            modifier: s.maneuver?.modifier,
            instruction: `${s.maneuver?.instruction || s.maneuver?.type || 'Continue'}`
          }))
          return { line: latlngs, summary: { distance: route.distance, duration: route.duration }, steps }
        }
        throw new Error(j?.message || 'No Mapbox route')
      }
    } catch (e) {
      // fallthrough to OSRM
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${here.lng},${here.lat};${dest.lng},${dest.lat}?overview=full&alternatives=false&steps=true&geometries=geojson&continue_straight=false&radiuses=1000;1000`
    const r = await fetch(osrmUrl)
    const j = await r.json()
    if (j?.code === 'Ok' && j?.routes?.length) {
      const route = j.routes[0]
      const coordsLine = route.geometry.coordinates || []
      const latlngs = coordsLine.map(([lng, lat]) => [lat, lng])
      const steps = (route.legs?.[0]?.steps || []).map(s => ({
        name: s.name,
        distance: s.distance,
        duration: s.duration,
        maneuver: s.maneuver?.type,
        modifier: s.maneuver?.modifier,
        instruction: `${s.maneuver?.type || 'Continue'}${s.maneuver?.modifier ? ' ' + s.maneuver.modifier : ''}${s.name ? ' onto ' + s.name : ''}`.trim()
      }))
      return { line: latlngs, summary: { distance: route.distance, duration: route.duration }, steps }
    }
    throw new Error(j?.message || j?.code || 'No OSRM route')
  }

  async function loadStops(routeId){
    try {
      const res = await fetch(`${API_BASE_URL}/get_route_details.php?id=${routeId}`)
      const data = await res.json()
      if (data?.success) {
        const ordered = (data.route.stops||[]).sort((a,b)=>(a.seq||0)-(b.seq||0))
        setStops(ordered)
        setRouteName(`${data.route.cluster_id || ''} ${data.route.barangay_name || ''}`.trim())
        // Initialize modal status to current DB status to avoid accidental overwrite
        const dbStatus = String(data.route.status || '').toLowerCase()
        if (dbStatus === 'in_progress') setStatusChoice('in_progress')
        else if (dbStatus === 'completed') setStatusChoice('completed')
        else setStatusChoice('pending') // map scheduled/others to pending option
      }
    } catch {}
  }

  React.useEffect(() => {
    // initial load
    loadStops(id)
  }, [id])

  React.useEffect(() => {
    if (!('geolocation' in navigator)) { setStatus('denied'); return }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setStatus('tracking')
        const now = Date.now()
        const coords = pos.coords
        const here = { lat: coords.latitude, lng: coords.longitude }
        setCurrentPos(here)
        if (now - lastSentRef.current >= MIN_INTERVAL_MS) {
          lastSentRef.current = now
          await postLocation(coords)
        }
        // Fetch suggested road route polyline + steps to the target stop (OSRM demo server)
        try {
          setRouteError(null)
          const dest = landfillMode
            ? { lat: MANTILA_COORDS.lat, lng: MANTILA_COORDS.lng }
            : (targetStop && targetStop.lat != null && targetStop.lng != null)
              ? { lat: parseFloat(targetStop.lat), lng: parseFloat(targetStop.lng) }
              : null
          if (dest) {
            setRouteLoading(true)
            const res = await fetchSuggestedRoute(here, dest)
            setRouteLine(res.line)
            setRouteSummary(res.summary)
            setRouteSteps(res.steps)
          }
        } catch (e) {
          setRouteError('routing failed')
          setRouteSummary(null)
          setRouteSteps([])
        } finally {
          setRouteLoading(false)
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current) }
  }, [])

  const positions = stops.filter(s => s.lat!=null && s.lng!=null).map(s => [parseFloat(s.lat), parseFloat(s.lng)])
  const startCenter = positions[0] || [13.7766, 122.9826]

  function FollowController({ position, enabled }){
    const map = useMap()
    React.useEffect(() => {
      if (!enabled || !position) return
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), { animate: true })
    }, [enabled, position, map])
    return null
  }

  // Choose target stop: next unvisited (fallback first)
  React.useEffect(() => {
    if (!stops || stops.length === 0) { setTargetStop(null); return }
    const next = stops.find(s => (s.status || 'pending') !== 'visited') || stops[0]
    if (next && next.lat != null && next.lng != null) setTargetStop(next)
    else setTargetStop(null)
  }, [stops])

  async function markVisited(stopId){
    try {
      // find previous status for undo
      const prev = stops.find(s => s.id === stopId)?.status || 'pending'
      // confirm prompt
      const ok = window.confirm('Mark this stop as visited?')
      if (!ok) return
      await fetch(`${API_BASE_URL}/update_stop_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: stopId, status: 'visited' })
      })
      await loadStops(id)
      // store action for undo
      setLastAction({ stopId, prevStatus: prev })
      setShowUndo(true)
      // auto-hide after 6s
      setTimeout(() => setShowUndo(false), 6000)
    } catch (e) {
      // ignore for now
    }
  }

  async function undoLast(){
    if (!lastAction) return
    try {
      await fetch(`${API_BASE_URL}/update_stop_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: lastAction.stopId, status: lastAction.prevStatus || 'pending' })
      })
      await loadStops(id)
    } catch(e) {
      // ignore
    } finally {
      setShowUndo(false)
      setLastAction(null)
    }
  }

  // Recompute suggested route whenever target or current position changes
  React.useEffect(() => {
    (async () => {
      const hasDest = landfillMode || !!targetStop
      if (!currentPos || !hasDest) return
      try {
        setRouteLoading(true)
        setRouteError(null)
        const dest = landfillMode
          ? { lat: MANTILA_COORDS.lat, lng: MANTILA_COORDS.lng }
          : { lat: parseFloat(targetStop.lat), lng: parseFloat(targetStop.lng) }
        const res = await fetchSuggestedRoute(currentPos, dest)
        setRouteLine(res.line)
        setRouteSummary(res.summary)
        setRouteSteps(res.steps)
      } catch (e) {
        setRouteError('routing failed')
        setRouteLine([])
        setRouteSummary(null)
        setRouteSteps([])
      } finally {
        setRouteLoading(false)
      }
    })()
  }, [targetStop, currentPos, landfillMode])

  return (
    <div className="fixed inset-0">
      <MapContainer center={startCenter} zoom={15} className="h-full w-full" style={{ zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        {positions.length>0 && (
          <Polyline positions={positions} color="#059669" weight={5} opacity={0.9} />
        )}
        {stops.map((s,i)=> (
          <Marker key={i} position={[parseFloat(s.lat), parseFloat(s.lng)]}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{s.name || `Stop ${s.seq}`}</div>
                <div className="text-gray-600">Seq: {s.seq}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {currentPos && (
          <Marker position={[currentPos.lat, currentPos.lng]}>
            <Popup>Current Location</Popup>
          </Marker>
        )}
        {routeLine.length > 1 ? (
          <>
            {/* Emerald green route line */}
            <Polyline positions={routeLine} color="#059669" weight={10} opacity={0.92} />
          </>
        ) : (
          currentPos && stops.length > 0 && stops[0].lat != null && stops[0].lng != null && (
            <Polyline
              positions={[[currentPos.lat, currentPos.lng], [parseFloat(stops[0].lat), parseFloat(stops[0].lng)]]}
              color="#059669"
              weight={6}
              opacity={0.95}
              dashArray="6,8"
            />
          )
        )}
        <FollowController position={currentPos} enabled={follow} />
      </MapContainer>

      {/* Overlay panel for stops + controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-50 w-[min(680px,92vw)] bg-white/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-base truncate flex items-center gap-2">
            <span>{routeName || 'Route'}</span>
            {landfillMode && (
              <span className="px-2 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 border border-amber-200">Landfill</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded" onClick={()=>setTargetStop(stops.find(s => (s.status||'pending')!=='visited') || stops[0])}>Re-route</button>
            <button className={`px-2 py-1 text-xs rounded ${follow ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`} onClick={()=>setFollow(v=>!v)}>
              {follow ? 'Following' : 'Follow'}
            </button>
              {/* When in landfill mode, offer resume button */}
              {landfillMode ? (
                <button
                  className="px-3 py-1.5 text-xs rounded-full border border-amber-500 text-amber-700 bg-white hover:bg-amber-50"
                  onClick={async ()=>{
                    try {
                      // Log event for auditing
                      await fetch(`${API_BASE_URL}/log_task_event.php`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ assignment_id: null, event_type: 'truck_emptied', after: { route_id: id } })
                      }).catch(()=>{})
                    } catch {}
                    // Exit landfill mode and return to saved or next stop
                    setLandfillMode(false)
                    if (resumeTarget && resumeTarget.lat != null && resumeTarget.lng != null) {
                      setTargetStop(resumeTarget)
                    } else {
                      const next = stops.find(s => (s.status || 'pending') !== 'visited') || stops[0]
                      if (next) setTargetStop(next)
                    }
                  }}
                >Resume route</button>
              ) : (
                <button className="px-2 py-1 text-xs bg-gray-200 rounded" onClick={()=>navigate(-1)}>Back</button>
              )}
          </div>
        </div>
        <div className="text-[11px] text-gray-700 mb-2">
          {status === 'requesting' && 'Requesting location…'}
          {status === 'tracking' && currentPos && `You: ${currentPos.lat.toFixed(6)}, ${currentPos.lng.toFixed(6)}`}
          {status === 'denied' && 'Location permission denied'}
          {routeLoading && ' • Routing…'}
          {routeError && ` • Route error: ${routeError}`}
          {landfillMode && ' • Landfill mode: Routing to Mantila'}
        </div>
        {routeSummary && (
          <div className="text-xs text-gray-800 mb-2">{formatDistance(routeSummary.distance)} • {formatDuration(routeSummary.duration)}</div>
        )}
        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
            <span>Progress</span>
            <span>{(stops.filter(s => (s.status||'pending')==='visited').length)}/{stops.length} stops</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${stops.length ? Math.round(100*stops.filter(s => (s.status||'pending')==='visited').length/stops.length) : 0}%` }} />
          </div>
        </div>

        <ol className="space-y-2 text-sm max-h-[40vh] overflow-auto pr-1">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 mt-2 rounded-full bg-green-500 inline-block"></span>
            <div>
              <div className="font-medium">Current Location</div>
              {currentPos && <div className="text-gray-600 text-xs">{currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}</div>}
            </div>
          </li>
          {/* Directions removed - showing only current location and stops */}
          {stops.map((s,i)=> {
            const visited = (s.status||'pending')==='visited'
            return (
              <li key={i} className="flex items-start gap-2">
                <span className={`w-2 h-2 mt-2 rounded-full inline-block ${visited ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                <div className="flex-1">
                  <div className="font-medium">{s.name || `Stop ${s.seq}`}</div>
                  <div className="text-gray-600 text-xs">Seq {s.seq} • {visited ? 'Visited' : 'Pending'}</div>
                </div>
                <button
                  className={`ml-2 px-2 py-1 text-xs rounded ${visited ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white'}`}
                  onClick={() => !visited && markVisited(s.id)}
                  disabled={visited}
                >
                  {visited ? 'Done' : 'Mark visited'}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded text-sm"
            onClick={()=> setShowStatusModal(true)}
          >Submit</button>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded text-sm"
            onClick={async ()=>{
              const ok = window.confirm('End route and submit summary?')
              if (!ok) return
              try {
                if (watchIdRef.current != null) {
                  navigator.geolocation.clearWatch(watchIdRef.current)
                  watchIdRef.current = null
                }
                const total = stops.length
                const done = stops.filter(s => (s.status||'pending')==='visited').length
                await fetch(`${API_BASE_URL}/log_task_event.php`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ assignment_id: null, event_type: 'route_submitted', after: { route_id: id, total_stops: total, visited: done } })
                }).catch(()=>{})
                alert('Route submitted. Thank you!')
                navigate('/truckdriver')
              } catch(e) {
                alert('Failed to submit, but tracking has been stopped.')
                navigate('/truckdriver')
              }
            }}
          >End Route</button>
        </div>
      </div>

      {showUndo && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-50 bg-black/70 text-white text-sm px-3 py-2 rounded shadow">
          <span>Marked visited.</span>
          <button className="ml-3 underline" onClick={undoLast}>Undo</button>
        </div>
      )}

      {showStatusModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>setShowStatusModal(false)}>
          <div className="bg-white rounded-xl shadow-lg w-[min(520px,92vw)] p-5" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Status</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="route_status" value="pending" checked={statusChoice==='pending'} onChange={()=>setStatusChoice('pending')} />
                <span>Pending</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="route_status" value="in_progress" checked={statusChoice==='in_progress'} onChange={()=>setStatusChoice('in_progress')} />
                <span>In Progress</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="route_status" value="completed" checked={statusChoice==='completed'} onChange={()=>setStatusChoice('completed')} />
                <span>Completed</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={truckFull} onChange={e=>setTruckFull(e.target.checked)} />
                <span>Truck is full (heading to landfill)</span>
              </label>
              <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows="2" placeholder="Optional note" value={note} onChange={e=>setNote(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm" onClick={()=>setShowStatusModal(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" onClick={async ()=>{
                try{
                  const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || null
                  await fetch(`${API_BASE_URL}/update_route_status.php`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ route_id: Number(id), status: statusChoice, truck_full: truckFull, note, user_id: userId })
                  })
                  alert('Status updated')
                  setShowStatusModal(false)
                  // If truck is full, enter landfill mode to Mantila
                  if (truckFull) {
                    // remember current target to resume later
                    setResumeTarget(targetStop)
                    setLandfillMode(true)
                  } else {
                    setLandfillMode(false)
                  }
                } catch(e){
                  alert('Failed to update status')
                }
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

