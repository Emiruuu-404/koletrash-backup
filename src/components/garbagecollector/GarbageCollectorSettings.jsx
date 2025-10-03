import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack } from 'react-icons/io5';
import { FiUser, FiLock, FiBell, FiShield, FiAlertCircle, FiCheckCircle, FiSettings, FiClipboard } from 'react-icons/fi';
import { authService } from '../../services/authService';

export default function GarbageCollectorSettings() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    employeeId: '',
    assignedArea: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskUpdates: true,
    scheduleChanges: true,
    safetyAlerts: true,
    specialCollections: true
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
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
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
                employeeId: userData.employee_id || '',
                assignedArea: userData.assignedArea || '',
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
                employeeId: '',
                assignedArea: user.assignedArea || '',
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
              employeeId: '',
              assignedArea: user.assignedArea || '',
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
      const data = await garbageCollectorService.updateGarbageCollector({
        id: userId,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone,
        employeeId: formData.employeeId,
        assignedArea: formData.assignedArea
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
      const data = await garbageCollectorService.changePassword({
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
                <p className="text-sm text-gray-500">Manage your collector account</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-gray-600" />
            Profile Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Area</label>
                <input
                  type="text"
                  name="assignedArea"
                  value={formData.assignedArea}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter assigned area"
                />
              </div>
            </div>
            <button
              onClick={() => setConfirmAction('profile')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiLock className="w-5 h-5 text-gray-600" />
            Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setConfirmAction('password')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiBell className="w-5 h-5 text-gray-600" />
            Notification Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('email')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.email ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.email ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Receive mobile push notifications</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('push')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.push ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.push ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Task Updates</h3>
                <p className="text-sm text-gray-500">Get notified about task assignments and changes</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('taskUpdates')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.taskUpdates ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.taskUpdates ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Schedule Changes</h3>
                <p className="text-sm text-gray-500">Get notified about collection schedule updates</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('scheduleChanges')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.scheduleChanges ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.scheduleChanges ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Safety Alerts</h3>
                <p className="text-sm text-gray-500">Get important safety and emergency notifications</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('safetyAlerts')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.safetyAlerts ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.safetyAlerts ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Special Collections</h3>
                <p className="text-sm text-gray-500">Get notified about special collection requests</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('specialCollections')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.specialCollections ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 mx-1 my-1 bg-white rounded-full transition-transform ${
                  notifications.specialCollections ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
          </p>
          <button
            onClick={() => setConfirmAction('delete')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
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
        message="Are you sure you want to delete your account? This action cannot be undone."
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmAction(null)}
        type="danger"
      />
    </div>
  );
}
