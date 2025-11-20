import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronRight, FiX, FiSettings, FiMessageSquare, FiSend, FiBarChart2, FiClipboard } from 'react-icons/fi';
import { MdHome, MdReport, MdEvent, MdMenuBook, MdLogout, MdPerson, MdQuestionAnswer } from 'react-icons/md';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { authService } from '../../services/authService';
import eventTreePlanting from '../../assets/images/users/tp.jpg';
import eventCleanUp from '../../assets/images/users/cd.jpg';
import eventCampaign from '../../assets/images/users/s.jpg';
import eventCoastal from '../../assets/images/users/an.jpg';
import { calculateUnreadCount } from '../../utils/notificationUtils';
import { buildApiUrl } from '../../config/api';
import BrandedLoader from '../shared/BrandedLoader';
import { useLoader } from '../../contexts/LoaderContext';

const faqData = [
  {
    question: 'How do I manage waste collectors?',
    answer:
      'You can manage waste collectors through the Personnel Management section. You can assign routes, view schedules, and monitor their performance.',
  },
  {
    question: 'How do I view resident reports?',
    answer: 'Access the Reports section from the menu to view all submitted issues and complaints from residents in your barangay.',
  },
  {
    question: 'How do I update collection schedules?',
    answer: 'You can modify collection schedules through the Schedule Management section. Changes will be automatically reflected for residents and collectors.',
  },
  {
    question: 'How do I access performance metrics?',
    answer: 'View collection performance, resident satisfaction, and other metrics in the Analytics Dashboard section.',
  },
  {
    question: 'How do I handle emergency situations?',
    answer:
      'For urgent matters, use the Emergency Protocol section to coordinate with collectors and notify residents of any changes.',
  },
  {
    question: 'How do I submit a special pickup request?',
    answer:
      "Use the 'Submit Special Pick-up Request' option in the menu to schedule special waste collections for your barangay.",
  },
];

const eventImages = [
  {
    image: eventTreePlanting,
    title: 'Tree Planting Activity',
    date: 'October 20, 2025',
    location: 'Gaongan, Sipocot, Camarines Sur',
  },
  {
    image: eventCleanUp,
    title: 'Clean Up Drive',
    date: 'October 24, 2025',
    location: 'Impig, Sipocot, Camarines Sur',
  },
  {
    image: eventCampaign,
    title: 'Campaign Seminar',
    date: 'October 26, 2025',
    location: 'Caima, Sipocot, Camarines Sur',
  },
  {
    image: eventCoastal,
    title: 'Coastal Clean Up Drive',
    date: 'October 30, 2025',
    location: 'Anib, Sipocot, Camarines Sur',
  },
];

const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: false,
  dotsClass: 'slick-dots custom-dots',
};

export default function BarangayHeadDashboard({ unreadNotifications: initialUnread = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader } = useLoader();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', content: 'Hello Barangay Head! How can I support your barangay today?' },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(initialUnread);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [avatarCooldownUntil, setAvatarCooldownUntil] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUnreadNotifications(initialUnread);
  }, [initialUnread]);

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
    return identifier ? `barangayHeadAvatar:${identifier}` : null;
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
              const avatarKey = `barangayHeadAvatar:${computedUserId}`;
              const remoteAvatar = normalizeAvatarUrl(response.data?.profile_image || response.data?.avatar || response.data?.profileImage || null);
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              setAvatarPreview(remoteAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(response.data?.profile_image_updated_at));
            } else {
              console.error('Failed to fetch user data:', response.message);
              setUser(parsed);
              if (computedUserId) {
                setResolvedUserId(computedUserId);
                const avatarKey = `barangayHeadAvatar:${computedUserId}`;
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
              const avatarKey = `barangayHeadAvatar:${fallbackId}`;
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
            setUser(JSON.parse(storedUser));
            const parsed = JSON.parse(storedUser);
            const fallbackId = parsed?.user_id || parsed?.id || localStorage.getItem('user_id');
            if (fallbackId) {
              setResolvedUserId(fallbackId);
              const avatarKey = `barangayHeadAvatar:${fallbackId}`;
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const resolvedFromStorage = (() => {
      try {
        return storedUser ? JSON.parse(storedUser)?.user_id || JSON.parse(storedUser)?.id : null;
      } catch {
        return null;
      }
    })();
    const uid = resolvedUserId || localStorage.getItem('user_id') || resolvedFromStorage || user?.user_id || user?.id;
    if (!uid) return;

    setResolvedUserId(uid);
    let active = true;
    const loadUnread = async () => {
      try {
        const token = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
        const res = await fetch(buildApiUrl(`get_notifications.php?recipient_id=${uid}`), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await res.json();
        if (active && data?.success) {
          const count = calculateUnreadCount(data.notifications || []);
          setUnreadNotifications(count);
        }
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };

    loadUnread();
    const intervalId = setInterval(loadUnread, 60000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user, resolvedUserId]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChat && !event.target.closest('.chat-container') && !event.target.closest('.chat-button')) {
        setShowChat(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChat]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showChat) {
        setShowChat(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showChat]);

  const resolvedRole = (() => {
    const rawRole = user?.role;
    if (!rawRole) return 'Barangay Head';
    const normalized = rawRole.toLowerCase().replace(/[_\s-]+/g, '');
    if (normalized === 'barangayhead') return 'Barangay Head';
    return rawRole;
  })();

  const barangayHead = {
    name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : 'Loading...',
    role: resolvedRole,
    avatar: avatarPreview || '',
    id: user?.user_id || user?.id || resolvedUserId || '',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
  };

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

  const navLinks = [
    { label: 'Home', icon: <MdHome className="w-6 h-6" />, to: '/barangayhead', showLoading: true },
    { label: 'Submit Report Issue', icon: <MdReport className="w-6 h-6" />, to: '/barangayhead/report', showLoading: true },
    { label: 'View Issue Status', icon: <FiClipboard className="w-6 h-6" />, to: '/barangayhead/issue-status', showLoading: true },
    { label: 'Submit Special Pick-up Request', icon: <MdEvent className="w-6 h-6" />, to: '/barangayhead/pickup', showLoading: true },
    { label: 'View Collection Schedule', icon: <MdEvent className="w-6 h-6" />, to: '/barangayhead/schedule', showLoading: true },
    { label: 'Access IEC Materials', icon: <MdMenuBook className="w-6 h-6" />, to: '/barangayhead/iec', showLoading: true },
    { label: 'Feedback', icon: <FiMessageSquare className="w-6 h-6" />, to: '/barangayhead/feedback', showLoading: true },
    { label: 'Settings', icon: <FiSettings className="w-6 h-6" />, to: '/barangayhead/settings', showLoading: true },
    { label: 'Logout', icon: <MdLogout className="w-6 h-6 text-red-500" />, action: () => setShowLogoutModal(true), showLoading: false },
  ];

  // Compute cooldown message for avatar upload
  const activeCooldownMessage = avatarUploadError ? '' : formatCooldownMessage(avatarCooldownUntil);

  const quickActionItems = [
    {
      id: 'reports',
      title: 'Submit Report Issue',
      icon: MdReport,
      indicatorLabel: 'Submit Report',
      onClick: () => handleNavigation('/barangayhead/report', { closeMenu: false }),
    },
    {
      id: 'special-pickup',
      title: 'Submit Special Pick-up',
      icon: MdEvent,
      indicatorLabel: 'Submit Special Requests',
      onClick: () => handleNavigation('/barangayhead/pickup', { closeMenu: false }),
    },
    {
      id: 'schedule',
      title: 'Collection Schedule',
      icon: FiClipboard,
      indicatorLabel: 'Open Schedule',
      onClick: () => handleNavigation('/barangayhead/schedule', { closeMenu: false }),
    },
    {
      id: 'iec',
      title: 'IEC Materials',
      icon: MdMenuBook,
      indicatorLabel: 'Open Library',
      onClick: () => handleNavigation('/barangayhead/iec', { closeMenu: false }),
    },
  ];

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    
    // Call logout API to set online_status to offline
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const { authService } = await import('../../services/authService');
      await authService.logout(parseInt(userId));
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    await showLoader({
      primaryText: 'Signing you out…',
      secondaryText: 'We\'re securely closing your session.',
      variant: 'login'
    });
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => setShowLogoutModal(false);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const userMessage = { type: 'user', content: messageInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setMessageInput('');
    setIsTyping(true);

    const normalizedInput = messageInput.toLowerCase();
    const matchedFaq = faqData.find((faq) =>
      faq.question.toLowerCase().includes(normalizedInput) || normalizedInput.includes(faq.question.toLowerCase()),
    );

    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        content:
          matchedFaq?.answer ||
          "I'm not sure about that. Would you like to know about managing collectors, viewing reports, updating schedules, or performance metrics?",
      };
      setChatMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 w-full max-w-full relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleAvatarChange}
      />
      <BrandedLoader
        visible={loading}
        primaryText="Loading your dashboard…"
        secondaryText="Preparing your barangay insights."
        variant="login"
      />

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white w-[280px] max-w-[85%] h-full shadow-xl z-50 animate-fadeInLeft flex flex-col">
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
                  ) : barangayHead.avatar ? (
                    <img src={barangayHead.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <MdPerson className="w-7 h-7 text-green-800" />
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
                <h2 className="text-white font-semibold text-base truncate">{barangayHead.name}</h2>
                <p className="text-green-100 text-sm">{barangayHead.role}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = link.to && location.pathname === link.to;
                  return (
                  <button
                    key={link.label}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors ${
                      link.label === 'Logout'
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'
                        : 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'
                    } ${isActive ? 'border-2' : 'border'}`}
                    onClick={() => handleNavigation(link.to, {
                      skipLoading: link.showLoading === false,
                      customAction: link.action
                    })}
                  >
                    <span className={link.label === 'Logout' ? 'text-red-500' : 'text-green-700'}>{link.icon}</span>
                    <span className={`ml-3 text-sm font-medium ${link.label === 'Logout' ? 'text-red-600' : ''}`}>
                      {link.label}
                    </span>
                  </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-sm w-full flex flex-col items-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-emerald-700 mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-700 text-center">Are you sure you want to log out?</p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
              <button
                className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-emerald-700 font-semibold shadow hover:bg-gray-50 transition"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-green-800 px-4 py-3 sticky top-0 z-10">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
        >
          <FiMenu className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
        </button>
        <span
          className="text-white font-bold text-lg tracking-wide cursor-pointer hover:text-green-200 transition-colors duration-150"
          onClick={() => navigate('/barangayhead')}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            onClick={() => navigate('/barangayhead/notifications')}
          >
            <FiBell className="w-6 h-6 group-hover:scale-110 group-focus:scale-110 transition-transform duration-150" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold border border-white">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        {location.pathname === '/barangayhead' && (
          <div className="flex-1 bg-gray-50 px-4 py-4">
            <div className="relative w-full h-64 md:h-80 overflow-hidden shadow-lg mb-8 mt-4 rounded-xl">
              <Slider {...carouselSettings} className="h-full">
                {eventImages.map((event) => (
                  <div key={event.title} className="relative h-64 md:h-80">
                    <div
                      className="w-full h-full bg-cover bg-center relative rounded-xl"
                      style={{ backgroundImage: `url(${event.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-xl" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <MdEvent className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">{event.date}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">{event.title}</h3>
                        <p className="text-sm md:text-base text-gray-200">{event.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            <div className="px-0 py-0 space-y-8">
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                  <h2 className="text-xl font-bold text-green-800">Quick Actions</h2>
                  <p className="text-sm text-gray-500">Handle your priority barangay tasks in just a few taps.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {quickActionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="group flex flex-col items-center justify-between rounded-2xl bg-gradient-to-br from-green-700 to-green-600 p-4 sm:p-5 text-center shadow-lg text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-h-[160px]"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                        </div>
                        <div className="inline-flex items-center justify-center gap-2 text-xs font-medium text-white/90 bg-white/10 rounded-full px-3 py-1 mt-4 group-hover:bg-white group-hover:text-green-700 transition-colors">
                          <span>{item.indicatorLabel}</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-green-100 group-hover:text-green-700">
                            <FiChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <style jsx>{`
              .custom-dots {
                bottom: 20px !important;
              }
              .custom-dots li button:before {
                color: white !important;
                font-size: 12px !important;
              }
            `}</style>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>

      <button
        className={`chat-button fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${showChat ? 'bg-red-500 hover:bg-red-600' : 'bg-[#218a4c] hover:bg-[#1a6d3d]'} text-white p-2.5 sm:p-3 rounded-full shadow-lg focus:outline-[#218a4c] flex items-center gap-2 transition-all duration-200 hover:scale-110`}
        aria-label={showChat ? 'Close KolekTrash Assistant' : 'Open KolekTrash Assistant'}
        onClick={() => setShowChat((prev) => !prev)}
      >
        {showChat ? <FiX className="w-5 h-5 sm:w-6 sm:h-6" /> : <MdQuestionAnswer className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      {showChat && (
        <div className="chat-container fixed inset-x-2 bottom-16 sm:inset-auto sm:bottom-24 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 w-[calc(100%-16px)] sm:w-full sm:max-w-[320px] animate-fadeInUp">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-green-800 to-green-700 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <MdQuestionAnswer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">KolekTrash Assistant</h2>
                <p className="text-xs text-green-100">Ask anything about barangay operations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 h-[320px] overflow-y-auto space-y-4 bg-gray-50/50">
            {chatMessages.map((message, index) => (
              <div key={`${message.type}-${index}`} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {message.type === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MdQuestionAnswer className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <MdQuestionAnswer className="w-4 h-4 text-green-600" />
                </div>
                <span>Assistant is typing…</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 rounded-b-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {faqData.slice(0, 3).map((faq) => (
                <button
                  key={faq.question}
                  onClick={() => {
                    const userMessage = { type: 'user', content: faq.question };
                    setChatMessages((prev) => [...prev, userMessage]);
                    setMessageInput('');
                    setIsTyping(true);
                    setTimeout(() => {
                      setChatMessages((prev) => [...prev, { type: 'bot', content: faq.answer }]);
                      setIsTyping(false);
                    }, 500);
                  }}
                  className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium border border-green-100 hover:scale-105 active:scale-95 transition-transform"
                >
                  {faq.question}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 bg-gray-50/50"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg disabled:hover:scale-100"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>

      <footer className="mt-auto text-xs text-center text-white bg-green-800 py-2 w-full">
        © 2025 Municipality of Sipocot – MENRO. All rights reserved.
      </footer>
    </div>
  );
}

