import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../../config/api.js';

const trucks = ['Truck 1', 'Truck 2'];

// Define the time slots for the grid (6:00 to 17:00, every 30 minutes)
const timeSlots = [];
for (let hour = 6; hour <= 17; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour !== 17) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
}

// Build a stable unique id for a schedule record
const computeScheduleId = (s) => {
  const numId = s?.schedule_template_id || s?.id || s?.schedule_id || s?.predefined_id;
  if (numId !== undefined && numId !== null && String(numId).trim() !== '') {
    return String(numId);
  }
  // Fallback to composite natural key
  const parts = [
    s?.barangay_id ?? 'b',
    s?.schedule_type ?? 't',
    s?.cluster_id ?? 'c',
    s?.day_of_week ?? 'd',
    (s?.start_time || '').substring(0,5)
  ];
  return parts.join('|');
};

export default function ManageSchedule() {
  const [selectedTruck, setSelectedTruck] = useState('Truck 1');
  const [selectedCluster, setSelectedCluster] = useState('2C-CA'); // Default to Cluster A
  const [predefinedSchedules, setPredefinedSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(null);
  const [barangayList, setBarangayList] = useState([]);
  const [clusterList, setClusterList] = useState([]);

  // Helper function to get auth token
  const getAuthToken = () => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };
  // Set initial date to the current date (current month/week)
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Inline edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({ day_of_week: '', start_time: '', end_time: '', week_of_month: '' });
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  // Add schedule modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({ date: '', start_time: '', end_time: '', barangay_id: '' });

  // Ctrl-based multi-select state
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toggleSelected = (id) => {
    if (!id) return; // guard
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelected = () => setSelectedIds(new Set());
  const selectedCount = selectedIds.size;
  const selectedArray = Array.from(selectedIds);

  // Track Ctrl/Meta key
  useEffect(() => {
    const down = (e) => {
      if (e.ctrlKey || e.key === 'Control' || e.metaKey) setCtrlPressed(true);
    };
    const up = (e) => {
      if (!e.ctrlKey && !e.metaKey) setCtrlPressed(false);
      if (e.key === 'Control' && !e.metaKey) setCtrlPressed(false);
    };
    const onBlur = () => setCtrlPressed(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Get the start of the current week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate days for the current week
  const generateDays = (weekStart) => {
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) { // Monday to Sunday
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        day: dayNames[i],
        date: date.getDate(),
        fullDate: date
      });
    }
    return days;
  };

  const days = generateDays(getWeekStart(currentWeek));

  // Get week-of-month number (1-5) for a given date
  const getWeekOfMonth = (date) => {
    const d = new Date(date);
    const dayOfMonth = d.getDate();
    return Math.ceil(dayOfMonth / 7);
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date()); // Go to current week
  };

  // Format month and year for display
  const formatMonthYear = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]}, ${date.getFullYear()}`;
  };


  // Fetch predefined schedules from backend (filtered)
  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const weekNumber = getWeekOfMonth(getWeekStart(currentWeek));
      const isTruck1 = selectedTruck === 'Truck 1';
      const params = new URLSearchParams();
      
      // Fetch all schedule types: daily_priority, fixed_days, and weekly_cluster
      // We'll filter them in getFilteredSchedules based on truck selection
      if (isTruck1) {
        // For Truck 1, fetch daily_priority and fixed_days
        params.set('schedule_type', 'daily_priority,fixed_days');
      } else {
        // For Truck 2, fetch weekly_cluster
        params.set('schedule_type', 'weekly_cluster');
        params.set('cluster_id', selectedCluster);
        params.set('week_of_month', String(weekNumber));
      }
      // Limit to visible days (Monday to Sunday)
      params.set('days', ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].join(','));
      const url = `${buildApiUrl('get_predefined_schedules.php')}?${params.toString()}`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setPredefinedSchedules(Array.isArray(data.schedules) ? data.schedules : []);
        setSchedulesError(null);
      } else {
        setPredefinedSchedules([]);
        setSchedulesError(data.message || 'Failed to fetch predefined schedules.');
      }
    } catch (err) {
      setPredefinedSchedules([]);
      setSchedulesError('Failed to fetch predefined schedules.');
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTruck, selectedCluster, currentWeek]);

  // Fetch barangays for mapping
  useEffect(() => {
    fetch(buildApiUrl('get_barangays.php'), {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBarangayList(Array.isArray(data.barangays) ? data.barangays : []);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch barangays:', err);
      });
  }, []);

  // Fetch clusters
  useEffect(() => {
    fetch(buildApiUrl('get_clusters.php'), {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClusterList(Array.isArray(data.clusters) ? data.clusters : []);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch clusters:', err);
      });
  }, []);

  // Filter schedules based on truck selection
  const getFilteredSchedules = () => {
    if (selectedTruck === 'Truck 1') {
      // Truck 1: Show priority barangays (cluster_id = 1C-PB) with daily_priority or fixed_days schedule types
      return predefinedSchedules.filter(schedule => 
        schedule.cluster_id === '1C-PB' && 
        (schedule.schedule_type === 'daily_priority' || schedule.schedule_type === 'fixed_days')
      );
    } else {
      // Truck 2: Show clustered barangays based on selected cluster
      const weekNumber = getWeekOfMonth(getWeekStart(currentWeek));
      const filtered = predefinedSchedules.filter(schedule => (
        schedule.cluster_id === selectedCluster &&
        schedule.schedule_type === 'weekly_cluster' &&
        Number(schedule.week_of_month) === Number(weekNumber)
      ));
      return filtered;
    }
  };

  const filteredSchedules = getFilteredSchedules();

  // Build a map: { 'Mon-6:00': [event, ...], ... }
  const eventMap = {};
  
  // Add predefined schedule data
  filteredSchedules.forEach(schedule => {
    const dayName = schedule.day_of_week.substring(0, 3); // Mon, Tue, etc.
    const startTime = schedule.start_time.substring(0, 5); // Get HH:MM part
    const timeKey = `${dayName}-${startTime}`;
    
    if (!eventMap[timeKey]) eventMap[timeKey] = [];
    
    // Check if schedule is new (created within last 7 days)
    const isNew = (createdAt) => {
      if (!createdAt) return false;
      const created = new Date(createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    };
    
    // Create event object for predefined schedule
    const predefinedEvent = {
      label: schedule.barangay_name,
      time: schedule.start_time,
      end: schedule.end_time,
      // Green for daily_priority and fixed_days, blue for weekly_cluster
      color: schedule.schedule_type === 'weekly_cluster' 
        ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
        : 'bg-gradient-to-br from-green-100 to-emerald-100',
      border: schedule.schedule_type === 'weekly_cluster' 
        ? 'border-l-4 border-blue-500 shadow-blue-200' 
        : 'border-l-4 border-green-500 shadow-green-200',
      text: schedule.schedule_type === 'weekly_cluster' ? 'text-blue-900' : 'text-green-900',
      shadow: schedule.schedule_type === 'weekly_cluster' ? 'shadow-md shadow-blue-200/50' : 'shadow-md shadow-green-200/50',
      isNew: isNew(schedule.created_at),
      badgeColor: schedule.schedule_type === 'weekly_cluster' 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
        : 'bg-gradient-to-r from-emerald-500 to-green-600',
      isPredefinedSchedule: true,
      scheduleType: schedule.schedule_type,
      weekOfMonth: schedule.week_of_month,
      barangayId: schedule.barangay_id,
      updatedAt: schedule.updated_at,
      createdAt: schedule.created_at,
      id: computeScheduleId(schedule),
      schedule
    };
    
    eventMap[timeKey].push(predefinedEvent);
  });

  // Improved grid sizing for better readability
  const colWidth = '150px'; // Reduced from 200px to fit 7 days better
  const rowHeight = 80;
  const eventWidth = '140px'; // Reduced to match smaller column
  const eventHeight = 65; // Slightly taller for better visual appeal
  const eventFontSize = 13;

  // Tooltip formatter
  const formatTooltip = (e) => {
    return `${e.label}\n${e.scheduleType}${e.weekOfMonth ? ` (Week ${e.weekOfMonth})` : ''}\n${e.time} - ${e.end}\nUpdated: ${e.updatedAt || '—'}`;
  };

  // Bulk helpers
  const bulkDelete = async () => {
    if (selectedCount === 0) return;
    if (!window.confirm(`Delete ${selectedCount} selected schedule(s)?`)) return;
    setEditSaving(true);
    try {
      for (const id of selectedArray) {
        const isNumeric = /^\d+$/.test(String(id));
        if (isNumeric) {
          await fetch(buildApiUrl('delete_predefined_schedule.php'), {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ id })
          }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.message || 'Delete failed'); });
        } else {
          // Composite id format: barangay|type|cluster|day|start
          const [barangay_id, schedule_type, cluster_id, day_of_week, start_time] = String(id).split('|');
          await fetch(buildApiUrl('delete_predefined_schedule.php'), {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({
              barangay_id, schedule_type, cluster_id, day_of_week, start_time
            })
          }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.message || 'Delete failed'); });
        }
      }
      clearSelected();
      await fetchSchedules();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkForm, setBulkForm] = useState({ day_of_week: '', start_time: '', end_time: '', week_of_month: '' });
  const bulkEditSubmit = async (e) => {
    e.preventDefault();
    setBulkError(null);
    if (!bulkForm.day_of_week || !bulkForm.start_time || !bulkForm.end_time) {
      setBulkError('Please fill out day, start time and end time.');
      return;
    }
    if (bulkForm.start_time >= bulkForm.end_time) {
      setBulkError('Start time must be earlier than end time.');
      return;
    }
    setBulkSaving(true);
    try {
      for (const id of selectedArray) {
        const isNumeric = /^\d+$/.test(String(id));
        if (isNumeric) {
          await fetch(buildApiUrl('update_predefined_schedule.php'), {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({
              schedule_template_id: id,
              day_of_week: bulkForm.day_of_week,
              start_time: bulkForm.start_time,
              end_time: bulkForm.end_time,
              week_of_month: bulkForm.week_of_month ? Number(bulkForm.week_of_month) : undefined
            })
          }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.message || 'Update failed'); });
        } else {
          const [barangay_id, schedule_type, cluster_id, dayOfWeekOriginal, startOriginal] = String(id).split('|');
          await fetch(buildApiUrl('update_predefined_schedule_by_fields.php'), {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({
              barangay_id, schedule_type, cluster_id,
              match_day_of_week: dayOfWeekOriginal,
              match_start_time: startOriginal,
              day_of_week: bulkForm.day_of_week,
              start_time: bulkForm.start_time,
              end_time: bulkForm.end_time,
              week_of_month: bulkForm.week_of_month ? Number(bulkForm.week_of_month) : undefined
            })
          }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.message || 'Update failed'); });
        }
      }
      setBulkOpen(false);
      clearSelected();
      await fetchSchedules();
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  // Clear selection on context changes
  useEffect(() => {
    clearSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTruck, selectedCluster, currentWeek]);

  return (
    <div className="p-6 max-w-full overflow-x-auto bg-emerald-50 min-h-screen font-sans">
      {/* Bulk action bar (visible when there are selections) */}
      {selectedCount > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="text-emerald-900 text-sm font-medium">{selectedCount} selected</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setBulkOpen(true)}>Edit Selected</button>
            <button className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50" onClick={bulkDelete}>Delete Selected</button>
            <button className="px-3 py-1.5 rounded border border-emerald-300 text-emerald-800 hover:bg-emerald-100" onClick={clearSelected}>Clear</button>
          </div>
        </div>
      )}

      {/* Header removed - using global admin header */}
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            aria-label="Previous week"
            title="Previous week"
          >
            ←
          </button>
          <div className="px-3 py-1.5 rounded text-green-900 font-medium">
            {formatMonthYear(currentWeek)}
          </div>
          <button
            onClick={goToNextWeek}
            className="px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            aria-label="Next week"
            title="Next week"
          >
            →
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          title="Go to today"
        >
          Today
        </button>
        
        <div className="flex items-center gap-3">
          <div className="rounded px-2 py-1 font-semibold text-xs mr-2 flex items-center">
            {trucks.map(truck => (
              <button
                key={truck}
                onClick={() => { setSelectedTruck(truck); clearSelected(); }}
                className={`px-3 py-1 rounded mr-2 font-semibold text-sm transition ${
                  selectedTruck === truck 
                    ? 'bg-green-600 text-white' 
                    : 'bg-transparent text-green-800 border border-green-300 hover:bg-green-50'
                }`}
                title={`Select ${truck}`}
              >
                {truck}
              </button>
            ))}
          </div>
          
          {selectedTruck === 'Truck 1' ? (
            <span className="font-semibold text-green-700 text-base px-3 py-1 bg-green-50 rounded-md">
              Priority Barangays (1C-PB)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-700 text-base">
                Cluster:
              </span>
              <select
                className="border border-gray-300 rounded-md px-3 py-1 text-sm font-medium focus:border-green-600 focus:outline-none"
                value={selectedCluster}
                onChange={e => { setSelectedCluster(e.target.value); clearSelected(); }}
                title="Select cluster for Truck 2"
              >
                <option value="2C-CA">Cluster A</option>
                <option value="3C-CB">Cluster B</option>
                <option value="4C-CC">Cluster C</option>
                <option value="5C-CD">Cluster D</option>
              </select>
            </div>
          )}
          <button
            onClick={() => { setAddForm({ date: '', start_time: '', end_time: '', barangay_id: '' }); setAddError(null); setAddOpen(true); }}
            className="ml-2 px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
            title="Add schedule"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {schedulesLoading && (
        <div className="text-center py-8">
          <div className="text-gray-600 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
            Loading predefined schedules...
          </div>
        </div>
      )}
      
      {schedulesError && (
        <div className="text-center py-8">
          <div className="text-red-600 flex items-center justify-center">
            Error: {schedulesError}
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', width: '100%' }}>
        {schedulesLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-xl font-semibold text-gray-700 mb-2">No predefined schedules found</div>
            <div className="text-gray-500 mb-4">
              No predefined schedules available for the selected criteria
            </div>
          </div>
        ) : (
          <>
            {/* Time Grid Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `100px repeat(7, minmax(${colWidth}, 1fr))`,
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: '#f0fdf4',
                minWidth: '1150px', // 100px + (7 * 150px) = 1150px minimum
              }}
            >
              <div className="bg-green-100 rounded-tl-lg py-3 font-semibold text-sm text-center">
                Time
              </div>
              {days.map(col => (
                <div key={col.day} className="bg-green-100 rounded-t-lg text-center text-gray-700 font-semibold text-sm py-3">
                  {col.day} <span className="font-normal">{col.date}</span>
                </div>
              ))}
            </div>

            {/* Main Time Grid */}
            <div
              className="grid bg-white rounded-b-lg border border-t-0 border-gray-200"
              style={{
                gridTemplateColumns: `100px repeat(7, minmax(${colWidth}, 1fr))`,
                minHeight: 500,
                minWidth: '1150px', // 100px + (7 * 150px) = 1150px minimum
              }}
            >
              {/* Time Column */}
              <div className="flex flex-col items-center pt-2">
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="w-full text-xs text-center text-gray-500 flex items-center justify-center border-r border-gray-100"
                    style={{ height: rowHeight }}
                  >
                    {slot}
                  </div>
                ))}
              </div>
              
              {/* Day Columns */}
              {days.map(day => (
                <div key={day.day} className="relative flex flex-col pt-2">
                  {timeSlots.map((slot) => {
                    const key = `${day.day}-${slot}`;
                    const events = eventMap[key] || [];
                    return (
                      <div
                        key={slot}
                        className="w-full flex flex-col items-center justify-center border-r border-gray-100"
                        style={{ height: rowHeight }}
                      >
                        {events.map((event, idx) => (
                          <div
                            key={`${event.id || event.label}-${idx}`}
                            className={`relative rounded-lg ${event.color} ${event.border} ${event.shadow} flex flex-col items-center justify-center mb-2 p-2.5 hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer ${selectedIds.has(event.id) ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                            style={{ 
                              width: eventWidth, 
                              height: eventHeight, 
                              fontWeight: 700, 
                              fontSize: eventFontSize,
                              minHeight: '55px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                            title={formatTooltip(event)}
                            onClick={(e) => {
                              // If Ctrl/Meta is held, toggle selection; otherwise open edit
                              if (e.ctrlKey || e.metaKey || ctrlPressed) {
                                toggleSelected(event.id);
                                return;
                              }
                              const s = event.schedule;
                              setEditingSchedule(s);
                              setEditForm({
                                day_of_week: s.day_of_week,
                                start_time: s.start_time?.substring(0,5) || '',
                                end_time: s.end_time?.substring(0,5) || '',
                                week_of_month: s.week_of_month || ''
                              });
                              setEditError(null);
                              setEditOpen(true);
                            }}
                          >
                            {/* NEW badge for recently created schedules */}
                            {event.isNew && (
                              <div className={`absolute -top-1.5 -right-1.5 z-20 ${event.badgeColor} text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg border-2 border-white animate-pulse`}>
                                NEW
                              </div>
                            )}
                            
                            {/* Decorative corner accent */}
                            <div className={`absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-transparent ${event.scheduleType === 'weekly_cluster' ? 'border-r-blue-400' : 'border-r-green-400'} rounded-bl-lg opacity-60`}></div>
                            
                            {/* Main content */}
                            <div className="flex items-center justify-center w-full gap-2 min-w-0 relative z-10">
                              {/* Icon indicator */}
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${event.scheduleType === 'weekly_cluster' ? 'bg-blue-500' : 'bg-green-500'} shadow-sm`}></div>
                              
                              <span 
                                className={`text-sm font-bold ${event.text} truncate flex-1 text-center`} 
                                style={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  lineHeight: '1.3'
                                }}
                              >
                                {event.label}
                              </span>
                              
                              {(ctrlPressed || selectedCount > 0) && (
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 flex-shrink-0"
                                  checked={selectedIds.has(event.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => toggleSelected(event.id)}
                                />
                              )}
                            </div>

                            {/* Subtle pattern overlay */}
                            <div className={`absolute inset-0 opacity-5 ${event.scheduleType === 'weekly_cluster' ? 'bg-blue-600' : 'bg-green-600'}`} style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)'
                            }}></div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {selectedCount > 0 && bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative p-6">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-green-700" onClick={() => setBulkOpen(false)}>✕</button>
            <h2 className="text-lg font-semibold text-green-800 mb-4">Edit {selectedCount} Selected</h2>
            {bulkError && <div className="text-red-600 text-sm mb-3">{bulkError}</div>}
            <form onSubmit={bulkEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-green-700 mb-1">Day of Week</label>
                  <select className="w-full border border-green-200 rounded px-3 py-2" value={bulkForm.day_of_week} onChange={(e) => setBulkForm({ ...bulkForm, day_of_week: e.target.value })} required>
                    <option value="">Select day</option>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-green-700 mb-1">Week of Month</label>
                  <input type="number" min={1} max={4} className="w-full border border-green-200 rounded px-3 py-2" value={bulkForm.week_of_month || ''} onChange={(e) => setBulkForm({ ...bulkForm, week_of_month: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-green-700 mb-1">Start Time</label>
                  <input type="time" className="w-full border border-green-200 rounded px-3 py-2" value={bulkForm.start_time} onChange={(e) => setBulkForm({ ...bulkForm, start_time: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-green-700 mb-1">End Time</label>
                  <input type="time" className="w-full border border-green-200 rounded px-3 py-2" value={bulkForm.end_time} onChange={(e) => setBulkForm({ ...bulkForm, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setBulkOpen(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={bulkSaving}>{bulkSaving ? 'Saving...' : 'Apply Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit Modal */}
      {editOpen && editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <button
                className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-green-700 hover:bg-gray-100"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
                title="Close"
              >✕</button>
              <h2 className="text-xl font-semibold text-green-800">Edit Predefined Schedule</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  {editingSchedule.barangay_name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs uppercase tracking-wide">
                  {editingSchedule.schedule_type}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  Cluster: {editingSchedule.cluster_id}
                </span>
              </div>
            </div>

            {editError && (
              <div className="mx-6 mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}

            {/* Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEditError(null);
                // Basic validation
                if (!editForm.day_of_week || !editForm.start_time || !editForm.end_time) {
                  setEditError('Please fill out day, start time and end time.');
                  return;
                }
                if (editForm.start_time >= editForm.end_time) {
                  setEditError('Start time must be earlier than end time.');
                  return;
                }
                if (editingSchedule.schedule_type === 'weekly_cluster') {
                  const w = Number(editForm.week_of_month);
                  if (!w || w < 1 || w > 4) {
                    setEditError('Week of month must be between 1 and 4 for weekly clusters.');
                    return;
                  }
                }

                const confirmMsg = `This change will update the predefined template${editingSchedule.schedule_type === 'weekly_cluster' ? ` for Week ${editForm.week_of_month}` : ''}. Continue?`;
                if (!window.confirm(confirmMsg)) return;

                try {
                  setEditSaving(true);
                  const idVal = (
                    editingSchedule?.schedule_template_id ||
                    editingSchedule?.template_id ||
                    editingSchedule?.id ||
                    editingSchedule?.schedule_id ||
                    editingSchedule?.predefined_id
                  );
                  let res;
                  if (!idVal) {
                    console.warn('No schedule id found; updating by fields', editingSchedule);
                    res = await fetch(buildApiUrl('update_predefined_schedule_by_fields.php'), {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        barangay_id: editingSchedule.barangay_id,
                        cluster_id: editingSchedule.cluster_id,
                        schedule_type: editingSchedule.schedule_type,
                        // Use original values to locate the record
                        match_day_of_week: editingSchedule.day_of_week,
                        match_start_time: (editingSchedule.start_time || '').substring(0,5),
                        // New values to set
                        day_of_week: editForm.day_of_week,
                        start_time: editForm.start_time,
                        end_time: editForm.end_time,
                        week_of_month: editingSchedule.schedule_type === 'weekly_cluster' ? Number(editForm.week_of_month) : undefined
                      })
                    });
                  } else {
                    console.log('Updating predefined schedule id:', idVal, editingSchedule);
                    res = await fetch(buildApiUrl('update_predefined_schedule.php'), {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        // send all possible keys so backend can accept any
                        schedule_template_id: idVal,
                        template_id: idVal,
                        id: idVal,
                        schedule_id: idVal,
                        predefined_id: idVal,
                        day_of_week: editForm.day_of_week,
                        start_time: editForm.start_time,
                        end_time: editForm.end_time,
                        week_of_month: editingSchedule.schedule_type === 'weekly_cluster' ? Number(editForm.week_of_month) : undefined
                      })
                    });
                  }
                  const data = await res.json();
                  if (!data.success) throw new Error(data.message || 'Failed to update schedule');
                  // Optimistically update local state without triggering loading spinner
                  setPredefinedSchedules((prev) => {
                    const originalDay = editingSchedule.day_of_week;
                    const originalStart = (editingSchedule.start_time || '').substring(0,5);
                    const idVal = (
                      editingSchedule?.schedule_template_id ||
                      editingSchedule?.template_id ||
                      editingSchedule?.id ||
                      editingSchedule?.schedule_id ||
                      editingSchedule?.predefined_id
                    );
                    return prev.map((s) => {
                      const sStart = (s.start_time || '').substring(0,5);
                      const idMatch = idVal && (
                        s.schedule_template_id === idVal || s.id === idVal
                      );
                      const fieldMatch = (
                        s.barangay_id === editingSchedule.barangay_id &&
                        s.cluster_id === editingSchedule.cluster_id &&
                        s.schedule_type === editingSchedule.schedule_type &&
                        s.day_of_week === originalDay &&
                        sStart === originalStart
                      );
                      if (idMatch || fieldMatch) {
                        return {
                          ...s,
                          day_of_week: editForm.day_of_week,
                          start_time: editForm.start_time,
                          end_time: editForm.end_time,
                          week_of_month: editingSchedule.schedule_type === 'weekly_cluster'
                            ? Number(editForm.week_of_month)
                            : s.week_of_month
                        };
                      }
                      return s;
                    });
                  });
                  setEditOpen(false);
                } catch (err) {
                  setEditError(err.message);
                } finally {
                  setEditSaving(false);
                }
              }}
              className="px-6 py-5 space-y-6"
            >
              {/* When & Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day of Week</label>
                  <select
                    className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-gray-800"
                    value={editForm.day_of_week}
                    onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })}
                    required
                  >
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Week of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-gray-800 disabled:bg-gray-50"
                    value={editForm.week_of_month}
                    onChange={(e) => setEditForm({ ...editForm, week_of_month: e.target.value })}
                    disabled={editingSchedule.schedule_type !== 'weekly_cluster'}
                  />
                  {editingSchedule.schedule_type === 'weekly_cluster' && (
                    <p className="mt-1 text-xs text-gray-500">Enter a value from 1 to 4.</p>
                  )}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-gray-800"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-gray-800"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {editingSchedule.schedule_type === 'weekly_cluster' && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      title="Create a copy on the next week"
                      onClick={async () => {
                        setEditError(null);
                        const nextWeek = Math.min(4, (Number(editForm.week_of_month) || 1) + 1);
                        if (!window.confirm(`Copy this schedule to Week ${nextWeek}?`)) return;
                        try {
                          setEditSaving(true);
                          const payload = {
                            barangay_id: editingSchedule.barangay_id,
                            barangay_name: editingSchedule.barangay_name,
                            cluster_id: editingSchedule.cluster_id,
                            schedule_type: editingSchedule.schedule_type,
                            day_of_week: editForm.day_of_week,
                            start_time: editForm.start_time,
                            end_time: editForm.end_time,
                            frequency_per_day: editingSchedule.frequency_per_day || 1,
                            week_of_month: nextWeek,
                            is_active: 1
                          };
                          const res = await fetch(buildApiUrl('create_predefined_schedule.php'), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(payload)
                          });
                          const data = await res.json();
                          if (!data.success) throw new Error(data.message || 'Failed to copy schedule');
                          // Refresh list
                          await fetchSchedules();
                        } catch (err) {
                          setEditError(err.message);
                        } finally {
                          setEditSaving(false);
                        }
                      }}
                    >
                      Copy to Next Week
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      if (!window.confirm('Delete this schedule?')) return;
                      setEditError(null);
                      try {
                        setEditSaving(true);
                        const idVal = (
                          editingSchedule?.schedule_template_id ||
                          editingSchedule?.template_id ||
                          editingSchedule?.id ||
                          editingSchedule?.schedule_id ||
                          editingSchedule?.predefined_id
                        );
                        let res;
                        if (idVal) {
                          res = await fetch(buildApiUrl('delete_predefined_schedule.php'), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ id: idVal })
                          });
                        } else {
                          res = await fetch(buildApiUrl('delete_predefined_schedule.php'), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                              barangay_id: editingSchedule.barangay_id,
                              cluster_id: editingSchedule.cluster_id,
                              schedule_type: editingSchedule.schedule_type,
                              day_of_week: editingSchedule.day_of_week,
                              start_time: (editingSchedule.start_time || '').substring(0,5),
                              week_of_month: editingSchedule.week_of_month
                            })
                          });
                        }
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message || 'Failed to delete schedule');
                        // Remove locally
                        setPredefinedSchedules(prev => prev.filter(s => {
                          const sId = s.schedule_template_id || s.id;
                          if (idVal) return sId !== idVal;
                          const sStart = (s.start_time || '').substring(0,5);
                          return !(
                            s.barangay_id === editingSchedule.barangay_id &&
                            s.cluster_id === editingSchedule.cluster_id &&
                            s.schedule_type === editingSchedule.schedule_type &&
                            s.day_of_week === editingSchedule.day_of_week &&
                            sStart === (editingSchedule.start_time || '').substring(0,5)
                          );
                        }));
                        setEditOpen(false);
                      } catch (err) {
                        setEditError(err.message);
                      } finally {
                        setEditSaving(false);
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    disabled={editSaving}
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Schedule Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-green-700"
              onClick={() => setAddOpen(false)}
              aria-label="Close"
            >✕</button>
            <h2 className="text-lg font-semibold text-green-800 mb-4">Add Schedule</h2>
            {addError && (
              <div className="text-red-600 text-sm mb-3">{addError}</div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAddError(null);
                if (!addForm.date || !addForm.start_time || !addForm.end_time || !addForm.barangay_id) {
                  setAddError('Please fill out date, time, and barangay.');
                  return;
                }
                if (addForm.start_time >= addForm.end_time) {
                  setAddError('Start time must be earlier than end time.');
                  return;
                }
                try {
                  setAddSaving(true);
                  const dayIndex = new Date(addForm.date).getDay();
                  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                  const dayOfWeek = dayNames[dayIndex];
                  const wom = getWeekOfMonth(addForm.date);
                  const isTruck1 = selectedTruck === 'Truck 1';
                  const schedule_type = isTruck1 ? 'daily_priority' : 'weekly_cluster';
                  const cluster_id = isTruck1 ? '1C-PB' : selectedCluster;
                  const barangay = barangayList.find(b => String(b.barangay_id) === String(addForm.barangay_id));
                  const payload = {
                    barangay_id: addForm.barangay_id,
                    barangay_name: barangay ? barangay.barangay_name : undefined,
                    cluster_id,
                    schedule_type,
                    day_of_week: dayOfWeek,
                    start_time: addForm.start_time,
                    end_time: addForm.end_time,
                    frequency_per_day: 1,
                    week_of_month: schedule_type === 'weekly_cluster' ? wom : undefined,
                    is_active: 1
                  };
                  const res = await fetch(buildApiUrl('create_predefined_schedule.php'), {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.message || 'Failed to create schedule');
                  await fetchSchedules();
                  setAddOpen(false);
                } catch (err) {
                  setAddError(err.message);
                } finally {
                  setAddSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-green-700 mb-1">Barangay</label>
                <select
                  className="w-full border border-green-200 rounded px-3 py-2"
                  value={addForm.barangay_id}
                  onChange={(e) => setAddForm({ ...addForm, barangay_id: e.target.value })}
                  required
                >
                  <option value="">Select barangay</option>
                  {barangayList
                    .filter(b => selectedTruck === 'Truck 1' ? b.cluster_id === '1C-PB' : true)
                    .filter(b => selectedTruck === 'Truck 2' ? b.cluster_id === selectedCluster : true)
                    .map(b => (
                      <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-green-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-green-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={addForm.start_time}
                    onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-green-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full border border-green-200 rounded px-3 py-2"
                  value={addForm.end_time}
                  onChange={(e) => setAddForm({ ...addForm, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={addSaving}>
                  {addSaving ? 'Saving...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
