import React, { useState } from 'react';

const days = ['M', 'T', 'W', 'TH', 'F'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const scheduleData = {
  Monday: [
    { time: '6:00', barangay: 'NORTH CENTRO', color: 'bg-green-100' },
    { time: '6:30', barangay: 'SOUTH CENTRO', color: 'bg-blue-100' },
    { time: '7:00', barangay: 'IMPIG', color: 'bg-yellow-100' },
    { time: '7:00', barangay: 'TARA', color: 'bg-red-100' },
    { time: '9:00', barangay: 'NORTH CENTRO', color: 'bg-green-100' },
    { time: '9:30', barangay: 'SOUTH CENTRO', color: 'bg-blue-100' },
    { time: '11:00', barangay: 'IMPIG', color: 'bg-yellow-100' },
    { time: '11:30', barangay: 'TARA', color: 'bg-red-100' },
    { time: '12:00', barangay: 'NORTH CENTRO', color: 'bg-green-100' },
    { time: '12:30', barangay: 'SOUTH CENTRO', color: 'bg-blue-100' },
    { time: '15:00', barangay: 'NORTH CENTRO', color: 'bg-green-100' },
    { time: '15:30', barangay: 'SOUTH CENTRO', color: 'bg-blue-100' },
    { time: '14:00', barangay: 'IMPIG', color: 'bg-yellow-100' },
    { time: '14:30', barangay: 'TARA', color: 'bg-red-100' },
  ],
  // Add other days as needed
};

export default function CollectionSchedule() {
  const [selectedDay, setSelectedDay] = useState(0);
  const today = fullDays[selectedDay];
  const schedule = scheduleData[today] || [];

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center pt-6 pb-2 px-2">
      <div className="w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-800 mb-1">COLLECTION SCHEDULE</h2>
        <div className="text-sm text-gray-600 mb-4">Welcome, Truck Driver</div>
        {/* Weekday Selector */}
        <div className="flex justify-center gap-1 mb-4">
          {days.map((d, idx) => (
            <button
              key={d}
              onClick={() => setSelectedDay(idx)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                idx === selectedDay
                  ? 'bg-green-200 text-green-900 shadow'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow p-4 md:p-6 mx-auto" style={{ minWidth: '280px' }}>
          <div className="text-center font-bold text-lg text-gray-800 mb-1">{today.toUpperCase()}</div>
          <div className="text-center text-xs text-gray-500 mb-4">May 5, 2025 | 6:00 AM - 5:00 PM</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 font-semibold pb-2">TIME</th>
                  <th className="text-left text-gray-500 font-semibold pb-2">BARANGAY</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, idx) => (
                  <tr key={idx}>
                    <td className={`py-1 px-2 rounded-l-lg ${row.color} font-semibold text-gray-700`} style={{width:'80px'}}>{row.time}</td>
                    <td className={`py-1 px-2 rounded-r-lg ${row.color} font-medium tracking-wide`}>{row.barangay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-xs text-center text-gray-500 mt-8">© 2025 Municipality of Sipocot – MENRO. All rights reserved.</div>
      </div>
    </div>
  );
}
