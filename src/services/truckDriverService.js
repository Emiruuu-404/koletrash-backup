const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api'; // Replace koletrash.systemproj.com with your actual Hostinger domain

export const truckDriverService = {
  async getTruckDriver(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/get_truck_driver.php?id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch truck driver data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateTruckDriver(updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/update_truck_driver.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update truck driver profile');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await fetch(`${API_BASE_URL}/change_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}; 
