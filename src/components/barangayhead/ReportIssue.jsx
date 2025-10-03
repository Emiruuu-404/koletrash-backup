import React, { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiAlertCircle, FiCamera, FiCheckCircle, FiChevronDown, FiChevronUp, FiTag } from 'react-icons/fi';
import { authService } from '../../services/authService';
import axios from 'axios';

const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api';

const issueTypes = [
  'Missed Collection', 'Overflowing Bins', 'Illegal Dumping', 'Damaged Bin', 'Other'
];

export default function ReportIssue() {
  // State for user data and loading
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    barangay: '',
    issueType: '',
    description: '',
    photo: null,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showIssueType, setShowIssueType] = useState(false);

  // Fetch user data from database on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage to get the user ID
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userDataLocal = JSON.parse(storedUser);
          console.log('Local storage user data:', userDataLocal); // Debug log
          
          // Get user_id and role, checking all possible properties
          const userId = userDataLocal.user_id || userDataLocal.id || userDataLocal.userId;
          const userRole = userDataLocal.role || userDataLocal.user_type || userDataLocal.userType;
          
          // Debug log all possible ID fields
          console.log('User data fields:', {
            user_id: userDataLocal.user_id,
            id: userDataLocal.id,
            userId: userDataLocal.userId,
            role: userDataLocal.role,
            user_type: userDataLocal.user_type,
            userType: userDataLocal.userType
          });
          
          if (!userId) {
            throw new Error('User ID not found in stored data');
          }
          
          console.log('Using user ID:', userId, 'Role:', userRole); // Debug log
          
          // We'll verify the role after getting fresh data from the database
          // Fetch user details from database using the get_user endpoint
          const response = await axios.get(`${API_BASE_URL}/get_user.php`, {
            params: { id: userId }
          });
          
          console.log('API Response:', response.data); // Debug log
          
          if (response.data.status === 'success') {
            const user = response.data.data;
            console.log('User data from API:', {
              id: user.user_id,
              name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
              role: user.role,
              barangay: user.barangay_id || user.barangay
            });

            // Verify the user is a barangay head using the role from database
            if (user.role !== 'Barangay Head' && user.role !== 'barangay_head') {
              console.log('Invalid role:', user.role);
              throw new Error('Access denied. Only barangay heads can access this page.');
            }
            setUserData(user);
            setForm(prevForm => ({
              ...prevForm,
              name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
              barangay: user.barangay_id || user.barangay
            }));
          } else {
            console.error('Failed to fetch user data:', response.data.message);
            setError('Failed to load user data. Please try again.');
          }
        } else {
          setError('No user data found. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Determine the specific error case
        if (error.message === 'Network Error') {
          console.log('Network error details:', error);
          setError('Unable to connect to server. Please check your connection and try again.');
        } else if (error.message.includes('User ID not found')) {
          setError('Session expired. Please log out and log in again.');
        } else if (error.message.includes('Access denied')) {
          setError('Access denied. This page is only accessible to barangay heads.');
        } else if (error.response?.data?.message) {
          if (error.response.data.message.includes('User ID is required')) {
            setError('Session error. Please log out and log in again.');
          } else {
            setError(`Error: ${error.response.data.message}`);
          }
        } else {
          setError('Error loading user data. Please try refreshing the page.');
        }

        // Log full error details
        if (error.response) {
          console.log('Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.log('Error request:', {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value,
    }));
  }

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setForm(prev => ({ ...prev, photo: selectedFile }));
      setError(''); // Clear any previous errors
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate required fields
    if (!form.issueType || !form.description) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!form.barangay) {
      setError('Barangay information is missing. Please contact support.');
      return;
    }

    // Submit to backend
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('reporter_id', userData?.user_id); // Using user_id from userData
      formData.append('reporter_name', form.name);
      formData.append('barangay', form.barangay);
      formData.append('issue_type', form.issueType);
      formData.append('description', form.description);
      formData.append('table', 'issue_reports'); // Use the correct table name
      if (form.photo) {
        formData.append('photo', form.photo);
      }

      const response = await axios.post(`${API_BASE_URL}/submit_issue_report.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.status === 'success') {
        setSuccess(true);
        // Reset form but keep name and barangay
        setForm(prevForm => ({ 
          ...prevForm, 
          issueType: '', 
          description: '', 
          photo: null 
        }));
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(response.data.message || 'Failed to submit issue report');
      }
    } catch (error) {
      console.error('Error submitting issue report:', error);
      setError(error.response?.data?.message || error.message || 'Failed to submit issue report. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-8 px-2">
      <form
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-green-100 p-6 flex flex-col gap-5 animate-fadeIn"
        onSubmit={handleSubmit}
        style={{ fontFamily: 'inherit' }}
      >
        <h2 className="text-2xl font-bold text-green-800 mb-2 text-center tracking-tight">Submit Report Issue</h2>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
            <FiAlertCircle /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded px-3 py-2 text-sm">
            <FiCheckCircle /> Report submitted successfully!
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
            value={form.barangay} 
            disabled 
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none text-base" 
          />
        </div>

        {/* Issue Type - Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiTag className="text-green-500" /> Issue Type
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIssueType(!showIssueType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <span>{form.issueType || 'Select issue type'}</span>
              {showIssueType ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {showIssueType && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {issueTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-green-50 text-gray-700"
                    onClick={() => {
                      setForm(prev => ({ ...prev, issueType: type }));
                      setShowIssueType(false);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows="4"
            placeholder="Describe the issue in detail..."
          />
        </div>

        {/* Photo Upload */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-0.5">
            <FiCamera className="text-green-500" /> Photo
          </label>
          <input
            type="file"
            name="photo"
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center justify-center gap-2"
          >
            <FiCamera />
            {form.photo ? form.photo.name : 'Choose a photo'}
          </label>
          {form.photo && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(form.photo)}
                alt="Selected"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
