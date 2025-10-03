import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiClock, FiTruck, FiMap } from 'react-icons/fi';
import { GiTrashCan } from 'react-icons/gi';

// Helper to format date like "May 05, 2025"
function formatPrettyDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'long', day: '2-digit', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

const statusMap = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function TruckDriverTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'all'

  const userId = useMemo(() => {
    try {
      return localStorage.getItem('user_id') || localStorage.getItem('userId') || '';
    } catch (_) { return ''; }
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://koletrash.systemproj.com/backend/api/get_personnel_schedule.php?user_id=${userId}&role=driver`);
        const data = await res.json();
        if (data.success) {
          const mapped = (data.schedules || []).map((s, idx) => {
            const status = (s.status || '').toLowerCase();
            const uiStatus = status === 'scheduled' ? 'in-progress' : status === 'completed' ? 'completed' : 'pending';
            return {
              id: s.schedule_id || idx,
              teamId: s.team_id,
              route: `${s.barangay || 'Route'}`,
              date: formatPrettyDate(s.date),
              time: `${(s.time || '').slice(0,5)} - ${(s.end_time || '').slice(0,5)}`,
              vehicle: s.truck_number || 'N/A',
              truckType: s.truck_model || 'N/A',
              truckCapacity: s.truck_capacity ?? null,
              wasteType: 'RESIDUAL WASTE',
              status: uiStatus,
              teamStatus: s.team_status || 'pending',
              yourResponseStatus: s.your_response_status || 'pending',
              collectors: Array.isArray(s.collectors) ? s.collectors : [],
              rawDate: s.date,
            };
          });
          setTasks(mapped);
        } else {
          setTasks([]);
          setError(data.message || 'Failed to load tasks');
        }
      } catch (e) {
        setError('Network error while loading tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchTasks();
    else { setLoading(false); setTasks([]); }
  }, [userId]);

  const acceptDecline = async (teamId, response) => {
    try {
      const res = await fetch('https://koletrash.systemproj.com/backend/api/respond_assignment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: teamId, user_id: userId, response_status: response, role: 'driver' })
      });
      const data = await res.json();
      if (data.success) {
        // reflect instantly
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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center py-6 px-2">
      <div className="w-full max-w-lg">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 pl-1">ASSIGN TASK</h1>
        <p className="text-sm text-gray-600 mb-4 pl-1">Welcome, Truck Driver</p>
        {/* Filters */}
        <div className="flex gap-2 mb-4 pl-1">
          {['today','upcoming','all'].map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)} className={`px-3 py-1 rounded text-xs font-semibold border ${filterTab===tab?'bg-green-600 text-white border-green-600':'bg-white text-green-700 border-green-200'}`}>
              {tab === 'today' ? 'Today' : tab === 'upcoming' ? 'Upcoming' : 'All'}
            </button>
          ))}
        </div>
        {loading && (
          <div className="text-sm text-gray-600 pl-1">Loading tasks...</div>
        )}
        {error && !loading && (
          <div className="text-sm text-red-600 pl-1">{error}</div>
        )}
        {!loading && !error && tasks.length === 0 && (
          <div className="text-sm text-gray-500 pl-1">No tasks found.</div>
        )}
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-green-100 bg-white shadow-sm overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-100">
                <div className="font-semibold text-green-900">{task.route}</div>
                <a href="#" className="text-green-700 text-xs font-semibold hover:underline">View Route</a>
              </div>
              {/* Content */}
              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2"><FiCalendar className="w-4 h-4 text-green-700" /><span className="font-medium text-gray-800">{task.date}</span></div>
                    <div className="flex items-center gap-2"><FiClock className="w-4 h-4 text-green-700" /><span className="font-medium text-gray-800">{task.time}</span></div>
                    <div className="flex items-center gap-2"><FiTruck className="w-4 h-4 text-green-700" /><span className="font-medium text-gray-800">{task.vehicle}</span></div>
                    <div className="flex items-center gap-2"><GiTrashCan className="w-4 h-4 text-green-700" /><span className="font-medium text-gray-800">{task.wasteType}</span></div>
                  </div>
                  <div className="text-xs text-gray-600">Truck Type: <span className="font-semibold">{task.truckType}</span>{task.truckCapacity!=null && <span> • Capacity: <span className="font-semibold">{task.truckCapacity}kg</span></span>}</div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMap[task.status]?.color || 'bg-gray-100 text-gray-700'}`}>Remarks: {statusMap[task.status]?.label || 'Unknown'}</span>
                  </div>
                </div>
                {/* Team card */}
                <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                  <div className="text-xs text-gray-500 mb-1">Team ID: <span className="font-semibold text-gray-700">{task.teamId}</span></div>
                  <div className="text-sm text-gray-800 mb-1">Collectors</div>
                  <ul className="text-xs text-gray-700 list-disc pl-5">
                    {task.collectors.length === 0 && (<li className="list-none text-gray-400">No collectors listed</li>)}
                    {task.collectors.map((c, i) => (<li key={i}>{c.username} — <span className="capitalize">{c.response_status || 'pending'}</span></li>))}
                  </ul>
                  {task.yourResponseStatus && (
                    <div className="mt-2 text-xs">Your status: <span className="font-semibold capitalize">{task.yourResponseStatus}</span>{(task.yourResponseStatus==='accepted' && task.teamStatus!=='accepted') && <span className="ml-2 text-yellow-700">(Pending from others)</span>}</div>
                  )}
                </div>
              </div>
              {/* Actions bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-t border-green-100 bg-white">
                <button disabled={task.yourResponseStatus==='accepted'} onClick={() => acceptDecline(task.teamId, 'accepted')} className={`px-3 py-1.5 rounded text-xs font-semibold border ${task.yourResponseStatus==='accepted'?'bg-gray-100 text-gray-400 border-gray-200':'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}>Accept</button>
                <button disabled={task.yourResponseStatus==='accepted'} onClick={() => acceptDecline(task.teamId, 'declined')} className={`px-3 py-1.5 rounded text-xs font-semibold border ${task.yourResponseStatus==='accepted'?'bg-gray-100 text-gray-400 border-gray-200':'bg-white text-red-700 border-red-300 hover:bg-red-50'}`}>Decline</button>
                <button className="ml-auto px-3 py-1.5 rounded text-xs font-semibold border border-green-200 text-green-800 hover:bg-green-50">History</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
