import React, { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiPhone, FiCalendar, FiCheckCircle, FiAlertCircle, FiBox } from 'react-icons/fi';
import { authService } from '../../services/authService';

export default function PickupRequest() {
  // State for user data and loading
  const [userData, setUserData] = useState(null);
  const [barangayHeadData, setBarangayHeadData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: '',
    barangay: '',
    contact: '',
    date: today, // Set default date to today
    type: '',
    notes: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch user data and barangay head data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage first to get the user ID
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userDataLocal = JSON.parse(storedUser);
          console.log('Local storage user data:', userDataLocal); // Debug log
          
          // Get user_id and role, checking all possible properties
          const userId = userDataLocal.user_id || userDataLocal.id || userDataLocal.userId;
          
          console.log('Using user ID:', userId); // Debug log
          
          // Fetch fresh data from database using the user ID
          if (userId) {
            const response = await authService.getUserData(userId);
            if (response.status === 'success') {
              const user = response.data;
              console.log('User data from API:', user); // Debug log
              setUserData(user);
              setForm(prevForm => ({
                ...prevForm,
                name: user.full_name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Barangay Head User',
                barangay: user.barangay || '',
                contact: user.phone || ''
              }));

              // Fetch barangay head data if we have a barangay
              const userBarangay = user.barangay;
              if (userBarangay) {
                try {
                  const barangayHeadResponse = await authService.getBarangayHead(userBarangay);
                  if (barangayHeadResponse.status === 'success') {
                    setBarangayHeadData(barangayHeadResponse.data);
                  }
                } catch (barangayHeadError) {
                  console.error('Error fetching barangay head data:', barangayHeadError);
                }
              }
            } else {
              console.error('Failed to fetch user data:', response.message);
              // Fallback to stored data
              setUserData(userDataLocal);
              setForm(prevForm => ({
                ...prevForm,
                name: userDataLocal.full_name || userDataLocal.fullName || userDataLocal.name || 'Barangay Head User',
                barangay: userDataLocal.barangay || userDataLocal.assignedArea || '',
                contact: userDataLocal.phone || ''
              }));
            }
          } else {
            // Use stored data if no ID
            setUserData(userDataLocal);
            setForm(prevForm => ({
              ...prevForm,
              name: userDataLocal.full_name || userDataLocal.fullName || userDataLocal.name || 'Barangay Head User',
              barangay: userDataLocal.barangay || userDataLocal.assignedArea || '',
              contact: userDataLocal.phone || ''
            }));
          }
        } else {
          setError('No user data found. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error loading user data');
        // Try to use stored data as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userDataLocal = JSON.parse(storedUser);
            setUserData(userDataLocal);
            setForm(prevForm => ({
              ...prevForm,
              name: userDataLocal.full_name || userDataLocal.fullName || userDataLocal.name || 'Barangay Head User',
              barangay: userDataLocal.barangay || userDataLocal.assignedArea || '',
              contact: userDataLocal.phone || ''
            }));
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.contact || !form.date || !form.type) {
      setError('Please fill in all required fields.');
      return;
    }

    // Submit to backend
    const submitRequest = async () => {
      try {
        setLoading(true);
        
        const requestData = {
          requester_id: userData?.id,
          requester_name: form.name,
          barangay: form.barangay,
          contact_number: form.contact,
          pickup_date: form.date,
          waste_type: form.type,
          notes: form.notes || ''
        };

        console.log('Sending request data:', requestData); // Debug log
        console.log('UserData:', userData); // Debug log
        console.log('Form data:', form); // Debug log

        const response = await authService.submitPickupRequest(requestData);
        
        if (response.status === 'success') {
          setSuccess(true);
          // Reset form but keep name, barangay, and contact
          setForm(prevForm => ({ 
            ...prevForm, 
            date: today,
            type: '', 
            notes: ''
          }));
          setTimeout(() => setSuccess(false), 5000);
        } else {
          setError(response.message || 'Failed to submit pickup request');
        }
      } catch (error) {
        console.error('Error submitting pickup request:', error);
        setError(error.message || 'Failed to submit pickup request. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    submitRequest();
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-8 px-2">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  const filteredBarangays = [];

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-8 px-2">
      <form
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-green-100 p-6 flex flex-col gap-5 animate-fadeIn"
        onSubmit={handleSubmit}
        style={{ fontFamily: 'inherit' }}
      >
        <h2 className="text-2xl font-bold text-green-800 mb-2 text-center tracking-tight">Special Pick-up Request</h2>
        
        {/* Display barangay head info if available */}
        {barangayHeadData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold text-green-800 mb-1">Barangay Head Information</h3>
            <p className="text-xs text-green-700">
              <strong>Name:</strong> {barangayHeadData.name}
            </p>
            <p className="text-xs text-green-700">
              <strong>Barangay:</strong> {barangayHeadData.barangay}
            </p>
            {barangayHeadData.email && (
              <p className="text-xs text-green-700">
                <strong>Email:</strong> {barangayHeadData.email}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
            <FiAlertCircle /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded px-3 py-2 text-sm">
            <FiCheckCircle /> Request submitted successfully!
          </div>
        )}

        {/* Name - Disabled */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiUser className="text-green-500" /> Name
          </label>
          <input 
            type="text" 
            name="name" 
            value={form.name} 
            disabled 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none text-base" 
          />
        </div>

        {/* Barangay - Disabled */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiMapPin className="text-green-500" /> Barangay
          </label>
          <input 
            type="text" 
            name="barangay" 
            value={form.barangay || 'Not assigned'} 
            disabled 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none text-base" 
          />
        </div>
        {/* Contact Number */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiPhone className="text-green-500" /> Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 text-base"
            placeholder="e.g. 09XXXXXXXXX"
            required
          />
        </div>
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiCalendar className="text-green-500" /> Preferred Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={today} // Prevent past dates
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 text-base"
            required
          />
        </div>
        {/* Type of Waste */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiBox className="text-green-500" /> Type of Waste <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 text-base"
            placeholder="e.g. Bulky, Hazardous, Recyclable, etc."
            required
          />
        </div>
        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 text-base resize-none"
            placeholder="Additional details..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
