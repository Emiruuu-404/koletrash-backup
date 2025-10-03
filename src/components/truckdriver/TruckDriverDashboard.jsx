import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronRight, FiX, FiSettings, FiMessageSquare } from 'react-icons/fi';
import { MdHome, MdReport, MdEvent, MdMenuBook, MdLogout, MdPerson } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  FiCalendar, 
  FiCheckSquare, 
  FiMapPin, 
  FiTruck, 
  FiClock,
  FiNavigation,
  FiUsers,
  FiBarChart
} from 'react-icons/fi';
import { IoChevronForward } from 'react-icons/io5';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { authService } from '../../services/authService';
import axios from 'axios';

// Fix default marker icon issue with leaflet in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Sipocot, Camarines Sur coordinates and collection points
const sipocotCenter = [13.7694, 123.0094];

const collectionPoints = [
  { id: 1, name: 'Brgy. Angas', position: [13.7750, 123.0150], route: 'A', status: 'completed' },
  { id: 2, name: 'Brgy. Bagacay', position: [13.7680, 123.0080], route: 'A', status: 'active' },
  { id: 3, name: 'Brgy. Bahay', position: [13.7720, 123.0120], route: 'B', status: 'pending' },
  { id: 4, name: 'Brgy. Cabanbanan', position: [13.7650, 123.0200], route: 'B', status: 'completed' },
  { id: 5, name: 'Brgy. Danlog', position: [13.7800, 123.0050], route: 'C', status: 'pending' },
  { id: 6, name: 'Brgy. Kilikilihan', position: [13.7600, 123.0100], route: 'C', status: 'active' },
];

const handleRespond = async (assignmentId, userId, role, response) => {
  try {
    const res = await axios.post('/backend/api/respond_assignment.php', {
      assignment_id: assignmentId,
      user_id: userId,
      role, // 'driver' or 'collector'
      response, // 'accepted' or 'declined'
    });
    if (res.data.success) {
      // Optionally refresh notifications/assignments here
      alert('Response recorded!');
    } else {
      alert('Failed: ' + res.data.message);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

export default function TruckDriverDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Fetch unread notifications count periodically
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const uidFromUser = (() => {
      try { return storedUser ? JSON.parse(storedUser)?.user_id || JSON.parse(storedUser)?.id : null; } catch { return null; }
    })();
    const uid = localStorage.getItem('user_id') || uidFromUser || user?.user_id || user?.id;
    if (!uid) return;

    let isActive = true;

    const loadUnread = async () => {
      try {
        const res = await fetch(`https://koletrash.systemproj.com/backend/api/get_notifications.php?recipient_id=${uid}`);
        const data = await res.json();
        if (isActive && data?.success) {
          const count = (data.notifications || []).reduce((acc, n) => {
            // unread
            const isUnread = n.response_status !== 'read';
            // pending assignment (not accepted/declined)
            let isPendingAssignment = false;
            try {
              const parsed = JSON.parse(n.message || '{}');
              if (parsed && (parsed.type === 'assignment' || parsed.type === 'daily_assignments')) {
                isPendingAssignment = !['accepted', 'declined'].includes((n.response_status || '').toLowerCase());
              }
            } catch {}
            return acc + ((isUnread || isPendingAssignment) ? 1 : 0);
          }, 0);
          setUnreadNotifications(count);
        }
      } catch (_) {
        // ignore network errors for badge
      }
    };

    loadUnread();
    const intervalId = setInterval(loadUnread, 60000); // refresh every 60s
    return () => { isActive = false; clearInterval(intervalId); };
  }, [user]);

  // Driver info from database
  const driver = {
    name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : 'Loading...',
    role: user?.role || 'Truck Driver',
    id: user?.user_id || 'TD-001',
    truck: 'Truck #05',
    shift: 'Morning Shift',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
  };

  // MENRO events carousel images - same as other dashboards for consistency
  const eventImages = [
    {
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
      title: 'Tree Planting Activity',
      date: 'May 15, 2025',
      description: 'Join us in making Sipocot greener!'
    },
    {
      url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop',
      title: 'Coastal Cleanup Drive',
      date: 'May 20, 2025',
      description: 'Help us keep our waters clean'
    },
    {
      url: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
      title: 'Waste Segregation Seminar',
      date: 'May 25, 2025',
      description: 'Learn proper waste management'
    },
    {
      url: 'https://images.unsplash.com/photo-1542601600647-3a722a90a76b?w=800&auto=format&fit=crop',
      title: 'Environmental Campaign',
      date: 'June 1, 2025',
      description: 'Building a sustainable future'
    }
  ];

  // Navigation links with routing - truck driver specific
  const navLinks = [
    { label: 'Dashboard', icon: <MdHome className="w-6 h-6" />, to: '/truckdriver', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver') navigate('/truckdriver'); } },
    { label: 'Collection Schedule', icon: <FiCalendar className="w-6 h-6" />, to: '/truckdriver/schedule', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver/schedule') navigate('/truckdriver/schedule'); } },
    { label: 'Assigned Tasks', icon: <FiCheckSquare className="w-6 h-6" />, to: '/truckdriver/tasks', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver/tasks') navigate('/truckdriver/tasks'); } },
    { label: 'Assigned Routes', icon: <FiMapPin className="w-6 h-6" />, to: '/truckdriver/routes', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver/routes') navigate('/truckdriver/routes'); } },
    { label: 'Vehicle Status', icon: <FiTruck className="w-6 h-6" />, to: '/truckdriver/vehicle', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver/vehicle') navigate('/truckdriver/vehicle'); } },
    { label: 'Settings', icon: <FiSettings className="w-6 h-6" />, to: '/truckdriver/settings', onClick: () => { setMenuOpen(false); if(location.pathname !== '/truckdriver/settings') navigate('/truckdriver/settings'); } },
    { label: 'Logout', icon: <MdLogout className="w-6 h-6 text-red-500" />, to: '/login', onClick: () => { setMenuOpen(false); setShowLogoutModal(true); } },
  ];

  const confirmLogout = () => {
    setShowLogoutModal(false);
    // Clear user data from localStorage
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Today's Statistics
  const todayStats = {
    completed: 8,
    pending: 4,
    total: 12,
    efficiency: 85
  };

  const getRouteStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white w-[280px] max-w-[85%] h-full shadow-xl z-50 animate-fadeInLeft flex flex-col">
            {/* Profile Section */}
            <div className="bg-gradient-to-b from-green-800 to-green-700 px-4 py-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-lg">
                <MdPerson className="w-7 h-7 text-green-800" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-base truncate">{driver.name}</h2>
                <p className="text-green-100 text-sm">{driver.role}</p>
                <p className="text-green-200 text-xs">ID: {driver.id} • {driver.truck}</p>
              </div>
              <button 
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-1">
                {navLinks.map((link, i) => (
                  <button
                    key={link.label}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors
                      ${link.label === 'Logout' 
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100' 
                        : 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'
                      }
                      ${location.pathname === link.to ? 'border-2' : 'border'}
                    `}
                    onClick={link.onClick}
                  >
                    <span className={link.label === 'Logout' ? 'text-red-500' : 'text-green-700'}>
                      {link.icon}
                    </span>
                    <span className={`ml-3 text-sm font-medium ${link.label === 'Logout' ? 'text-red-600' : ''}`}>
                      {link.label}
                    </span>
                  </button>
                ))}
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
      <div className="flex items-center justify-between bg-green-800 px-3 sm:px-4 py-3 sticky top-0 z-10">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
        >
          <FiMenu className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
        </button>
        <span 
          className="text-white font-bold text-lg tracking-wide cursor-pointer hover:text-green-200 transition-colors duration-150"
          onClick={() => navigate('/truckdriver')}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            onClick={() => navigate('/truckdriver/notifications')}
          >
            <FiBell className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold border border-white">{unreadNotifications}</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        <Outlet />
      </div>
      
      {/* Feedback removed for personnel application */}
      
      {/* Footer */}
      <footer className="mt-auto text-xs text-center text-white bg-green-800 py-2 w-full">
        © 2025 Municipality of Sipocot – MENRO. All rights reserved.
      </footer>
    </div>
  );
}
