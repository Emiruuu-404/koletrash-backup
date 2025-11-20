import { buildApiUrl } from '../config/api';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('access_token');
  } catch (err) {
    console.warn('Unable to read access token', err);
    return null;
  }
};

const getAuthHeaders = (extra = {}) => {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const parseJsonResponse = async (response) => {
  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Response that failed to parse:', responseText);
    throw new Error('Invalid response from server');
  }
};

export const feedbackService = {
  submitFeedback: async (feedbackData) => {
    try {
      const required = ['user_id', 'user_name', 'barangay', 'rating', 'message', 'feedback_type'];
      const missing = required.filter((field) => {
        const value = feedbackData[field];
        return value === undefined || value === null || value === '';
      });

      if (missing.length > 0) {
        throw new Error(`Missing or empty required fields: ${missing.join(', ')}`);
      }

      const payload = {
        ...feedbackData,
        rating: parseInt(feedbackData.rating, 10),
      };

      const response = await fetch(buildApiUrl('submit_feedback.php'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.status === 'success') {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }

      throw new Error(data.message || 'Failed to submit feedback');
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getAllFeedback: async () => {
    try {
      const response = await fetch(buildApiUrl('get_all_feedback.php'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.status === 'success') {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data : [],
          message: data.message,
        };
      }

      throw new Error(data.message || 'Failed to fetch feedback');
    } catch (error) {
      console.error('Error in getAllFeedback:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },
};
