import React, { useState, useEffect } from 'react';
import { FiSend, FiUser, FiMapPin } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { feedbackService } from '../../services/feedbackService';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Feedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState('positive'); // Default to positive
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(null);
  const [error, setError] = useState('');
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

        // Debug log to see what we have in localStorage
        console.log('User data from localStorage:', parsedUserData);
        
        // Then fetch additional details
        try {
          // Use user_id instead of id
          const userId = parsedUserData.user_id || parsedUserData.id;
          console.log('Fetching user details with ID:', userId);
          
          const response = await fetch(`https://koletrash.systemproj.com/backend/api/get_user_details.php?user_id=${userId}`);
          const userDetails = await response.json();
          
          console.log('API Response:', userDetails);
          
          if (userDetails.status === 'success' && userDetails.data) {
            // Log the raw data from API for debugging
            console.log('Raw user details:', userDetails.data);
            
            let barangayName = null;
            const barangayId = userDetails.data.barangay_id;

            if (barangayId) {
              try {
                // Fetch barangay name using separate API call
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

            const userData = {
              ...userDetails.data,
              barangay_id: barangayId,
              barangay_name: barangayName || userDetails.data.barangay_name
            };

            setUser(prevUser => ({
              ...prevUser,
              ...userData
            }));
            console.log('Updated user data with barangay:', userData);
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
      if (!user.barangay_name) {
        throw new Error('Barangay information is missing. Please update your profile.');
      }

      // Prepare feedback data
      const feedbackData = {
        user_id: user.user_id || user.id,
        user_name: `${user.firstname} ${user.lastname}`,
        barangay: user.barangay_name,
        rating: parseInt(rating),
        message: feedbackMessage.trim(),
        feedback_type: feedbackType,
        status: 'active'
      };

      // Debug log the complete feedback data
      console.log('Submitting feedback data:', feedbackData);

      const result = await feedbackService.submitFeedback(feedbackData);
      console.log('Feedback submission result:', result);
      
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
    <div className="flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">Submit Feedback</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            We value your input! Help us improve our services.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 font-medium">{error}</p>
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
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-green-600 text-sm sm:text-base" />
                    <span className="text-sm sm:text-base text-gray-700">
                      {user.firstname && user.lastname 
                        ? `${user.firstname} ${user.lastname}`
                        : 'Name not available'}
                    </span>
                  </div>
                  {user.barangay_name && (
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-green-600 text-sm sm:text-base" />
                      <span className="text-sm sm:text-base text-gray-700">{user.barangay_name}</span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex justify-center sm:justify-start gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center focus:outline-none transition-colors"
                      >
                        <FaStar
                          className={`text-xl sm:text-2xl ${
                            (hoverRating || rating) >= star
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                {/* Feedback Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Please share your thoughts..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !feedbackMessage.trim()}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors
                    ${
                      isSubmitting || !feedbackMessage.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
