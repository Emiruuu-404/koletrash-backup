import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiX, FiMessageSquare } from 'react-icons/fi';
import {
  HomeIcon,
  CalendarIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';

const navigation = [
  { name: 'Home', href: '/garbagecollector', icon: HomeIcon },
  { name: 'Collection Schedule', href: '/garbagecollector/schedule', icon: CalendarIcon },
  { name: 'Routes', href: '/garbagecollector/routes', icon: MapIcon },
  { name: 'Tasks', href: '/garbagecollector/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Notifications', href: '/garbagecollector/notifications', icon: BellIcon },
  { name: 'Settings', href: '/garbagecollector/settings', icon: Cog6ToothIcon },
];

export default function GarbageCollectorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage first to get the user ID
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Fetch fresh data from database using the user ID
          if (userData.id) {
            const response = await authService.getUserData(userData.id);
            if (response.status === 'success') {
              setUser(response.data);
            } else {
              console.error('Failed to fetch user data:', response.message);
              // Fallback to stored data
              setUser(userData);
            }
          } else {
            // Use stored data if no ID
            setUser(userData);
          }
        } else {
          console.warn('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Try to use stored data as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // User profile from database
  const userProfile = {
    name: user?.fullName || 'Loading...',
    role: user?.role || 'Garbage Collector',
    avatar: user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'G',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    // Clear user data from localStorage
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setShowFeedback(false);
    setFeedback('');
    alert('Thank you for your feedback!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 w-full max-w-full relative">
      {/* Loading state */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-700 font-medium">Loading user data...</p>
          </div>
        </div>
      )}

      {/* Hamburger Menu Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
          <div className="relative bg-white w-[280px] max-w-[85%] h-full shadow-xl z-50 animate-fadeInLeft flex flex-col">
            {/* Profile Section */}
            <div className="bg-gradient-to-b from-green-800 to-green-700 px-4 py-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-green-800 font-bold text-lg">{userProfile.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-base truncate">{userProfile.name}</h2>
                <p className="text-green-100 text-sm">{userProfile.role}</p>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/garbagecollector' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors
                        ${isActive ? 'bg-green-50/80 text-green-900 border-2 border-green-700' : 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'}
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Logout Button */}
                <button
                  className="flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 mt-4"
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="ml-3 text-sm font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-sm w-full flex flex-col items-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-emerald-700 mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-700 text-center">Are you sure you want to log out?</p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition focus:outline-emerald-700 focus:ring-2 focus:ring-red-200"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
              <button
                className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-emerald-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-emerald-700 focus:ring-2 focus:ring-emerald-100"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-green-800 px-4 py-3 sticky top-0 z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
        >
          <FiMenu className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
        </button>
        <span 
          className="text-white font-bold text-lg tracking-wide cursor-pointer hover:text-green-200 transition-colors duration-150"
          onClick={() => navigate('/garbagecollector')}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            onClick={() => navigate('/garbagecollector/notifications')}
          >
            <FiBell className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Outlet />
      </div>
      
      {/* Feedback Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-green-700 text-white p-3 rounded-full shadow-lg hover:bg-green-800 focus:outline-green-700 flex items-center gap-2"
        aria-label="Send Feedback"
        onClick={() => setShowFeedback(true)}
      >
        <FiMessageSquare className="w-6 h-6" />
      </button>
      
      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
          <form className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center" onSubmit={handleFeedbackSubmit}>
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-xl font-bold text-green-700">Send Feedback</h2>
              <button 
                type="button"
                onClick={() => setShowFeedback(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-green-700"
              rows={4}
              placeholder="Your feedback..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
            />
            <div className="flex gap-4 w-full">
              <button
                type="submit"
                className="flex-1 py-2 rounded bg-green-700 text-white font-semibold hover:bg-green-800 transition focus:outline-green-700"
              >
                Submit
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded bg-gray-200 text-green-700 font-semibold hover:bg-gray-300 transition focus:outline-green-700"
                onClick={() => setShowFeedback(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Footer */}
      <footer className="mt-auto text-xs text-center text-white bg-green-800 py-2 w-full">
        © 2025 Municipality of Sipocot – MENRO. All rights reserved.
      </footer>
    </div>
  );
}
