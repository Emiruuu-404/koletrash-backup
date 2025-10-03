import React, { useState } from 'react';
import {
  FiTruck,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiMap,
  FiFilter,
  FiInfo,
  FiSearch,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

// Sample data - replace with actual API data later
const initialSchedules = [
  {
    id: 1,
    barangay: 'Brgy. Angas',
    date: '2025-06-14',
    time: '07:00 AM',
    type: 'Basura',
    status: 'pending',
    route: 'Route A'
  },
  {
    id: 2,
    barangay: 'Brgy. Bagacay',
    date: '2025-06-14',
    time: '09:00 AM',
    type: 'Recyclable',
    status: 'completed',
    route: 'Route A'
  },
  {
    id: 3,
    barangay: 'Brgy. Bahay',
    date: '2025-06-14',
    time: '10:30 AM',
    type: 'Basura',
    status: 'pending',
    route: 'Route B'
  },
  {
    id: 4,
    barangay: 'Brgy. Cabanbanan',
    date: '2025-06-15',
    time: '07:00 AM',
    type: 'Special Waste',
    status: 'pending',
    route: 'Route B'
  }
];

export default function TruckDriverCollectionSchedule() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [filter, setFilter] = useState('all');
  const [route, setRoute] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const today = new Date().toISOString().split('T')[0];

  // Handle marking complete
  const handleMarkComplete = (id) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id ? { ...schedule, status: 'completed' } : schedule
      )
    );
  };

  // Sort function
  const sortSchedules = (data) => {
    return [...data].sort((a, b) => {
      let compareA = a[sortField];
      let compareB = b[sortField];
      
      if (sortField === 'date') {
        compareA = new Date(a.date + ' ' + a.time);
        compareB = new Date(b.date + ' ' + b.time);
      }
      
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Toggle sort
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get filtered and sorted schedules
  const getFilteredSchedules = () => {
    let filtered = schedules;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(s => {
        if (filter === 'today') return s.date === today;
        return s.status === filter;
      });
    }

    // Apply route filter
    if (route !== 'all') {
      filtered = filtered.filter(s => s.route === route);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.barangay.toLowerCase().includes(searchLower) ||
        s.route.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    return sortSchedules(filtered);
  };

  // Get unique routes
  const routes = ['all', ...new Set(schedules.map(s => s.route))].sort();

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get waste type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'Basura':
        return 'bg-red-100 text-red-800';
      case 'Recyclable':
        return 'bg-blue-100 text-blue-800';
      case 'Special Waste':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header with Quick Stats */}
      <div className="mb-4">
        <h1 className="text-xl font-medium text-gray-900">Collection Schedule</h1>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Today's Collections</p>
            <p className="text-2xl font-medium text-green-600 mt-1">
              {schedules.filter(s => s.date === today).length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-medium text-yellow-600 mt-1">
              {schedules.filter(s => s.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-medium text-blue-600 mt-1">
              {schedules.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters in Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
        {/* Search */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search barangay or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['all', 'today', 'pending', 'completed'].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter === value
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
          {routes.map((value) => (
            <button
              key={value}
              onClick={() => setRoute(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${route === value
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
            >
              {value === 'all' ? 'All Routes' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* List Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
          <button
            onClick={() => toggleSort('barangay')}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-green-600"
          >
            Barangay {sortField === 'barangay' && (
              sortDirection === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => toggleSort('date')}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-green-600"
          >
            Date & Time {sortField === 'date' && (
              sortDirection === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* List Items */}
        {getFilteredSchedules().length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FiInfo className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No schedules found</p>
          </div>
        ) : (
          getFilteredSchedules().map((schedule) => (
            <div
              key={schedule.id}
              className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1">
                    <FiTruck className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{schedule.barangay}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{schedule.date}</span>
                      <span>•</span>
                      <span>{schedule.time}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                        {schedule.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {schedule.route}
                      </span>
                    </div>
                  </div>
                </div>
                {schedule.status === 'pending' && (
                  <button
                    onClick={() => handleMarkComplete(schedule.id)}
                    className="shrink-0 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <FiCheckCircle className="w-3 h-3" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
