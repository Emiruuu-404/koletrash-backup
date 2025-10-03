import React, { useState, useEffect } from 'react';
import axios from 'axios';

const weekdays = [
  { label: 'M', value: 'Monday' },
  { label: 'T', value: 'Tuesday' },
  { label: 'W', value: 'Wednesday' },
  { label: 'TH', value: 'Thursday' },
  { label: 'F', value: 'Friday' },
];

export default function TruckDriverCollectionSchedule() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAcceptedTasks, setHasAcceptedTasks] = useState(false);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.user_id;

  useEffect(() => {
    if (userId) {
      fetchSchedules();
    }
  }, [userId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://koletrash.systemproj.com/backend/api/get_personnel_schedule.php?user_id=${userId}&role=driver`);
      
      if (response.data.success) {
        setSchedules(response.data.schedules);
        setHasAcceptedTasks(response.data.schedules.length > 0);
      } else {
        setError(response.data.message);
        setHasAcceptedTasks(false);
      }
    } catch (err) {
      setError('Failed to fetch schedules');
      setHasAcceptedTasks(false);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by day of week
  const getSchedulesByDay = (dayName) => {
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5
    };
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();
      return dayOfWeek === dayMap[dayName];
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const dates = {};
    weekdays.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      dates[day.value] = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    });
    return dates;
  };

  const dateDisplay = getCurrentWeekDates();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center pt-8 pb-4 px-2">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center pt-8 pb-4 px-2">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchSchedules}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no accepted tasks
  if (!hasAcceptedTasks) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center pt-8 pb-4 px-2">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">COLLECTION SCHEDULE</h2>
            <p className="text-gray-600 mb-4">Welcome, Truck Driver</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">No Accepted Tasks</p>
              <p className="text-yellow-700 text-sm mt-1">
                You need to accept your assigned tasks first to view your schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daySchedules = getSchedulesByDay(selectedDay);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-start pt-8 pb-4 px-2">
      <div className="w-full max-w-md px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 pl-1">COLLECTION SCHEDULE</h2>
        <p className="text-sm text-gray-600 mb-4 pl-1">Welcome, Truck Driver</p>
        
        {/* Day Selector */}
        <div className="flex justify-center gap-2 mb-4 px-1">
          {weekdays.map((day) => (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`px-4 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none ${
                selectedDay === day.value
                  ? 'bg-green-200 text-green-900'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        
        {/* Schedule Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-center mb-4">
            <div className="font-bold text-base pb-1">{selectedDay.toUpperCase()}</div>
            <div className="text-xs text-gray-500 pb-1">{dateDisplay[selectedDay]} | 6:00 AM - 5:00 PM</div>
          </div>
          
          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">TIME</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">BARANGAY</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">TRUCK</th>
                </tr>
              </thead>
              <tbody>
                {daySchedules.length > 0 ? (
                  daySchedules.map((schedule, idx) => (
                    <tr key={idx} className="bg-green-50 hover:bg-green-100 transition-colors">
                      <td className="px-4 py-2 font-medium">{schedule.time}</td>
                      <td className="px-4 py-2">{schedule.barangay}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{schedule.truck_number}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-8">No schedule for this day</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
