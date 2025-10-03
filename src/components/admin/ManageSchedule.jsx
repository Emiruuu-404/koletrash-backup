import React, { useState, useEffect } from 'react';

const trucks = ['Truck 1', 'Truck 2'];

// Define the time slots for the grid (6:00 to 17:00, every 30 minutes)
const timeSlots = [];
for (let hour = 6; hour <= 17; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour !== 17) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
}

export default function ManageSchedule() {
  const [selectedTruck, setSelectedTruck] = useState('Truck 1');
  const [selectedCluster, setSelectedCluster] = useState('2C-CA'); // Default to Cluster A
  const [predefinedSchedules, setPredefinedSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(null);
  const [barangayList, setBarangayList] = useState([]);
  const [clusterList, setClusterList] = useState([]);
  // Set initial date to the current date (current month/week)
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Inline edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({ day_of_week: '', start_time: '', end_time: '', week_of_month: '' });
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

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
    
    for (let i = 0; i < 5; i++) { // Monday to Friday only
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
      if (isTruck1) {
        params.set('schedule_type', 'daily_priority');
      } else {
        params.set('schedule_type', 'weekly_cluster');
        params.set('cluster_id', selectedCluster);
        params.set('week_of_month', String(weekNumber));
      }
      // Limit to visible weekdays
      params.set('days', ['Monday','Tuesday','Wednesday','Thursday','Friday'].join(','));
      const url = `https://koletrash.systemproj.com/backend/api/get_predefined_schedules.php?${params.toString()}`;
      const res = await fetch(url);
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
    fetch('https://koletrash.systemproj.com/backend/api/get_barangays.php')
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
    fetch('https://koletrash.systemproj.com/backend/api/get_clusters.php')
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
      // Truck 1: Show priority barangays only (cluster_id = 1C-PB)
      return predefinedSchedules.filter(schedule => schedule.cluster_id === '1C-PB');
    } else {
      // Truck 2: Show clustered barangays based on selected cluster
      const weekNumber = getWeekOfMonth(getWeekStart(currentWeek));
      const filtered = predefinedSchedules.filter(schedule => (
        schedule.cluster_id === selectedCluster &&
        schedule.schedule_type === 'weekly_cluster' &&
        Number(schedule.week_of_month) === Number(weekNumber)
      ));
      console.log('Selected Cluster:', selectedCluster);
      console.log('Current Week Number:', weekNumber);
      console.log('Filtered Schedules:', filtered);
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
    
    // Create event object for predefined schedule
    const predefinedEvent = {
      label: schedule.barangay_name,
      time: schedule.start_time,
      end: schedule.end_time,
      color: schedule.schedule_type === 'daily_priority' ? 'bg-blue-100' : 
             schedule.schedule_type === 'fixed_days' ? 'bg-green-100' : 'bg-purple-100',
      border: schedule.schedule_type === 'daily_priority' ? 'border-blue-400' : 
              schedule.schedule_type === 'fixed_days' ? 'border-green-400' : 'border-purple-400',
      text: schedule.schedule_type === 'daily_priority' ? 'text-blue-900' : 
            schedule.schedule_type === 'fixed_days' ? 'text-green-900' : 'text-purple-900',
      isPredefinedSchedule: true,
      scheduleType: schedule.schedule_type,
      weekOfMonth: schedule.week_of_month,
      barangayId: schedule.barangay_id,
      schedule
    };
    
    eventMap[timeKey].push(predefinedEvent);
  });

  // Improved grid sizing for better readability
  const colWidth = '200px';
  const rowHeight = 80;
  const eventWidth = '180px';
  const eventHeight = 60;
  const eventFontSize = 14;


  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid" style={{ gridTemplateColumns: `100px repeat(5, minmax(${colWidth}, 1fr))` }}>
        <div className="bg-gray-200 h-12 rounded-tl-lg"></div>
        {days.map((_, i) => (
          <div key={i} className="bg-gray-200 h-12 rounded-t-lg"></div>
        ))}
      </div>
      <div className="grid bg-white rounded-b-lg border" style={{ gridTemplateColumns: `100px repeat(5, minmax(${colWidth}, 1fr))` }}>
        <div className="flex flex-col">
          {timeSlots.map((_, i) => (
            <div key={i} className="bg-gray-100 h-20 border-r border-gray-200"></div>
          ))}
        </div>
        {days.map((_, dayIndex) => (
          <div key={dayIndex} className="flex flex-col">
            {timeSlots.map((_, timeIndex) => (
              <div key={timeIndex} className="bg-gray-50 h-20 border-r border-gray-200 flex items-center justify-center">
                <div className="w-32 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <div className="w-full h-full p-8 bg-emerald-50" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 mb-2 font-normal tracking-tight">
          Schedule Management
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 m-0 font-normal">
          Manage predefined collection schedules and generate tasks for personnel.
        </p>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-blue-200 border border-blue-400"></span>
            <span className="text-blue-900">Daily Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-400"></span>
            <span className="text-green-900">Fixed Days</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-purple-200 border border-purple-400"></span>
            <span className="text-purple-900">Weekly Cluster</span>
          </div>
        </div>
      </div>
      
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
                onClick={() => setSelectedTruck(truck)}
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
                onChange={e => setSelectedCluster(e.target.value)}
                title="Select cluster for Truck 2"
              >
                <option value="2C-CA">Cluster A (2C-CA)</option>
                <option value="3C-CB">Cluster B (3C-CB)</option>
                <option value="4C-CC">Cluster C (4C-CC)</option>
                <option value="5C-CD">Cluster D (5C-CD)</option>
              </select>
            </div>
          )}
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
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
        {schedulesLoading ? (
          <LoadingSkeleton />
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
                gridTemplateColumns: `100px repeat(5, minmax(${colWidth}, 1fr))`,
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: '#f0fdf4',
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
                gridTemplateColumns: `100px repeat(5, minmax(${colWidth}, 1fr))`,
                minHeight: 500,
              }}
            >
              {/* Time Column */}
              <div className="flex flex-col items-center pt-2">
                {timeSlots.map((slot, i) => (
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
                  {timeSlots.map((slot, i) => {
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
                            key={event.label + idx}
                            className={`rounded-lg shadow-md border-l-4 ${event.color} ${event.border} flex flex-col items-center justify-center mb-2 p-2 cursor-pointer hover:scale-105 transition-all duration-200`}
                            style={{ 
                              width: eventWidth, 
                              height: eventHeight, 
                              fontWeight: 600, 
                              fontSize: eventFontSize,
                              minHeight: '50px'
                            }}
                            title={`${event.label} - ${event.time} to ${event.end} - Type: ${event.scheduleType}`}
                            onClick={() => {
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
                            <span className={`text-sm font-bold ${event.text} text-center leading-tight`}>
                              {event.label}
                            </span>
                            <span className={`text-xs ${event.text} opacity-75 mt-1`}>
                              {event.time} - {event.end}
                            </span>
                            <span className={`text-xs ${event.text} opacity-60 mt-1`}>
                              {event.scheduleType} {event.weekOfMonth ? `(Week ${event.weekOfMonth})` : ''}
                            </span>
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

      {/* Inline Edit Modal */}
      {editOpen && editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-green-700"
              onClick={() => setEditOpen(false)}
              aria-label="Close"
            >✕</button>
            <h2 className="text-lg font-semibold text-green-800 mb-4">Edit Predefined Schedule</h2>

            <div className="text-sm text-gray-700 mb-4">
              <div className="font-semibold">{editingSchedule.barangay_name}</div>
              <div>Type: <span className="uppercase">{editingSchedule.schedule_type}</span></div>
              <div>Cluster: {editingSchedule.cluster_id}</div>
            </div>

            {editError && (
              <div className="text-red-600 text-sm mb-3">{editError}</div>
            )}

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
                    res = await fetch('https://koletrash.systemproj.com/backend/api/update_predefined_schedule_by_fields.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
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
                    res = await fetch('https://koletrash.systemproj.com/backend/api/update_predefined_schedule.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
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
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-green-700 mb-1">Day of Week</label>
                  <select
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={editForm.day_of_week}
                    onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })}
                    required
                  >
                    {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-green-700 mb-1">Week of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={editForm.week_of_month}
                    onChange={(e) => setEditForm({ ...editForm, week_of_month: e.target.value })}
                    disabled={editingSchedule.schedule_type !== 'weekly_cluster'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-green-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-green-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full border border-green-200 rounded px-3 py-2"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {editingSchedule.schedule_type === 'weekly_cluster' && (
                    <button
                      type="button"
                      className="px-3 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
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
                          const res = await fetch('https://koletrash.systemproj.com/backend/api/create_predefined_schedule.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });
                          const data = await res.json();
                          if (!data.success) throw new Error(data.message || 'Failed to copy schedule');
                          // Refresh list
                          setSchedulesLoading(true);
                          const ref = await fetch('https://koletrash.systemproj.com/backend/api/get_predefined_schedules.php');
                          const refData = await ref.json();
                          if (refData.success) {
                            setPredefinedSchedules(Array.isArray(refData.schedules) ? refData.schedules : []);
                          }
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
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
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
    </div>
  );
}
