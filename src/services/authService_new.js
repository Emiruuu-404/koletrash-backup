const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api'; // Replace koletrash.systemproj.com with your actual Hostinger domain

export const authService = {
  // For residents (users table)
  async signupResident(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/register_resident.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Resident signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Unified login for both residents and employees
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Map new backend fields to frontend expectations
      if (data.status === 'success' && data.data) {
        data.data.fullName = `${data.data.firstname || ''} ${data.data.lastname || ''}`.trim();
        data.data.id = data.data.user_id;
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get user data (residents)
  async getResidentData(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_resident.php?id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch resident data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get employee data (MENRO staff and barangay officials)
  async getEmployeeData(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_employee.php?id=${employeeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employee data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update resident profile
  async updateResidentProfile(userId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/update_resident.php`, {
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
        throw new Error(data.message || 'Failed to update resident profile');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update employee profile
  async updateEmployeeProfile(employeeId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/update_employee.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: employeeId,
          ...profileData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update employee profile');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Change password for residents
  async changeResidentPassword(userId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/change_resident_password.php`, {
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

  // Change password for employees
  async changeEmployeePassword(employeeId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/change_employee_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: employeeId,
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

  // Legacy method - will determine if user or employee and call appropriate method
  async getUserData(id) {
    const userType = localStorage.getItem('userType');
    if (userType === 'resident') {
      return this.getResidentData(id);
    } else {
      return this.getEmployeeData(id);
    }
  },

  // Legacy method - will determine if user or employee and call appropriate method
  async updateProfile(id, profileData) {
    const userType = localStorage.getItem('userType');
    if (userType === 'resident') {
      return this.updateResidentProfile(id, profileData);
    } else {
      return this.updateEmployeeProfile(id, profileData);
    }
  },

  // Legacy method - will determine if user or employee and call appropriate method
  async changePassword(id, currentPassword, newPassword) {
    const userType = localStorage.getItem('userType');
    if (userType === 'resident') {
      return this.changeResidentPassword(id, currentPassword, newPassword);
    } else {
      return this.changeEmployeePassword(id, currentPassword, newPassword);
    }
  },

  // Keep old signup method for backward compatibility
  async signup(userData) {
    return this.signupResident(userData);
  }
};
