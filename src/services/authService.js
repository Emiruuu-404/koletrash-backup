import { API_BASE_URL, buildApiUrl } from '../config/api';

const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.warn('Unable to access stored token:', error);
    return null;
  }
};

const withAuthHeaders = (headers = {}) => {
  const token = getAccessToken();
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return { ...headers };
};

const ASSET_ROOT_URL = (() => {
  try {
  const normalized = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    // Navigate two levels up (remove /backend/api)
    const backendUrl = new URL('../', normalized);
    const rootUrl = new URL('../', backendUrl);
    return rootUrl.href.replace(/\/$/, '');
  } catch (error) {
    console.error('Failed to compute asset root URL:', error);
    return '';
  }
})();

const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const sanitized = path.replace(/^\/+/, '');
  if (!ASSET_ROOT_URL) {
    return `/${sanitized}`;
  }
  return `${ASSET_ROOT_URL}/${sanitized}`;
};

export const authService = {
  resolveAssetUrl(path) {
    return resolveAssetUrl(path);
  },
  async signup(userData) {
    try {
  const response = await fetch(buildApiUrl('register.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl('login.php'), {
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
  const response = await fetch(buildApiUrl(`get_user.php?id=${userId}`), {
        method: 'GET',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl('update_profile.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl('change_password.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl(`get_barangay_head.php?barangay=${encodeURIComponent(barangay)}`), {
        method: 'GET',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
      });

      const contentType = response.headers?.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message = isJson ? (payload?.message || 'Failed to fetch barangay head data') : 'Failed to fetch barangay head data';
        throw new Error(message);
      }

      if (!isJson) {
        return { status: 'success', data: null };
      }

      return payload;
    } catch (error) {
      throw error;
    }
  },

  async submitIssueReport(reportData) {
    try {
  const response = await fetch(buildApiUrl('submit_issue_report.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl('submit_pickup_request.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
  const response = await fetch(buildApiUrl(`get_user_details.php?user_id=${userId}`), {
        method: 'GET',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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

  const response = await fetch(buildApiUrl(`get_pickup_requests.php?${params}`), {
        method: 'GET',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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
      
  const response = await fetch(buildApiUrl('update_pickup_request_status.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
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

  async uploadProfileImage(formData) {
    try {
  const response = await fetch(buildApiUrl('upload_profile_image.php'), {
        method: 'POST',
        headers: withAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data?.message || 'Failed to upload profile image');
        error.status = response.status;
        error.payload = data;
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async logout(userId) {
    try {
      const response = await fetch(buildApiUrl('logout.php'), {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      // Don't throw error if logout API fails - still proceed with logout
      if (!response.ok) {
        console.warn('Logout API call failed:', data.message || 'Failed to logout');
      }

      return data;
    } catch (error) {
      // Silently fail - still proceed with logout
      console.warn('Logout API call error:', error);
      return { status: 'error', message: error.message };
    }
  },
};
