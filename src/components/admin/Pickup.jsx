import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiCheckCircle, FiClock, FiCalendar, FiUser, FiTrash2, FiEdit2, FiMessageCircle, FiFilter } from 'react-icons/fi';
import { authService } from '../../services/authService';

// Mock data for demonstration
const WASTE_ICONS = {
  "Yard Waste": <span className="text-green-700 font-semibold">Yard Waste</span>,
  "Appliance": <span className="text-blue-700 font-semibold">Appliance</span>,
  "Hazardous": <span className="text-yellow-700 font-semibold">Hazardous</span>,
  "Bulk": <span className="text-gray-700 font-semibold">Bulk</span>,
  "Other": <span className="text-emerald-700 font-semibold">Other</span>
};

const STATUS_COLORS = {
  Pending: { bg: 'bg-yellow-100', color: 'text-yellow-800', icon: <FiClock className="inline mr-1" /> },
  Scheduled: { bg: 'bg-blue-100', color: 'text-blue-800', icon: <FiCalendar className="inline mr-1" /> },
  Completed: { bg: 'bg-green-100', color: 'text-green-800', icon: <FiCheckCircle className="inline mr-1" /> },
  Declined: { bg: 'bg-red-100', color: 'text-red-800', icon: <FiX className="inline mr-1" /> }
};

// Get unique barangays from requests
const getUniqueBarangays = (requests) => {
  if (!requests || !Array.isArray(requests)) return ['All'];
  const barangays = ['All'];
  const uniqueBarangays = [...new Set(requests.map(req => req.barangay).filter(Boolean))];
  return [...barangays, ...uniqueBarangays.sort()];
};


export default function Pickup() {
  const [barangay, setBarangay] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch pickup requests on component mount
  useEffect(() => {
    const fetchPickupRequests = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching pickup requests...'); // Debug log
        
        const response = await authService.getPickupRequests();
        
        console.log('API Response:', response); // Debug log
        
        if (response && response.status === 'success') {
          // Simple transformation first
          const transformedRequests = (response.data || []).map((req, index) => ({
            id: req.request_id || `REQ-${String(index + 1).padStart(3, '0')}`,
            resident: req.requester_name || 'Unknown',
            address: req.barangay || 'Not specified',
            barangay: req.barangay || 'Not specified',
            wasteType: req.waste_type || 'Other',
            submitted: req.created_at ? req.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
            preferred: req.pickup_date || new Date().toISOString().split('T')[0],
            status: req.status || 'Pending',
            image: '',
            remarks: req.admin_remarks || req.declined_reason || '',
            details: req.notes || 'No additional details provided.',
            contact: req.contact_number || '',
            originalData: req
          }));
          
          console.log('Transformed requests:', transformedRequests); // Debug log
          setRequests(transformedRequests);
        } else {
          const errorMsg = response?.message || 'Failed to fetch pickup requests';
          console.error('API Error:', errorMsg);
          setError(errorMsg);
        }
      } catch (error) {
        console.error('Error fetching pickup requests:', error);
        setError('Failed to load pickup requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPickupRequests();
  }, []);

  // Filter logic
  const filtered = (requests || []).filter(req =>
    (barangay === 'All' || req.barangay === barangay) &&
    (status === 'All' || req.status === status) &&
    (!dateFrom || req.submitted >= dateFrom) &&
    (!dateTo || req.submitted <= dateTo)
  );

  function clearFilters() {
    setBarangay('All');
    setStatus('All');
    setDateFrom('');
    setDateTo('');
  }

  // Modal open
  function openModal(req) {
    setSelected(req);
    setShowModal(true);
    setRemarks(req.remarks || '');
  }
  
  function closeModal() {
    setShowModal(false);
    setSelected(null);
    setShowMessage(false);
    setShowReschedule(false);
    setNewScheduleDate('');
    setRemarks('');
  }

  // Action Functions
  function handleApprove() {
    if (!selected) return;
    
    const updatedRequests = requests.map(req => 
      req.id === selected.id 
        ? { ...req, status: 'Scheduled', remarks: remarks }
        : req
    );
    
    setRequests(updatedRequests);
    setSelected({ ...selected, status: 'Scheduled', remarks: remarks });
    
    alert('Request approved and scheduled successfully!');
  }

  function handleSchedule() {
    if (!selected) return;
    
    const updatedRequests = requests.map(req => 
      req.id === selected.id 
        ? { ...req, status: 'Scheduled', remarks: remarks }
        : req
    );
    
    setRequests(updatedRequests);
    setSelected({ ...selected, status: 'Scheduled', remarks: remarks });
    
    alert('Request scheduled successfully!');
  }

  function handleDecline() {
    if (!selected) return;
    
    const reason = prompt('Please provide a reason for declining this request:');
    if (reason === null) return; // User cancelled
    
    const updatedRequests = requests.map(req => 
      req.id === selected.id 
        ? { ...req, status: 'Declined', remarks: reason }
        : req
    );
    
    setRequests(updatedRequests);
    setSelected({ ...selected, status: 'Declined', remarks: reason });
    setRemarks(reason);
    
    alert('Request declined successfully!');
  }

  function handleReschedule() {
    if (!selected) return;
    setShowReschedule(true);
  }

  function confirmReschedule() {
    if (!newScheduleDate) {
      alert('Please select a new date');
      return;
    }
    
    const updatedRequests = requests.map(req => 
      req.id === selected.id 
        ? { ...req, preferred: newScheduleDate, remarks: remarks }
        : req
    );
    
    setRequests(updatedRequests);
    setSelected({ ...selected, preferred: newScheduleDate, remarks: remarks });
    setShowReschedule(false);
    setNewScheduleDate('');
    
    // Show success message
    alert('Request rescheduled successfully!');
  }

  function handleSendMessage() {
    setShowMessage(true);
  }

  function sendMessage() {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }
    
    const updatedRequests = requests.map(req => 
      req.id === selected.id 
        ? { ...req, remarks: remarks + '\n\nMessage sent: ' + messageText }
        : req
    );
    
    setRequests(updatedRequests);
    setSelected({ ...selected, remarks: remarks + '\n\nMessage sent: ' + messageText });
    setRemarks(remarks + '\n\nMessage sent: ' + messageText);
    setShowMessage(false);
    setMessageText('');
    
    // Show success message
    alert('Message sent successfully!');
  }

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 max-w-full overflow-x-auto bg-green-50 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading pickup requests...</p>
        </div>
      </div>
    );
  }

  // Debug: Show simple content first
  console.log('Component rendering, requests:', requests, 'loading:', loading, 'error:', error);

  // Simple fallback for debugging
  if (error) {
    return (
      <div className="p-6 bg-red-50 min-h-screen">
        <h1 className="text-2xl text-red-800 mb-4">Error Loading Pickup Requests</h1>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto bg-green-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 mb-2 font-normal tracking-tight">
          Special Pick-up Requests
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 m-0 font-normal">
          Manage, schedule, and track special waste pick-up requests from residents.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <FiX className="text-red-500" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters - Minimal Design */}
      <div className="flex gap-3 mb-6 items-center justify-center p-4 bg-white rounded-lg border border-green-200 flex-wrap">
        <select 
          value={barangay} 
          onChange={e => setBarangay(e.target.value)} 
          className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          {getUniqueBarangays(requests).map(b => <option key={b}>{b}</option>)}
        </select>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          <option>All</option>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Declined</option>
        </select>
        <input 
          type="date" 
          value={dateFrom} 
          onChange={e => setDateFrom(e.target.value)} 
          className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800" 
        />
        <input 
          type="date" 
          value={dateTo} 
          onChange={e => setDateTo(e.target.value)} 
          className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800" 
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50 border-b-2 border-green-200">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Request ID</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Barangay Head</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Address</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Waste Type</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Submitted</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Preferred</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-800 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 text-sm">No requests found matching the current filters.</td>
                  </tr>
                )}
                {filtered.map((req, i) => (
                  <tr key={req.id} className={`border-b border-green-200 transition-all duration-200 ${
                    i % 2 === 0 ? 'bg-green-50' : 'hover:bg-green-50'
                  }`}>
                    <td className="py-3 px-4 font-mono text-gray-700">{req.id}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <FiUser className="text-green-600" />
                      <span className="text-gray-700">{req.resident}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{req.address}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      {WASTE_ICONS[req.wasteType] || WASTE_ICONS.Other}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{req.submitted}</td>
                    <td className="py-3 px-4 text-gray-700">{req.preferred}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs ${STATUS_COLORS[req.status].bg} ${STATUS_COLORS[req.status].color}`}>
                        {STATUS_COLORS[req.status].icon} {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button 
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-all duration-200" 
                        title="View Details" 
                        onClick={() => openModal(req)}
                      >
                        View
                      </button>
                      <button 
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-all duration-200" 
                        title="Schedule Pickup"
                        onClick={() => {
                          openModal(req);
                          setTimeout(() => handleSchedule(), 100);
                        }}
                      >
                        Schedule
                      </button>
                      <button 
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-all duration-200" 
                        title="Decline Request"
                        onClick={() => {
                          openModal(req);
                          setTimeout(() => handleDecline(), 100);
                        }}
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 text-sm border border-green-200">
            No requests found matching the current filters.
          </div>
        )}
        {filtered.map((req, i) => (
          <div key={req.id} className="bg-white rounded-lg border border-green-200 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-gray-500">{req.id}</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs ${STATUS_COLORS[req.status].bg} ${STATUS_COLORS[req.status].color}`}>
                {STATUS_COLORS[req.status].icon} {req.status}
              </span>
            </div>
            
            {/* Waste Type */}
            <div className="flex items-center gap-2">
              {WASTE_ICONS[req.wasteType] || WASTE_ICONS.Other}
            </div>
            
            {/* Barangay Head */}
            <div className="flex items-center gap-2">
              <FiUser className="text-green-600" />
              <span className="text-gray-700 font-medium">{req.resident}</span>
            </div>
            
            {/* Address */}
            <div className="text-sm text-gray-600">{req.address}</div>
            
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Submitted:</span>
                <div className="text-gray-700">{req.submitted}</div>
              </div>
              <div>
                <span className="text-gray-500">Preferred:</span>
                <div className="text-gray-700">{req.preferred}</div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-all duration-200" 
                onClick={() => openModal(req)}
              >
                View
              </button>
              <button 
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-all duration-200" 
                onClick={() => {
                  openModal(req);
                  setTimeout(() => handleSchedule(), 100);
                }}
              >
                Schedule
              </button>
              <button 
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-all duration-200" 
                onClick={() => {
                  openModal(req);
                  setTimeout(() => handleDecline(), 100);
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-green-50 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-green-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 sm:mb-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-green-800">{selected.wasteType} Pick-up Request</h2>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs ${STATUS_COLORS[selected.status].bg} ${STATUS_COLORS[selected.status].color}`}>
                    {STATUS_COLORS[selected.status].icon} {selected.status}
                  </span>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-green-800 mb-3">Request Information</h3>
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-100">
                      <span className="font-medium text-green-700">Barangay Head:</span>
                      <span className="text-gray-600 sm:text-right">{selected.resident}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-100">
                      <span className="font-medium text-green-700">Address:</span>
                      <span className="text-gray-600 sm:text-right max-w-xs">{selected.address}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-100">
                      <span className="font-medium text-green-700">Barangay:</span>
                      <span className="text-gray-600 sm:text-right">{selected.barangay}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
                      <span className="font-medium text-green-700">Waste Type:</span>
                      <span className="text-gray-600 sm:text-right">{WASTE_ICONS[selected.wasteType] || WASTE_ICONS.Other}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Schedule & Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-green-800 mb-3">Schedule & Details</h3>
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-100">
                      <span className="font-medium text-green-700">Submitted:</span>
                      <span className="text-gray-600 sm:text-right">{selected.submitted}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-100">
                      <span className="font-medium text-green-700">Preferred Schedule:</span>
                      <span className="text-gray-600 sm:text-right">{selected.preferred}</span>
                    </div>
                    <div className="py-2">
                      <span className="font-medium text-green-700 block mb-2">Request Details:</span>
                      <div className="text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200 text-sm leading-relaxed">
                        {selected.details}
                      </div>
                    </div>
                    {selected.image && (
                      <div className="py-2">
                        <span className="font-medium text-green-700 block mb-2">Attached Image:</span>
                        <img src={selected.image} alt="Waste" className="max-w-full rounded-lg border border-green-200" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-3">Status Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                    <FiClock className="text-yellow-500 flex-shrink-0" />
                    <span className="text-green-700 font-medium">2025-05-10</span>
                    <span className="text-gray-700">Request Submitted</span>
                  </div>
                  {selected.status === 'Scheduled' && (
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                      <FiCalendar className="text-blue-500 flex-shrink-0" />
                      <span className="text-green-700 font-medium">2025-05-11</span>
                      <span className="text-gray-700">Scheduled by MENRO</span>
                    </div>
                  )}
                  {selected.status === 'Completed' && (
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span className="text-green-700 font-medium">2025-05-12</span>
                      <span className="text-gray-700">Pick-up Completed</span>
                    </div>
                  )}
                  {selected.status === 'Declined' && (
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                      <FiX className="text-red-500 flex-shrink-0" />
                      <span className="text-green-700 font-medium">2025-05-11</span>
                      <span className="text-gray-700">Request Declined</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              <div className="mb-6 bg-white p-4 rounded-lg border border-green-200">
                <label className="block font-medium text-green-700 mb-3">Remarks / Message to Resident:</label>
                <textarea 
                  className="w-full border border-green-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-800 resize-none bg-green-50 text-gray-800" 
                  rows={3} 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or message for the resident..."
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap sm:justify-between sm:items-center bg-white p-4 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap">
                  {selected.status === 'Pending' && (
                    <button 
                      className="flex items-center justify-center gap-2 px-5 py-2 bg-green-800 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 w-full sm:w-auto"
                      onClick={handleApprove}
                    >
                      <FiCheckCircle /> Approve
                    </button>
                  )}
                  {selected.status === 'Pending' && (
                    <button 
                      className="flex items-center justify-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-all duration-200 w-full sm:w-auto"
                      onClick={handleSchedule}
                    >
                      <FiCalendar /> Schedule
                    </button>
                  )}
                  {selected.status === 'Pending' && (
                    <button 
                      className="flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-all duration-200 w-full sm:w-auto"
                      onClick={handleDecline}
                    >
                      <FiX /> Decline
                    </button>
                  )}
                  {selected.status === 'Scheduled' && (
                    <button 
                      className="flex items-center justify-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-all duration-200 w-full sm:w-auto"
                      onClick={handleReschedule}
                    >
                      <FiEdit2 /> Reschedule
                    </button>
                  )}
                  <button 
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-green-100 text-green-800 rounded-lg font-medium hover:bg-green-200 transition-all duration-200 w-full sm:w-auto border border-green-300"
                    onClick={handleSendMessage}
                  >
                    <FiMessageCircle /> Send Message
                  </button>
                </div>
                <button 
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 w-full sm:w-auto border border-gray-300" 
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-green-50 rounded-lg p-6 w-full max-w-md mx-4 border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-4">Reschedule Pick-up</h3>
            <div className="mb-4 bg-white p-4 rounded-lg border border-green-200">
              <label className="block font-medium text-green-700 mb-2">New Preferred Date:</label>
              <input 
                type="date" 
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                className="w-full border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-800 bg-green-50 text-gray-800"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 w-full sm:w-auto border border-gray-300"
                onClick={() => setShowReschedule(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-800 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 w-full sm:w-auto"
                onClick={confirmReschedule}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-green-50 rounded-lg p-6 w-full max-w-md mx-4 border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-4">Send Message to Resident</h3>
            <div className="mb-4 bg-white p-4 rounded-lg border border-green-200">
              <label className="block font-medium text-green-700 mb-2">Message:</label>
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-800 resize-none bg-green-50 text-gray-800"
                rows={4}
                placeholder="Enter your message to the resident..."
              ></textarea>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 w-full sm:w-auto border border-gray-300"
                onClick={() => setShowMessage(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-800 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 w-full sm:w-auto"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
