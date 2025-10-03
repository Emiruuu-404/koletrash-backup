const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api'; // Replace koletrash.systemproj.com with your actual Hostinger domain

export const authService = {
  async signup(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async login({ username, password }) {
    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getUserData(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_user.php?id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateProfile(userId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          ...profileData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/change_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          currentPassword: currentPassword,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getBarangayHead(barangay) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_barangay_head.php?barangay=${encodeURIComponent(barangay)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch barangay head data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async submitIssueReport(reportData) {
    try {
      const response = await fetch(`${API_BASE_URL}/submit_issue_report.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit issue report');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async submitPickupRequest(requestData) {
    try {
      const response = await fetch(`${API_BASE_URL}/submit_pickup_request.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit pickup request');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getUserDetails(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_user_details.php?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user details');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getPickupRequests(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/get_pickup_requests.php?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch pickup requests');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async updatePickupRequestStatus(requestId, status, additionalData = {}) {
    try {
      const requestBody = {
        request_id: requestId,
        status: status,
        ...additionalData
      };
      
      console.log('Sending to API:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/update_pickup_request_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pickup request status');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};
