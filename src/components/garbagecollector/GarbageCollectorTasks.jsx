import React, { useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiMapPin,
  FiCalendar
} from 'react-icons/fi';

function formatPrettyDate(dateStr) {
  try { const d = new Date(dateStr); return d.toLocaleDateString(undefined, { month: 'long', day: '2-digit', year: 'numeric' }); } catch (_) { return dateStr; }
}

export default function GarbageCollectorTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'all'

  const userId = useMemo(() => {
    try { return localStorage.getItem('user_id') || localStorage.getItem('userId') || ''; } catch (_) { return ''; }
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`https://koletrash.systemproj.com/backend/api/get_personnel_schedule.php?user_id=${userId}&role=collector`);
        const data = await res.json();
        if (data.success) {
          const mapped = (data.schedules || []).map((s, idx) => {
            const status = (s.status || '').toLowerCase();
            const uiStatus = status === 'scheduled' ? 'in-progress' : status === 'completed' ? 'completed' : 'pending';
            return {
              id: s.schedule_id || idx,
              teamId: s.team_id,
              title: `${s.barangay || 'Route'} Route`,
              description: `Driver: ${s.driver_name || 'N/A'}`,
              priority: 'normal',
              status: uiStatus,
              dueTime: `${(s.time || '').slice(0,5)} - ${(s.end_time || '').slice(0,5)}`,
              location: s.barangay || '—',
              date: formatPrettyDate(s.date),
              truckPlate: s.truck_number || 'N/A',
              truckType: s.truck_model || 'N/A',
              truckCapacity: s.truck_capacity ?? null,
              teamStatus: s.team_status || 'pending',
              yourResponseStatus: s.your_response_status || 'pending',
              collectors: Array.isArray(s.collectors) ? s.collectors : [],
              rawDate: s.date
            };
          });
          setTasks(mapped);
        } else { setTasks([]); setError(data.message || 'Failed to load tasks'); }
      } catch (e) { setTasks([]); setError('Network error while loading tasks'); }
      finally { setLoading(false); }
    }
    if (userId) fetchTasks(); else { setLoading(false); setTasks([]); }
  }, [userId]);

  const acceptDecline = async (teamId, response) => {
    try {
      const res = await fetch('https://koletrash.systemproj.com/backend/api/respond_assignment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: teamId, user_id: userId, response_status: response, role: 'collector' })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.teamId === teamId ? { ...t, yourResponseStatus: response } : t));
      } else {
        alert(data.message || 'Failed to submit response');
      }
    } catch (_) {
      alert('Network error while submitting response');
    }
  };

  const filteredTasks = useMemo(() => {
    if (filterTab === 'all') return tasks;
    const todayStr = new Date().toISOString().slice(0,10);
    const isToday = (d) => (d || '').slice(0,10) === todayStr;
    if (filterTab === 'today') return tasks.filter(t => isToday(t.rawDate));
    return tasks.filter(t => !isToday(t.rawDate));
  }, [tasks, filterTab]);
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border border-red-100';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border border-amber-100';
      case 'normal':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
      default:
        return 'text-gray-700 bg-gray-50 border border-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border border-green-100';
      case 'in-progress':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
      case 'pending':
        return 'text-gray-700 bg-gray-50 border border-gray-100';
      default:
        return 'text-gray-700 bg-gray-50 border border-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">Tasks</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your daily collection tasks</p>
        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {['today','upcoming','all'].map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)} className={`px-3 py-1 rounded text-xs font-semibold border ${filterTab===tab?'bg-green-600 text-white border-green-600':'bg-white text-green-700 border-green-200'}`}>
              {tab === 'today' ? 'Today' : tab === 'upcoming' ? 'Upcoming' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && (<div className="text-sm text-gray-600">Loading tasks...</div>)}
      {error && !loading && (<div className="text-sm text-red-600">{error}</div>)}
      {!loading && !error && tasks.length === 0 && (<div className="text-sm text-gray-500">No tasks found.</div>)}

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                    <FiAlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {/* Truck details */}
                    <div className="text-xs text-gray-600 mt-1">
                      Truck: <span className="font-semibold">{task.truckPlate}</span> • Type: <span className="font-semibold">{task.truckType}</span>{task.truckCapacity!=null && <span> • Capacity: <span className="font-semibold">{task.truckCapacity}kg</span></span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiClock className="w-4 h-4" />
                    <span>{task.dueTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiMapPin className="w-4 h-4" />
                    <span>{task.location}</span>
                  </div>
                </div>

                {/* Team block */}
                <div className="mt-3 border border-emerald-100 rounded p-3 bg-emerald-50">
                  <div className="text-xs text-gray-500 mb-1">Team ID: <span className="font-semibold text-gray-700">{task.teamId}</span></div>
                  <div className="text-sm text-gray-800 mb-1">Collectors:</div>
                  <ul className="text-xs text-gray-700 list-disc pl-5">
                    {task.collectors.length === 0 && (<li className="list-none text-gray-400">No collectors listed</li>)}
                    {task.collectors.map((c, i) => (
                      <li key={i}>{c.username} — <span className="capitalize">{c.response_status || 'pending'}</span></li>
                    ))}
                  </ul>
                  {task.yourResponseStatus && (
                    <div className="mt-2 text-xs">Your status: <span className="font-semibold capitalize">{task.yourResponseStatus}</span>{(task.yourResponseStatus==='accepted' && task.teamStatus!=='accepted') && <span className="ml-2 text-yellow-700">(Pending from others)</span>}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                
                <div className="flex gap-2">
                  <button
                    disabled={task.yourResponseStatus==='accepted'}
                    onClick={() => acceptDecline(task.teamId, 'accepted')}
                    className={`px-3 py-2 rounded text-xs font-semibold border ${task.yourResponseStatus==='accepted'?'bg-gray-100 text-gray-400 border-gray-200':'bg-green-700 text-white border-green-700 hover:bg-green-800'}`}
                  >Accept</button>
                  <button
                    disabled={task.yourResponseStatus==='accepted'}
                    onClick={() => acceptDecline(task.teamId, 'declined')}
                    className={`px-3 py-2 rounded text-xs font-semibold border ${task.yourResponseStatus==='accepted'?'bg-gray-100 text-gray-400 border-gray-200':'bg-white text-red-700 border-red-300 hover:bg-red-50'}`}
                  >Decline</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
