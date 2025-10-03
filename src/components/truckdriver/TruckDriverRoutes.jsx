import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiClock,
  FiCalendar,
  FiTruck
} from 'react-icons/fi';

const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api';

export default function TruckDriverRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stopsByRoute, setStopsByRoute] = useState({});
  const [updating, setUpdating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [permission, setPermission] = useState('idle'); // idle | requesting | granted | denied
  const [lastSentAt, setLastSentAt] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const watchIdRef = React.useRef(null);
  const lastSentRef = React.useRef(0);
  const lastCoordsRef = React.useRef(null);

  const MIN_INTERVAL_MS = 5000; // 5s
  const MIN_DISTANCE_M = 20; // 20 meters

  function haversineMeters(a, b){
    if (!a || !b) return Infinity;
    const R = 6371000; // meters
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  async function postLocation(coords){
    // Try to resolve driver id from storage as a fallback when session is not available
    const getDriverId = () => {
      try {
        const direct = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        if (direct && Number(direct)) return Number(direct);
        const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userJson) {
          const u = JSON.parse(userJson);
          return Number(u?.user_id || u?.id);
        }
      } catch {}
      return null;
    };
    const driverId = getDriverId();
    const url = driverId ? `${API_BASE_URL}/post_gps.php?driver_id=${driverId}` : `${API_BASE_URL}/post_gps.php`;
    const payload = {
      lat: coords.latitude,
      lng: coords.longitude,
      speed: Number.isFinite(coords.speed) ? coords.speed : null,
      heading: Number.isFinite(coords.heading) ? coords.heading : null,
      accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      await res.json().catch(()=>({}));
      setLastSentAt(new Date());
    } catch (e) {
      // ignore transient network errors
    }
  }

  function startTracking(){
    if (!('geolocation' in navigator)) { setPermission('denied'); return; }
    setPermission('requesting');
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setPermission('granted');
        const now = Date.now();
        const coords = pos.coords;
        const here = { lat: coords.latitude, lng: coords.longitude };
        setCurrentPos(here);
        const last = lastCoordsRef.current;
        const moved = haversineMeters(last && { lat:last.lat, lng:last.lng }, here);
        const shouldSend = (now - lastSentRef.current) >= MIN_INTERVAL_MS || moved >= MIN_DISTANCE_M;
        if (shouldSend) {
          lastSentRef.current = now;
          lastCoordsRef.current = here;
          await postLocation(coords);
        }
      },
      () => { setPermission('denied'); },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setTracking(true);
  }

  function stopTracking(){
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError('');
      try {
        // Resolve current user id (driver)
        let userId = null;
        try {
          const direct = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
          if (direct && Number(direct)) userId = Number(direct);
          if (!userId) {
            const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userJson) {
              const u = JSON.parse(userJson);
              userId = Number(u?.user_id || u?.id) || null;
            }
          }
        } catch {}
        const url = new URL(`${API_BASE_URL}/get_routes.php`);
        url.searchParams.set('date', date);
        if (userId) {
          url.searchParams.set('role', 'driver');
          url.searchParams.set('user_id', String(userId));
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load routes');
        setRoutes(data.routes || []);
      } catch (e) {
        setError(e.message);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [date]);

  const loadStops = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_route_details.php?id=${routeId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load details');
      const sorted = (data.route.stops || []).sort((a,b) => (a.seq||0)-(b.seq||0));
      setStopsByRoute((m) => ({ ...m, [routeId]: sorted }));
    } catch (e) {
      // ignore
    }
  };

  const updateStopStatus = async (stopId, status) => {
    setUpdating(true);
    try {
      await fetch(`${API_BASE_URL}/update_stop_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: stopId, status })
      });
      // refresh the route containing this stop
      const routeId = selectedRoute;
      if (routeId) await loadStops(routeId);
    } catch (e) {
      // noop
    } finally {
      setUpdating(false);
    }
  };

  const completeNextStop = async (routeId) => {
    if (!stopsByRoute[routeId]) return;
    const next = stopsByRoute[routeId].find(s => (s.status || 'pending') === 'pending');
    if (next) await updateStopStatus(next.id, 'visited');
  };
  
  // Prepare routes for display
  const getDisplayRoutes = () => {
    let prepared = routes.map(r => ({
      id: r.id,
      name: `${r.cluster_id || ''} ${r.barangay_name || ''}`.trim(),
      description: `${r.date} ${r.start_time ? String(r.start_time).slice(0,5) : ''}-${r.end_time ? String(r.end_time).slice(0,5) : ''}`,
      barangays: [],
      schedule: r.date,
      startTime: r.start_time,
      estimatedDuration: '',
      status: r.status,
      type: 'Daily Route',
      coverage: '',
      team_id: r.team_id,
      plate_num: r.plate_num
    }));

    return prepared;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Routes</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
          />
          <button
            className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded"
            onClick={()=>setDate(new Date().toISOString().split('T')[0])}
          >Today</button>
          <button
            className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded"
            onClick={()=>{
              const d = new Date();
              d.setDate(d.getDate()-1);
              setDate(d.toISOString().split('T')[0]);
            }}
          >Yesterday</button>
        </div>
      </div>
      <div className="space-y-4">
        {loading && (
          <div className="text-gray-500">Loading…</div>
        )}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        {getDisplayRoutes().map((route) => (
            <div
              key={route.id}
              className={`bg-green-50 rounded-lg shadow border border-green-100 px-6 py-4 hover:shadow-xl transition-shadow cursor-pointer ${
                selectedRoute === route.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => { setSelectedRoute(route.id); if (!stopsByRoute[route.id]) loadStops(route.id); }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{route.name}</h3>
                  <p className="text-gray-600 text-sm">{route.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-green-700" />
                  <span>{(stopsByRoute[route.id]?.length || 0)} stops</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-green-700" />
                  <span>{route.estimatedDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-green-700" />
                  <span>{route.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTruck className="text-green-700" />
                  <span>{route.plate_num || 'Unassigned'}</span>
                </div>
              </div>
              {stopsByRoute[route.id] && stopsByRoute[route.id].length > 0 && (
                <div className="mt-4 p-2 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Stops:</h4>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {stopsByRoute[route.id].filter(s => (s.status||'pending')==='visited').length}/{stopsByRoute[route.id].length} stops
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.round(100*(stopsByRoute[route.id].filter(s => (s.status||'pending')==='visited').length)/(stopsByRoute[route.id].length||1))}%` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    {!tracking ? (
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-xs" onClick={() => { startTracking(); if (route.id) navigate(`/truckdriver/route/${route.id}`); }}>Start</button>
                    ) : (
                      <button className="px-3 py-1 bg-red-600 text-white rounded text-xs" onClick={stopTracking}>Stop</button>
                    )}
                    <div className="text-xs text-gray-600">
                      {permission === 'requesting' && 'Requesting location…'}
                      {permission === 'granted' && (lastSentAt ? `Last sent: ${lastSentAt.toLocaleTimeString()}` : 'Tracking…')}
                      {permission === 'denied' && 'Location permission denied'}
                    </div>
                  </div>
                  {currentPos && (
                    <div className="mt-2 text-xs text-gray-500">You: {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}</div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
