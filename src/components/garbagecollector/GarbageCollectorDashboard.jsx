import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell } from 'react-icons/fi';
import {
  HomeIcon,
  CalendarIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import { StatusProvider } from '../../contexts/StatusContext';
import { calculateUnreadCount, dispatchNotificationCount } from '../../utils/notificationUtils';
import { buildApiUrl } from '../../config/api';
import BrandedLoader from '../shared/BrandedLoader';
import { useLoader } from '../../contexts/LoaderContext';

const navigation = [
  { name: 'Home', href: '/garbagecollector', icon: HomeIcon, showLoading: true },
  { name: 'Collection Schedule', href: '/garbagecollector/schedule', icon: CalendarIcon, showLoading: true },
  { name: 'Routes', href: '/garbagecollector/routes', icon: MapIcon, showLoading: true },
  { name: 'Tasks', href: '/garbagecollector/tasks', icon: ClipboardDocumentCheckIcon, showLoading: true },
  { name: 'Settings', href: '/garbagecollector/settings', icon: Cog6ToothIcon, showLoading: true },
];

export default function GarbageCollectorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const location = useLocation();
  const navigate = useNavigate();
  const { showLoader } = useLoader();

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
    return identifier ? `garbageCollectorAvatar:${identifier}` : null;
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

  // Check for URL parameters (backup method)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const routeStarted = urlParams.get('route_started');
    const barangay = urlParams.get('barangay');
    
    if (routeStarted) {
      console.log('Route started detected via URL - Route ID:', routeStarted, 'Barangay:', barangay);
      // Clear URL parameters for clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Navigate to routes page
      navigate('/garbagecollector/routes');
    }
  }, [navigate]);

  // Auto-redirect removed per request



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
              const avatarKey = `garbageCollectorAvatar:${computedUserId}`;
              const remoteAvatar = normalizeAvatarUrl(response.data?.profile_image || response.data?.avatar || response.data?.profileImage || null);
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              setAvatarPreview(remoteAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(response.data?.profile_image_updated_at));
            } else {
              console.error('Failed to fetch user data:', response.message);
              setUser(parsed);
              if (computedUserId) {
                setResolvedUserId(computedUserId);
                const avatarKey = `garbageCollectorAvatar:${computedUserId}`;
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
              const avatarKey = `garbageCollectorAvatar:${fallbackId}`;
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
              const avatarKey = `garbageCollectorAvatar:${fallbackId}`;
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
        const token = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
        const res = await fetch(buildApiUrl(`get_notifications.php?recipient_id=${uid}`), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
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

  // User profile from database
  const fallbackName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim();
  const displayName = (user?.fullName && user.fullName.trim()) || fallbackName || 'Loading...';
  const derivedAvatar = normalizeAvatarUrl(user?.profile_image || user?.avatar || user?.profileImage || null);
  const effectiveAvatar = avatarPreview || derivedAvatar || null;
  const avatarLetter = displayName && displayName !== 'Loading...' ? displayName.charAt(0).toUpperCase() : 'G';

  const userProfile = {
    name: displayName,
    role: user?.role || 'Garbage Collector',
    avatarUrl: effectiveAvatar,
    avatarInitial: avatarLetter,
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || ''
  };

  const activeCooldownMessage = avatarUploadError ? '' : formatCooldownMessage(avatarCooldownUntil);

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

  const handleNavigation = (targetPath, options = {}) => {
    const { skipLoading = false, closeSidebar = false, customAction } = options;

    if (!skipLoading && targetPath && location.pathname !== targetPath) {
      void showLoader({
        primaryText: 'Loading your next view…',
        secondaryText: 'We’re preparing the section you selected.',
        variant: 'login'
      });
    }

    if (closeSidebar) {
      setSidebarOpen(false);
    }

    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (customAction) {
      customAction();
    }
  };

  return (
    <StatusProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 w-full max-w-full relative">
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
        secondaryText="Getting your collector tools ready."
        variant="login"
      />

      {/* Hamburger Menu Drawer (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
          <div className="relative bg-white w-[280px] max-w-[85%] h-full shadow-xl z-50 animate-fadeInLeft flex flex-col">
            {/* Profile Section */}
            <div className="bg-gradient-to-b from-green-800 to-green-700 px-4 py-6 flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  title="Change profile picture"
                  className="relative w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 focus:ring-offset-green-700"
                >
                  {isAvatarUploading ? (
                    <span className="w-6 h-6 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                  ) : userProfile.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-green-800 font-bold text-lg">{userProfile.avatarInitial}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    Change
                  </span>
                </button>
                {avatarUploadError ? (
                  <p className="text-[11px] text-red-100 text-center leading-tight max-w-[6.5rem]">{avatarUploadError}</p>
                ) : isAvatarUploading ? (
                  <p className="text-[11px] text-green-100 leading-tight">Uploading…</p>
                ) : activeCooldownMessage ? (
                  <p className="text-[11px] text-green-100 text-center leading-tight max-w-[6.5rem]">{activeCooldownMessage}</p>
                ) : null}
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
                    <button
                      key={item.name}
                      className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors
                        ${isActive ? 'bg-green-50/80 text-green-900 border-2 border-green-700' : 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'}
                      `}
                      onClick={() => handleNavigation(item.href, { closeSidebar: true, skipLoading: item.showLoading === false })}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
                
                {/* Logout Button */}
                <button
                  className="flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 mt-4"
                  onClick={() => {
                    handleNavigation(undefined, {
                      closeSidebar: true,
                      skipLoading: true,
                      customAction: () => setShowLogoutModal(true)
                    });
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
          onClick={() => handleNavigation('/garbagecollector')}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            onClick={() => handleNavigation('/garbagecollector/notifications')}
          >
            <FiBell className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold border border-white">{unreadNotifications}</span>
            )}
          </button>
        </div>
      </div>
      
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="mt-auto text-xs text-center text-white bg-green-800 py-2 w-full">
        © 2025 Municipality of Sipocot – MENRO. All rights reserved.
      </footer>
      </div>
    </StatusProvider>
  );
}
