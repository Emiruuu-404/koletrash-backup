import React, { useEffect, useState } from 'react';
import { FiMapPin, FiClock } from 'react-icons/fi';

const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api';

export default function GarbageCollectorRoutes() {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [stopsByRoute, setStopsByRoute] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // Resolve current user id (collector)
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
        if (userId) {
          url.searchParams.set('role', 'collector');
          url.searchParams.set('user_id', String(userId));
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load routes');
        setRoutes(data.routes || []);
      } catch (e) {
        setError(e.message);
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, []);

  const loadStops = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_route_details.php?id=${routeId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load details');
      const sorted = (data.route.stops || []).sort((a,b) => (a.seq||0)-(b.seq||0));
      setStopsByRoute(m => ({ ...m, [routeId]: sorted }));
    } catch (e) {
      // ignore
    }
  };

  const updateStopStatus = async (stopId, status, routeId) => {
    setUpdating(true);
    try {
      await fetch(`${API_BASE_URL}/update_stop_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: stopId, status })
      });
      await loadStops(routeId);
    } catch (e) {
      // noop
    } finally {
      setUpdating(false);
    }
  };

  const completeNextStop = async (routeId) => {
    const stops = stopsByRoute[routeId] || [];
    const next = stops.find(s => (s.status || 'pending') === 'pending');
    if (next) await updateStopStatus(next.id, 'visited', routeId);
  };

  // Status badge color using green palette emphasis
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-emerald-100 text-emerald-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Routes</h1>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>

      <div className="grid gap-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-green-50 rounded-lg shadow border border-green-100 px-6 py-4 overflow-hidden"
          >
            <div className="">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{route.barangay_name || 'Route'}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                    <FiClock className="w-4 h-4 text-green-700" />
                    <span>{route.date} {route.start_time?.slice(0,5)} - {route.end_time?.slice(0,5)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">—</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `0%` }} />
                </div>
              </div>

              {/* Areas */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Collection Areas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                    <FiMapPin className="w-4 h-4 text-green-700" />
                    <span className="text-sm text-gray-700">{route.barangay_name}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button className="px-4 py-2 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors" onClick={() => loadStops(route.id)}>
                  Load Stops
                </button>
                {stopsByRoute[route.id] && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" onClick={() => completeNextStop(route.id)} disabled={updating}>
                    Complete Next Stop
                  </button>
                )}
              </div>

              {stopsByRoute[route.id] && stopsByRoute[route.id].length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {stopsByRoute[route.id].filter(s => (s.status||'pending')==='visited').length}/{stopsByRoute[route.id].length} stops
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.round(100*(stopsByRoute[route.id].filter(s => (s.status||'pending')==='visited').length)/(stopsByRoute[route.id].length||1))}%` }} />
                  </div>
                  <div className="grid gap-2">
                    {stopsByRoute[route.id].map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-white/60 rounded">
                        <span>#{s.seq} {s.name || 'Stop'}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${ (s.status||'pending')==='visited' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{s.status || 'pending'}</span>
                          {(s.status||'pending')!=='visited' && (
                            <button className="px-2 py-1 bg-green-600 text-white rounded text-xs" onClick={() => updateStopStatus(s.id,'visited',route.id)} disabled={updating}>Mark Visited</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
