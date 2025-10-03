import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack } from 'react-icons/io5';
import { FiUser, FiLock, FiBell, FiShield, FiAlertCircle, FiCheckCircle, FiSettings, FiTruck, FiMapPin } from 'react-icons/fi';
import { authService } from '../../services/authService';

export default function TruckDriverSettings() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    licenseNumber: '',
    truckAssigned: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    routeUpdates: true,
    maintenance: true,
    safetyAlerts: true,
    scheduleChanges: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null); // 'profile' | 'password' | 'delete' | null

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          // Fetch fresh data from database using authService
          const userId = user.user_id || user.id;
          if (userId) {
            const response = await authService.getUserData(userId);
            if (response.status === 'success') {
              const userData = response.data;
              setFormData({
                firstname: userData.firstname || '',
                lastname: userData.lastname || '',
                email: userData.email || '',
                phone: userData.phone || '',
                licenseNumber: userData.license_number || '',
                truckAssigned: userData.truck_assigned || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
            } else {
              setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                phone: user.phone || '',
                licenseNumber: '',
                truckAssigned: '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
            }
          } else {
            setFormData({
              firstname: user.firstname || '',
              lastname: user.lastname || '',
              email: user.email || '',
              phone: user.phone || '',
              licenseNumber: '',
              truckAssigned: '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      }
    };
    loadUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProfileUpdate = async () => {
    const userId = userData?.user_id || userData?.id;
    if (!userId) {
      setError('User data not found');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await truckDriverService.updateTruckDriver({
        id: userId,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        truckAssigned: formData.truckAssigned
      });
      if (data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.data));
        setUserData(data.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const userId = userData?.user_id || userData?.id;
    if (!userId) {
      setError('User data not found');
      return;
    }
    if (!formData.currentPassword || !formData.newPassword) {
      setError('Please fill in all password fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await truckDriverService.changePassword({
        id: userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      if (data.status === 'success') {
        setSuccess('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // TODO: Add your API call or logic for deleting the account here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Account deleted successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {type === 'danger' ? (
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
              >
                <IoChevronBack className="w-5 h-5 text-gray-700" />
              </button>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-md">
                <FiSettings className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your driver account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUser className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Driver Profile</h2>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Truck</label>
              <input
                type="text"
                name="truckAssigned"
                value={formData.truckAssigned}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter assigned truck number"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setConfirmAction('profile')}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiLock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500">Change your password</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setConfirmAction('password')}
              disabled={loading || !formData.currentPassword || !formData.newPassword}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Choose what notifications you want to receive</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries({
              email: 'Email Notifications',
              push: 'Push Notifications',
              routeUpdates: 'Route Updates',
              maintenance: 'Maintenance Reminders',
              safetyAlerts: 'Safety Alerts',
              scheduleChanges: 'Schedule Changes'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium">{label}</span>
                <button
                  onClick={() => handleNotificationToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[key] ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiShield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
              <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setConfirmAction('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={confirmAction === 'profile'}
        title="Update Profile"
        message="Are you sure you want to update your profile information?"
        onConfirm={handleProfileUpdate}
        onCancel={() => setConfirmAction(null)}
        type="success"
      />

      <ConfirmationModal
        isOpen={confirmAction === 'password'}
        title="Change Password"
        message="Are you sure you want to change your password?"
        onConfirm={handlePasswordChange}
        onCancel={() => setConfirmAction(null)}
        type="success"
      />

      <ConfirmationModal
        isOpen={confirmAction === 'delete'}
        title="Delete Account"
        message="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmAction(null)}
        type="danger"
      />
    </div>
  );
}
