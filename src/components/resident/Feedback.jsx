import React, { useState, useEffect } from 'react';
import { FiSend, FiUser, FiMapPin } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { feedbackService } from '../../services/feedbackService';
import { useNavigate } from 'react-router-dom';

export default function Feedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState('positive');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(null);
  const [error, setError] = useState('');
  const [profileWarning, setProfileWarning] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          setError('Please log in to submit feedback.');
          setIsLoading(false);
          navigate('/login');
          return;
        }

  const parsedUserData = JSON.parse(userData);
        
        // Set initial user data
  setUser(parsedUserData);
  setProfileWarning(!parsedUserData.barangay_name && !parsedUserData.barangay ? 'Barangay information is missing. We will submit your feedback with "Not Assigned" barangay. Please update your profile when possible.' : '');

        // Debug log to see what we have in localStorage
        console.log('User data from localStorage:', parsedUserData);
        
        // Then fetch additional details
        try {
          // Use user_id instead of id
          const userId = parsedUserData.user_id || parsedUserData.id;
          console.log('Fetching user details with ID:', userId);
          
          const response = await fetch(`https://koletrash.systemproj.com/backend/api/get_user_details.php?user_id=${userId}`);
          let userDetails;
          try {
            userDetails = await response.json();
          } catch (parseError) {
            console.warn('Failed to parse user details response:', parseError);
            userDetails = null;
          }
          
          console.log('API Response:', userDetails);
          
          if (response.ok && userDetails && userDetails.status === 'success' && userDetails.data) {
            // Log the raw data from API for debugging
            console.log('Raw user details:', userDetails.data);
            
            const barangayId = userDetails.data.barangay_id ?? parsedUserData.barangay_id ?? null;
            let barangayName = userDetails.data.barangay_name || userDetails.data.barangay || parsedUserData.barangay_name || parsedUserData.barangay || '';

            if (!barangayName && barangayId) {
              try {
                const barangayResponse = await fetch(`https://koletrash.systemproj.com/backend/api/get_barangay_details.php?barangay_id=${barangayId}`);
                const barangayData = await barangayResponse.json();
                console.log('Barangay API Response:', barangayData);
                if (barangayData.status === 'success' && barangayData.data && barangayData.data.barangay_name) {
                  barangayName = barangayData.data.barangay_name;
                }
              } catch (barangayError) {
                console.error('Error fetching barangay details:', barangayError);
              }
            }

            const normalizedData = {
              ...userDetails.data,
              barangay_id: barangayId,
              barangay_name: barangayName || 'Not Assigned',
            };

            setUser(prevUser => ({
              ...prevUser,
              ...normalizedData
            }));
            setProfileWarning(!barangayName ? 'Barangay information is missing. We will submit your feedback with "Not Assigned" barangay. Please update your profile when possible.' : '');
            console.log('Updated user data with barangay:', normalizedData);
          } else {
            console.warn('Could not fetch user details:', userDetails);
          }
        } catch (fetchError) {
          console.warn('Error fetching additional details:', fetchError);
          // Don't show error to user, continue with basic user data
        }

      } catch (e) {
        console.error('Error:', e);
        setError('Error loading user data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  // Debug user state
  useEffect(() => {
    if (user) {
      console.log('Current user state:', user);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!user) {
        throw new Error('Please log in to submit feedback');
      }

      // Validate required user information
      if (!user.firstname || !user.lastname) {
        throw new Error('Please complete your profile with your full name');
      }
      const barangayValue = user.barangay_name || user.barangay || 'Not Assigned';
      if (!user.barangay_name && !user.barangay) {
        setProfileWarning('Barangay information is missing. We will submit your feedback with "Not Assigned" barangay. Please update your profile when possible.');
      }

      // Prepare feedback data
      const feedbackData = {
        user_id: user.user_id || user.id,
        user_name: `${user.firstname} ${user.lastname}`, // Add full name
  barangay: barangayValue,
        rating: parseInt(rating),
        message: feedbackMessage.trim(),
        feedback_type: feedbackType,
        status: 'active'
      };

      // Debug log the complete feedback data
      console.log('Submitting feedback data:', feedbackData);

      const result = await feedbackService.submitFeedback(feedbackData);
      console.log('Feedback submission result:', result); // Debug log
      
      if (result.success) {
        setShowSuccess(true);
        setFeedbackMessage('');
        setFeedbackType('positive');
        setRating(5);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Submit Feedback</h1>
          <p className="text-gray-600 mb-6">
            We value your input! Help us improve our services.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {profileWarning && !error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 font-medium">{profileWarning}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading user details...</span>
            </div>
          ) : (
            <>
              {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-fadeIn">
                  <p className="text-green-700 font-medium">
                    Thank you for your feedback! We appreciate your input.
                  </p>
                </div>
              )}

              {/* User Info Display */}
              {user && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-green-600" />
                    <span className="text-gray-700">
                      {user.firstname && user.lastname 
                        ? `${user.firstname} ${user.lastname}`
                        : user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-green-600" />
                    <span className="text-gray-700">
                      {user.barangay_name || 'No barangay specified'}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you rate our service?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-3xl focus:outline-none transition-colors"
                      >
                        <FaStar 
                          className={`${
                            (hoverRating || rating) >= star 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {rating === 5 ? 'Excellent' :
                     rating === 4 ? 'Very Good' :
                     rating === 3 ? 'Good' :
                     rating === 2 ? 'Fair' :
                     'Poor'}
                  </p>
                </div>

                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                    required
                  >
                    <option value="positive">Positive Feedback</option>
                    <option value="negative">Negative Feedback</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Please share your detailed feedback with us..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                    required
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Rating Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-green-800 mb-4">Rating Guide</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex text-yellow-400">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <p className="text-gray-600">Excellent service</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-gray-300" />
              </div>
              <p className="text-gray-600">Very good service</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
              </div>
              <p className="text-gray-600">Good service</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
              </div>
              <p className="text-gray-600">Fair service</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
                <FaStar className="text-gray-300" />
              </div>
              <p className="text-gray-600">Poor service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
