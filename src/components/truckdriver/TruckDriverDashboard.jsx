import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronRight, FiX, FiSettings, FiMessageSquare } from 'react-icons/fi';
import { MdHome, MdLogout } from 'react-icons/md';
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
import { buildApiUrl } from '../../config/api';
import axios from 'axios';
import { StatusProvider } from '../../contexts/StatusContext';
import { calculateUnreadCount, dispatchNotificationCount } from '../../utils/notificationUtils';
import BrandedLoader from '../shared/BrandedLoader';
import { useLoader } from '../../contexts/LoaderContext';

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
    const token = (() => {
      try {
        return localStorage.getItem('access_token');
      } catch (error) {
        console.warn('Unable to read access token for respond_assignment:', error);
        return null;
      }
    })();

    const res = await axios.post(
      buildApiUrl('respond_assignment.php'),
      {
        assignment_id: assignmentId,
        user_id: userId,
        role, // 'driver' or 'collector'
        response, // 'accepted' or 'declined'
      },
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined
    );
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
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [avatarCooldownUntil, setAvatarCooldownUntil] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader } = useLoader();

  const getStoredAccessToken = () => {
    try {
      return localStorage.getItem('access_token');
    } catch (error) {
      console.warn('Unable to read stored access token:', error);
      return null;
    }
  };

  const buildAuthHeaders = (extra = {}) => {
    const token = getStoredAccessToken();
    if (token) {
      return {
        ...extra,
        Authorization: `Bearer ${token}`,
      };
    }
    return { ...extra };
  };

  const normalizeAvatarUrl = (value) => {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('blob:') || value.startsWith('data:')) {
      return value;
    }
    return authService.resolveAssetUrl(value);
  };

  const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000;

  const parseServerTimestamp = (value) => {
    if (!value || typeof value !== 'string') return null;
    const formatted = value.replace(' ', 'T');
    const candidate = `${formatted}+08:00`;
    const parsed = Date.parse(candidate);
    if (Number.isNaN(parsed)) {
      const fallback = Date.parse(value);
      return Number.isNaN(fallback) ? null : fallback;
    }
    return parsed;
  };

  const computeCooldownUntil = (timestampString) => {
    const parsed = parseServerTimestamp(timestampString);
    if (!parsed) return null;
    const target = parsed + COOLDOWN_DURATION_MS;
    return target > Date.now() ? target : null;
  };

  const formatCooldownMessage = (targetMs) => {
    if (!targetMs) return '';
    const diffMs = targetMs - Date.now();
    if (diffMs <= 0) return '';
    const totalMinutes = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `You can change your photo again in ${hours}h ${minutes}m.`;
    }
    return `You can change your photo again in ${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}.`;
  };

  const getAvatarStorageKey = () => {
    const identifier = resolvedUserId || user?.user_id || user?.id || localStorage.getItem('user_id');
    return identifier ? `truckDriverAvatar:${identifier}` : null;
  };

  const handleAvatarClick = () => {
    if (isAvatarUploading) {
      return;
    }

    if (avatarCooldownUntil && avatarCooldownUntil <= Date.now()) {
      setAvatarCooldownUntil(null);
    }

    if (avatarCooldownUntil && avatarCooldownUntil > Date.now()) {
      setAvatarUploadError(formatCooldownMessage(avatarCooldownUntil));
      return;
    }

    setAvatarUploadError('');
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    const targetUserId = resolvedUserId || user?.user_id || user?.id || localStorage.getItem('user_id');
    if (!targetUserId) {
      setAvatarUploadError('Profile is still loading. Try again soon.');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Use a PNG, JPG, WEBP, or GIF image.');
      event.target.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarUploadError('Image must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    setAvatarUploadError('');
    const previousAvatar = avatarPreview;
    const tempPreview = URL.createObjectURL(file);
    setAvatarPreview(tempPreview);
    setIsAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('user_id', targetUserId);
      formData.append('avatar', file);

      const response = await authService.uploadProfileImage(formData);
      if (response?.status === 'success') {
        const relativePath = response?.data?.relativePath || response?.relativePath || null;
        const providedUrl = response?.data?.imageUrl || response?.imageUrl || tempPreview;
        const resolvedUrl = normalizeAvatarUrl(relativePath || providedUrl);

        setAvatarPreview(resolvedUrl);

        const key = getAvatarStorageKey();
        if (key && resolvedUrl) {
          localStorage.setItem(key, resolvedUrl);
        }

        const updatedAt = response?.data?.updatedAt || null;
        const cooldownUntil = computeCooldownUntil(updatedAt) || (Date.now() + COOLDOWN_DURATION_MS);
        setAvatarCooldownUntil(cooldownUntil);

        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            profile_image: relativePath || prev.profile_image || providedUrl,
            profile_image_updated_at: updatedAt || prev?.profile_image_updated_at,
            avatar: resolvedUrl,
          };
        });

        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.profile_image = relativePath || parsed.profile_image || providedUrl;
            parsed.profile_image_updated_at = updatedAt || parsed.profile_image_updated_at;
            parsed.avatar = resolvedUrl;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch (storageError) {
          console.error('Unable to update stored user with new avatar:', storageError);
        }
      } else {
        setAvatarPreview(previousAvatar || null);
        setAvatarUploadError(response?.message || 'Upload failed. Please try again.');
      }
    } catch (error) {
      setAvatarPreview(previousAvatar || null);
      let fallbackMessage = error?.message || 'Upload failed. Please try again.';
      const payload = error?.payload;
      if (payload?.cooldownRemainingSeconds) {
        let cooldownUntil = null;
        if (payload?.cooldownEndsAt) {
          cooldownUntil = payload.cooldownEndsAt * 1000;
        } else {
          cooldownUntil = Date.now() + payload.cooldownRemainingSeconds * 1000;
        }
        if (cooldownUntil) {
          setAvatarCooldownUntil(cooldownUntil);
          const message = formatCooldownMessage(cooldownUntil);
          if (message) {
            fallbackMessage = message;
          }
        }
      }
      setAvatarUploadError(fallbackMessage);
    } finally {
      setIsAvatarUploading(false);
      URL.revokeObjectURL(tempPreview);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const fallbackId = localStorage.getItem('user_id');
          const computedUserId = parsed.user_id || parsed.id || fallbackId;

          if (computedUserId) {
            const response = await authService.getUserData(computedUserId);
            if (response.status === 'success') {
              setUser(response.data);
              setResolvedUserId(computedUserId);
              const avatarKey = `truckDriverAvatar:${computedUserId}`;
              const remoteAvatar = normalizeAvatarUrl(response.data?.profile_image || response.data?.avatar || response.data?.profileImage || null);
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              setAvatarPreview(remoteAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(response.data?.profile_image_updated_at));
            } else {
              console.error('Failed to fetch user data:', response.message);
              setUser(parsed);
              if (computedUserId) {
                setResolvedUserId(computedUserId);
                const avatarKey = `truckDriverAvatar:${computedUserId}`;
                const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
                const fallbackAvatar = normalizeAvatarUrl(parsed?.profile_image || parsed?.avatar || parsed?.profileImage || null);
                setAvatarPreview(fallbackAvatar || storedAvatar || null);
                setAvatarCooldownUntil(computeCooldownUntil(parsed?.profile_image_updated_at));
              }
            }
          } else {
            setUser(parsed);
            if (fallbackId) {
              setResolvedUserId(fallbackId);
              const avatarKey = `truckDriverAvatar:${fallbackId}`;
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              const fallbackAvatar = normalizeAvatarUrl(parsed?.profile_image || parsed?.avatar || parsed?.profileImage || null);
              setAvatarPreview(fallbackAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(parsed?.profile_image_updated_at));
            }
          }
        } else {
          console.warn('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            const fallbackId = parsed?.user_id || parsed?.id || localStorage.getItem('user_id');
            if (fallbackId) {
              setResolvedUserId(fallbackId);
              const avatarKey = `truckDriverAvatar:${fallbackId}`;
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              const fallbackAvatar = normalizeAvatarUrl(parsed?.profile_image || parsed?.avatar || parsed?.profileImage || null);
              setAvatarPreview(fallbackAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(parsed?.profile_image_updated_at));
            }
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

    setResolvedUserId((current) => (current ? current : uid));

    let isActive = true;

    const loadUnread = async () => {
      try {
        const res = await fetch(
          buildApiUrl(`get_notifications.php?recipient_id=${uid}`),
          {
            headers: buildAuthHeaders(),
          }
        );
        const data = await res.json();
        if (isActive && data?.success) {
          const notifications = data.notifications || [];
          const count = calculateUnreadCount(notifications);
          setUnreadNotifications(count);
          dispatchNotificationCount(uid, notifications);
        }
      } catch (_) {
        // ignore network errors for badge
      }
    };

    loadUnread();
    const intervalId = setInterval(loadUnread, 60000); // refresh every 60s
    return () => { isActive = false; clearInterval(intervalId); };
  }, [user]);

  useEffect(() => {
    if (!resolvedUserId) return;

    const handleSync = (event) => {
      const { userId, count } = event.detail || {};
      if (String(userId) === String(resolvedUserId)) {
        setUnreadNotifications(count);
      }
    };

    window.addEventListener('notificationsUpdated', handleSync);
    return () => window.removeEventListener('notificationsUpdated', handleSync);
  }, [resolvedUserId]);

  const fallbackName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim();
  const displayName = (user?.fullName && user.fullName.trim()) || fallbackName || 'Loading...';
  const derivedAvatar = normalizeAvatarUrl(user?.profile_image || user?.avatar || user?.profileImage || null);
  const effectiveAvatar = avatarPreview || derivedAvatar || null;
  const avatarInitial = displayName && displayName !== 'Loading...' ? displayName.charAt(0).toUpperCase() : 'D';

  // Driver info from database
  const toTitleCase = (value) => {
    if (!value) return '';
    const cleaned = String(value).replace(/_/g, ' ');
    return cleaned.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const driver = {
    name: displayName,
    role: toTitleCase(user?.role || 'Truck Driver'),
    id: user?.user_id || 'TD-001',
    truck: 'Truck #05',
    shift: 'Morning Shift',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
    avatarUrl: effectiveAvatar,
    avatarInitial,
  };

  const activeCooldownMessage = '';

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

  const handleNavigation = (targetPath, options = {}) => {
    const { skipLoading = false, closeMenu = true, customAction } = options;

    if (!skipLoading && targetPath && location.pathname !== targetPath) {
      void showLoader({
        primaryText: 'Loading your next view…',
        secondaryText: 'We’re preparing the section you selected.',
        variant: 'login'
      });
    }

    if (closeMenu) {
      setMenuOpen(false);
    }

    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (customAction) {
      customAction();
    }
  };

  // Navigation links with routing - truck driver specific
  const navLinks = [
    { label: 'Dashboard', icon: <MdHome className="w-6 h-6" />, to: '/truckdriver', showLoading: true },
    { label: 'Collection Schedule', icon: <FiCalendar className="w-6 h-6" />, to: '/truckdriver/schedule', showLoading: true },
    { label: 'Assigned Tasks', icon: <FiCheckSquare className="w-6 h-6" />, to: '/truckdriver/tasks', showLoading: true },
    { label: 'Assigned Routes', icon: <FiMapPin className="w-6 h-6" />, to: '/truckdriver/routes', showLoading: true },
    { label: 'Vehicle Status', icon: <FiTruck className="w-6 h-6" />, to: '/truckdriver/vehicle', showLoading: true },
    { label: 'Settings', icon: <FiSettings className="w-6 h-6" />, to: '/truckdriver/settings', showLoading: true },
    { label: 'Logout', icon: <MdLogout className="w-6 h-6 text-red-500" />, action: () => setShowLogoutModal(true), showLoading: false },
  ];

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    
    // Call logout API to set online_status to offline
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const { authService } = await import('../../services/authService');
      await authService.logout(parseInt(userId));
    }
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    await showLoader({
      primaryText: 'Signing you out…',
      secondaryText: 'We\'re securely closing your session.',
      variant: 'login'
    });
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
    <StatusProvider>
      <div className="min-h-screen flex flex-col bg-gray-100 w-full max-w-full relative">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleAvatarChange}
        />
      {/* Loading state */}
      <BrandedLoader
        visible={loading}
        primaryText="Loading your dashboard…"
        secondaryText="Setting up your driver tools."
        variant="login"
      />

      {/* Hamburger Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white w-[320px] max-w-[88%] h-full shadow-2xl z-50 animate-fadeInLeft flex flex-col rounded-r-2xl overflow-hidden">
            {/* Profile Section - left-aligned like sample */}
            <div className="bg-gradient-to-b from-green-800 to-green-700 px-5 pt-6 pb-5 relative">
              <button 
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-3 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <FiX className="w-5 h-5" />
              </button>
              <div className="flex items-center text-left gap-3">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  title="Change profile picture"
                  className="relative w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 focus:ring-offset-green-700"
                >
                  {isAvatarUploading ? (
                    <span className="w-6 h-6 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                  ) : driver.avatarUrl ? (
                    <img src={driver.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-green-800 font-bold text-lg">{driver.avatarInitial}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-[15px] leading-tight truncate w-full">{driver.name}</h2>
                  <p className="mt-0.5 text-emerald-50/90 text-[12px]">{driver.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 bg-gradient-to-b from-white to-emerald-50/30">
              <div className="space-y-2">
                {navLinks.filter(l => l.label !== 'Logout').map((link) => {
                  const isActive = link.to && location.pathname === link.to;
                  return (
                    <button
                      key={link.label}
                      className={`group flex items-center w-full px-4 py-3 rounded-xl text-left transition-all border
                        ${isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-100'}
                      `}
                      onClick={() => handleNavigation(link.to, {
                        skipLoading: link.showLoading === false,
                        customAction: link.action
                      })}
                    >
                      <span className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'}`}>
                        {link.icon}
                      </span>
                      <span className={`text-sm font-semibold flex-1 text-left ${isActive ? 'text-white' : 'text-emerald-900'}`}>{link.label}</span>
                      <IoChevronForward className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Logout */}
            <div className="px-3 pb-4 pt-2 bg-white border-t border-emerald-100">
              <button
                className="flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors bg-red-50 hover:bg-red-100 text-red-700 border border-red-100"
                onClick={() => handleNavigation(undefined, { customAction: () => setShowLogoutModal(true) })}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg mr-3 bg-red-100 text-red-600">
                  {navLinks.find(n => n.label === 'Logout')?.icon}
                </span>
                <span className="text-sm font-semibold">Logout</span>
                <IoChevronForward className="w-4 h-4 ml-auto text-red-400" />
              </button>
            </div>
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
          onClick={() => handleNavigation('/truckdriver')}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            onClick={() => handleNavigation('/truckdriver/notifications')}
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
    </StatusProvider>
  );
}
