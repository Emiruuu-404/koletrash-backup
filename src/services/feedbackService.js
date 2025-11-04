import { buildApiUrl } from '../config/api';


export const feedbackService = {
    getAllFeedback: async () => {
        try {
            const response = await fetch(`${API_URL}/get_feedback.php`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Response that failed to parse:', responseText);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(data?.message || `HTTP error! status: ${response.status}`);
            }

            if (data.status === 'success') {
                return {
                    success: true,
                    data: Array.isArray(data.data) ? data.data : [],
                    message: data.message
                };
            }

            throw new Error(data.message || 'Failed to fetch feedback');
        } catch (error) {
            console.error('Error in getAllFeedback:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    submitFeedback: async (feedbackData) => {
        try {
            // Validate all required fields are present and not empty
            const required = ['user_id', 'barangay', 'rating', 'message', 'feedback_type'];
            const missing = required.filter(field => {
                const value = feedbackData[field];
                return value === undefined || value === null || value === '';
            });
            
            if (missing.length > 0) {
                throw new Error(`Missing or empty required fields: ${missing.join(', ')}`);
            }

            // Ensure rating is a number
            feedbackData.rating = parseInt(feedbackData.rating);

            const response = await fetch(buildApiUrl('submit_feedback.php'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            // Always get the response text first
            const responseText = await response.text();
            // Removed logDebug

            // Try to parse the response
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Response that failed to parse:', responseText);
                throw new Error('Invalid response from server');
            }

            // Now check if the response was ok
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            if (data.status === 'success') {
                return { 
                    success: true, 
                    data: data.data,
                    message: data.message 
                };
            } else {
                throw new Error(data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error in submitFeedback:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    getAllFeedback: async () => {
        try {
            // Removed logDebug
            const response = await fetch(buildApiUrl('get_all_feedback.php'), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Removed logDebug
            const responseText = await response.text();
            // Removed logDebug

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
            }

            // Removed logDebug

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            if (data.status === 'success') {
                return {
                    success: true,
                    data: data.data || [],
                    message: data.message
                };
            } else {
                throw new Error(data.message || 'Failed to fetch feedback');
            }
        } catch (error) {
            console.error('Error in getAllFeedback:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }
};
