import React, { useState } from 'react';

const sampleSchedules = [
  { date: '2025-06-10', type: 'Basura', time: '7:00 AM', zone: 'Zone 1' },
  { date: '2025-06-12', type: 'Recyclables', time: '8:00 AM', zone: 'Zone 1' },
  { date: '2025-06-14', type: 'Special Waste', time: '9:00 AM', zone: 'Zone 2' },
  { date: '2025-06-15', type: 'Basura', time: '7:00 AM', zone: 'Zone 2' },
];

const typeColors = {
  Basura: 'bg-green-100 text-green-800',
  Recyclables: 'bg-blue-100 text-blue-800',
  'Special Waste': 'bg-yellow-100 text-yellow-800',
};

const typeIcons = {
  Basura: '🗑️',
  Recyclables: '♻️',
  'Special Waste': '🧹',
};

export default function ResidentSchedule() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? sampleSchedules : sampleSchedules.filter(s => s.type === filter);

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg flex flex-col md:flex-row gap-6 items-start">
      {/* Left: Schedule List */}
      <div className="flex-1 w-full">
        <h1 className="text-2xl font-bold mb-4 text-green-800">Collection Schedule</h1>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium">Type:</label>
          <select className="border rounded px-2 py-1 text-sm focus:outline-none" value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option>
            <option>Basura</option>
            <option>Recyclables</option>
            <option>Special Waste</option>
          </select>
        </div>
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-gray-500 text-center text-sm">No schedules found.</div>}
          {filtered.map((s, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 ${typeColors[s.type]} shadow-sm transition hover:scale-[1.02]`}> 
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[s.type]}</span>
                <div>
                  <div className="font-semibold text-base">{s.type}</div>
                  <div className="text-xs text-gray-600">{s.zone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-medium">{s.date}</div>
                <div className="text-xs text-gray-700">{s.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-6 text-xs">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-100 inline-block border border-green-400"></span>Basura</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-100 inline-block border border-blue-400"></span>Recyclables</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-100 inline-block border border-yellow-400"></span>Special Waste</span>
        </div>
      </div>
      {/* Right: Info/Reminders/Promo */}
      <div className="w-full md:w-72 flex flex-col gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-green-700 font-semibold text-lg flex items-center gap-2"><span>ℹ️</span> Reminders</div>
        <ul className="text-sm text-gray-700 list-disc list-inside">
          <li>Schedules are updated regularly.</li>
          <li>Set a reminder on your phone for collection days.</li>
          <li>Segregate your waste properly before collection.</li>
        </ul>
        <div className="mt-2 text-xs text-gray-500">For more info, contact your barangay office.</div>
      </div>
    </div>
  );
}
