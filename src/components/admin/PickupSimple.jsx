import React, { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw, FiDownload, FiUser, FiMapPin, FiCalendar, FiClock, FiCheckCircle, FiX, FiEye, FiImage } from 'react-icons/fi';
import { authService } from '../../services/authService';

export default function PickupSimple() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barangay, setBarangay] = useState('All');
  const [status, setStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data...');
        
        const response = await authService.getPickupRequests();
        console.log('Response:', response);
        
        if (response && response.status === 'success') {
          setRequests(response.data || []);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic
  const filtered = (requests || []).filter(req =>
    (barangay === 'All' || req.barangay === barangay) &&
    (status === 'All' || req.status === status) &&
    (searchTerm === '' || 
     req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.barangay?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     req.waste_type?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(req => req.status === 'pending').length,
    scheduled: requests.filter(req => req.status === 'scheduled').length,
    completed: requests.filter(req => req.status === 'completed').length,
    declined: requests.filter(req => req.status === 'declined').length
  };

  // Get unique barangays
  const getUniqueBarangays = (requests) => {
    if (!requests || !Array.isArray(requests)) return ['All'];
    const barangays = ['All'];
    const uniqueBarangays = [...new Set(requests.map(req => req.barangay).filter(Boolean))];
    return [...barangays, ...uniqueBarangays.sort()];
  };

  // Modal functions
  const openModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setShowModal(false);
  };

  // Action functions
  const handleSchedule = async (request) => {
    try {
      setActionLoading(true);
      console.log('Scheduling request:', request);
      console.log('Request ID:', request.id || request.request_id);
      
      const response = await authService.updatePickupRequestStatus(
        request.id || request.request_id,
        'scheduled',
        { admin_remarks: 'Request scheduled by admin' }
      );
      
      if (response.status === 'success') {
        // Update the request in the list
        setRequests(prevRequests => 
          prevRequests.map(req => 
            (req.id || req.request_id) === (request.id || request.request_id)
              ? { ...req, status: 'scheduled' }
              : req
          )
        );
        
        // Update the selected request in modal
        setSelectedRequest(prev => ({ ...prev, status: 'scheduled' }));
        
        alert('Request scheduled successfully!');
      } else {
        alert('Failed to schedule request: ' + response.message);
      }
    } catch (error) {
      console.error('Error scheduling request:', error);
      alert('Failed to schedule request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (request) => {
    const reason = prompt('Please provide a reason for declining this request:');
    if (reason === null || reason.trim() === '') return; // User cancelled or empty
    
    try {
      setActionLoading(true);
      const response = await authService.updatePickupRequestStatus(
        request.id || request.request_id,
        'declined',
        { declined_reason: reason }
      );
      
      if (response.status === 'success') {
        // Update the request in the list
        setRequests(prevRequests => 
          prevRequests.map(req => 
            (req.id || req.request_id) === (request.id || request.request_id)
              ? { ...req, status: 'declined', declined_reason: reason }
              : req
          )
        );
        
        // Update the selected request in modal
        setSelectedRequest(prev => ({ ...prev, status: 'declined', declined_reason: reason }));
        
        alert('Request declined successfully!');
      } else {
        alert('Failed to decline request: ' + response.message);
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-green-50 min-h-screen">
        <h1 className="text-2xl text-green-800 mb-4">Loading...</h1>
        <p>Fetching pickup requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 min-h-screen">
        <h1 className="text-2xl text-red-800 mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 mb-2 font-normal tracking-tight">
          Special Pick-up Requests
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 m-0 font-normal">
          Manage, schedule, and track special waste pick-up requests from residents.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FiDownload className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option>All Status</option>
          <option>pending</option>
          <option>scheduled</option>
          <option>completed</option>
          <option>declined</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUser className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REQUESTER</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WASTE TYPE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BARANGAY</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No requests found matching the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((req, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{req.requester_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{req.waste_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiMapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{req.barangay}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status === 'pending' && <FiClock className="w-3 h-3" />}
                      {req.status === 'scheduled' && <FiCalendar className="w-3 h-3" />}
                      {req.status === 'completed' && <FiCheckCircle className="w-3 h-3" />}
                      {req.status === 'declined' && <FiX className="w-3 h-3" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openModal(req)}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                    >
                      <FiEye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Pick-up Request Details</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requester_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <p className="text-sm text-gray-900">{selectedRequest.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                    <p className="text-sm text-gray-900">{selectedRequest.barangay}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
                    <p className="text-sm text-gray-900">{selectedRequest.waste_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Pickup Date</label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.pickup_date ? new Date(selectedRequest.pickup_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequest.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedRequest.status === 'pending' && <FiClock className="w-3 h-3" />}
                      {selectedRequest.status === 'scheduled' && <FiCalendar className="w-3 h-3" />}
                      {selectedRequest.status === 'completed' && <FiCheckCircle className="w-3 h-3" />}
                      {selectedRequest.status === 'declined' && <FiX className="w-3 h-3" />}
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
                
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
                  </div>
                )}
                
                {selectedRequest.declined_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decline Reason</label>
                    <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">{selectedRequest.declined_reason}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleSchedule(selectedRequest)}
                      disabled={actionLoading}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        actionLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : 'Schedule'}
                    </button>
                    <button 
                      onClick={() => handleDecline(selectedRequest)}
                      disabled={actionLoading}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        actionLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : 'Decline'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
