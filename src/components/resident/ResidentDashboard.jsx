import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronRight, FiX, FiSettings, FiMessageSquare, FiSend, FiAlertCircle } from 'react-icons/fi';
import { MdHome, MdReport, MdEvent, MdMenuBook, MdLogout, MdPerson, MdQuestionAnswer } from 'react-icons/md';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { authService } from '../../services/authService';
import eventTreePlanting from '../../assets/images/users/tp.jpg';
import eventCleanUp from '../../assets/images/users/cd.jpg';
import eventCampaign from '../../assets/images/users/s.jpg';
import eventCoastal from '../../assets/images/users/an.jpg';
import BrandedLoader from '../shared/BrandedLoader';
import { calculateUnreadCount } from '../../utils/notificationUtils';
import { useLoader } from '../../contexts/LoaderContext';
import { buildApiUrl } from '../../config/api';

const FeedbackConfirmationModal = ({ isOpen, onConfirm, onCancel, isSubmitting, feedbackType, feedbackMessage }) => {
  if (!isOpen) return null;

  const formattedType = feedbackType
    ? `${feedbackType.charAt(0).toUpperCase()}${feedbackType.slice(1)}`
    : 'Feedback';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-green-600 text-3xl" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Submit Feedback?</h2>
        <p className="text-sm text-gray-600 text-center mb-4">
          You're about to send <span className="font-semibold text-green-700">{formattedType}</span> feedback. Please confirm to continue.
        </p>
        {feedbackMessage && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 mb-4 max-h-40 overflow-y-auto whitespace-pre-line">
            {feedbackMessage}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResidentDashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackConfirm, setShowFeedbackConfirm] = useState(false);
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [pendingFeedbackData, setPendingFeedbackData] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', content: 'Hello! How can I help you today?' }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [avatarCooldownUntil, setAvatarCooldownUntil] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader } = useLoader();

  const normalizeAvatarUrl = (value) => {
    if (!value) return null;
    if (typeof value !== 'string') return null;
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

  // FAQ data
  const faqData = [
    {
      question: "What are the collection schedules?",
      answer: "Collection is scheduled every Monday and Thursday at 7:00 AM."
    },
    {
      question: "How do I report issues?",
      answer: "You can report issues through the 'Submit Report Issue' option in the menu or use the Quick Actions button on your dashboard."
    },
    {
      question: "Where can I find waste segregation guides?",
      answer: "Access our IEC Materials section through the menu or Quick Actions for comprehensive waste segregation guides."
    },
    {
      question: "How do I contact my local collector?",
      answer: "Your assigned collector's contact information can be found in the Settings section under 'Collection Details'."
    },
    {
      question: "What types of waste are collected?",
      answer: "We collect household waste, segregated into biodegradable, non-biodegradable, and recyclable materials."
    }
  ];

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage first to get the user ID
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Resolve user id from various possible keys
          const storedUserId = localStorage.getItem('user_id');
          const computedUserId = userData.user_id || userData.id || storedUserId;

          // Fetch fresh data from database using the resolved user ID
          if (computedUserId) {
            const response = await authService.getUserData(computedUserId);
            if (response.status === 'success') {
              setUser(response.data);
              setResolvedUserId(computedUserId);
              const avatarKey = `residentAvatar:${computedUserId}`;
              const remoteAvatar = normalizeAvatarUrl(response.data?.profile_image || response.data?.avatar || response.data?.profileImage || null);
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              setAvatarPreview(remoteAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(response.data?.profile_image_updated_at));
            } else {
              console.error('Failed to fetch user data:', response.message);
              // Fallback to stored data
              setUser(userData);
              if (computedUserId) {
                setResolvedUserId(computedUserId);
                const avatarKey = `residentAvatar:${computedUserId}`;
                const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
                const fallbackAvatar = normalizeAvatarUrl(userData?.profile_image || userData?.avatar || userData?.profileImage || null);
                setAvatarPreview(fallbackAvatar || storedAvatar || null);
                setAvatarCooldownUntil(computeCooldownUntil(userData?.profile_image_updated_at));
              }
            }
          } else {
            // Use stored data if no ID
            setUser(userData);
            if (storedUserId) {
              setResolvedUserId(storedUserId);
              const avatarKey = `residentAvatar:${storedUserId}`;
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              const fallbackAvatar = normalizeAvatarUrl(userData?.profile_image || userData?.avatar || userData?.profileImage || null);
              setAvatarPreview(fallbackAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(userData?.profile_image_updated_at));
            }
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
            const fallbackId = userData.user_id || userData.id || localStorage.getItem('user_id');
            if (fallbackId) {
              setResolvedUserId(fallbackId);
              const avatarKey = `residentAvatar:${fallbackId}`;
              const storedAvatar = normalizeAvatarUrl(localStorage.getItem(avatarKey));
              const fallbackAvatar = normalizeAvatarUrl(userData?.profile_image || userData?.avatar || userData?.profileImage || null);
              setAvatarPreview(fallbackAvatar || storedAvatar || null);
              setAvatarCooldownUntil(computeCooldownUntil(userData?.profile_image_updated_at));
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
    const uidFromUser = (() => { try { return storedUser ? JSON.parse(storedUser)?.user_id || JSON.parse(storedUser)?.id : null; } catch { return null; } })();
    const uid = resolvedUserId || localStorage.getItem('user_id') || uidFromUser || user?.user_id || user?.id;
    if (!uid) return;

    setResolvedUserId(uid);
    let isActive = true;
    const loadUnread = async () => {
      try {
        const token = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
        const res = await fetch(buildApiUrl(`get_notifications.php?recipient_id=${uid}`), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await res.json();
        if (isActive && data?.success) {
          const count = calculateUnreadCount(data.notifications || []);
          setUnreadNotifications(count);
        }
      } catch (err) {
        if (import.meta.env && import.meta.env.DEV) {
          console.warn('Failed to load unread notifications:', err);
        }
      }
    };
    loadUnread();
    const id = setInterval(loadUnread, 60000);
    return () => { isActive = false; clearInterval(id); };
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

  // Resident info from logged-in user
  const resident = {
    name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : 'Resident',
    role: user?.role || 'Resident',
    avatar: avatarPreview || '',
    id: user?.user_id || user?.id || '',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
  };

  const getAvatarStorageKey = () => {
    const identifier = resident.id || resolvedUserId || localStorage.getItem('user_id');
    return identifier ? `residentAvatar:${identifier}` : null;
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

    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    const targetUserId = resident.id || resolvedUserId || localStorage.getItem('user_id');
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

    const maxSize = 2 * 1024 * 1024; // 2 MB
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

        setUser(prev => prev ? { ...prev, profile_image: relativePath || prev.profile_image || providedUrl, profile_image_updated_at: updatedAt || prev?.profile_image_updated_at, avatar: resolvedUrl } : prev);

        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.profile_image = relativePath || parsedUser.profile_image || providedUrl;
            parsedUser.profile_image_updated_at = updatedAt || parsedUser.profile_image_updated_at;
            parsedUser.avatar = resolvedUrl;
            localStorage.setItem('user', JSON.stringify(parsedUser));
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
          cooldownUntil = Date.now() + (payload.cooldownRemainingSeconds * 1000);
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


  // Upcoming MENRO events
  const upcomingEvents = [
    {
      image: eventTreePlanting,
      title: 'Tree Planting Activity',
      date: 'October 20, 2025',
      location: 'Gaongan, Sipocot, Camarines Sur'
    },
    {
      image: eventCleanUp,
      title: 'Clean Up Drive',
      date: 'October 24, 2025',
      location: 'Impig, Sipocot, Camarines Sur'
    },
    {
      image: eventCampaign,
      title: 'Campaign Seminar',
      date: 'October 26, 2025',
      location: 'Caima, Sipocot, Camarines Sur'
    },
    {
      image: eventCoastal,
      title: 'Coastal Clean Up Drive',
      date: 'October 30, 2025',
      location: 'Anib, Sipocot, Camarines Sur'
    }
  ];

  const handleNavigation = (targetPath, options = {}) => {
    const { skipLoading = false, closeMenu = true, customAction } = options;

    if (!skipLoading && (!targetPath || location.pathname !== targetPath)) {
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

  const quickActionItems = [
    {
      title: 'Report Issue',
      description: 'Let MENRO know about uncollected waste or service concerns.',
      icon: MdReport,
      indicatorLabel: 'Submit Report',
      onClick: () => handleNavigation('/resident/report', { closeMenu: false })
    },
    {
      title: 'View Schedule',
      description: 'Check the next pickup day for your barangay at a glance.',
      icon: MdEvent,
      indicatorLabel: 'View Calendar',
      onClick: () => handleNavigation('/resident/schedule', { closeMenu: false })
    },
    {
      title: 'IEC Materials',
      description: 'Browse waste segregation guides and community reminders.',
      icon: MdMenuBook,
      indicatorLabel: 'Open Library',
      onClick: () => handleNavigation('/resident/iec', { closeMenu: false })
    }
  ];

  // Navigation links with routing (add Settings, remove from top bar)
  const navLinks = [
    { label: 'Home', icon: <MdHome className="w-6 h-6" />, to: '/resident', showLoading: true },
    { label: 'Submit Report Issue', icon: <MdReport className="w-6 h-6" />, to: '/resident/report', showLoading: true },
    { label: 'View Issue Status', icon: <FiAlertCircle className="w-6 h-6" />, to: '/resident/issue-status', showLoading: true },
    { label: 'View Collection Schedule', icon: <MdEvent className="w-6 h-6" />, to: '/resident/schedule', showLoading: true },
    { label: 'Access IEC Materials', icon: <MdMenuBook className="w-6 h-6" />, to: '/resident/iec', showLoading: true },
    { label: 'Settings', icon: <FiSettings className="w-6 h-6" />, to: '/resident/settings', showLoading: true },
    { label: 'Feedback', icon: <FiMessageSquare className="w-6 h-6" />, to: '/resident/feedback', showLoading: true },
    { label: 'Logout', icon: <MdLogout className="w-6 h-6 text-red-500" />, action: () => setShowLogoutModal(true), showLoading: false },
  ];

  const activeCooldownMessage = avatarUploadError ? '' : formatCooldownMessage(avatarCooldownUntil);

  const confirmLogout = async () => {
    // Call logout API to set online_status to offline
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const { authService } = await import('../../services/authService');
      await authService.logout(parseInt(userId));
    }
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setUser(null);
    setShowLogoutModal(false);
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

  const handleFeedbackFormSubmit = (event) => {
    event.preventDefault();
    const trimmedMessage = feedbackMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setPendingFeedbackData({
      type: feedbackType,
      message: trimmedMessage
    });
    setShowFeedbackConfirm(true);
  };

  const confirmFeedbackSubmission = () => {
    if (!pendingFeedbackData) {
      setShowFeedbackConfirm(false);
      return;
    }

    setIsFeedbackSubmitting(true);

    try {
      alert('Thank you for your feedback! We value your input.');
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackType('suggestion');
    } finally {
      setIsFeedbackSubmitting(false);
      setPendingFeedbackData(null);
      setShowFeedbackConfirm(false);
    }
  };

  const cancelFeedbackSubmission = () => {
    if (isFeedbackSubmitting) {
      return;
    }
    setShowFeedbackConfirm(false);
    setPendingFeedbackData(null);
  };

  // Handle chat messages
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // Add user message
    const userMessage = { type: 'user', content: messageInput };
    setChatMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Find FAQ match
    const matchedFaq = faqData.find(faq => 
      messageInput.toLowerCase().includes(faq.question.toLowerCase()) ||
      faq.question.toLowerCase().includes(messageInput.toLowerCase())
    );

    // Add bot response after delay
    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        content: matchedFaq 
          ? matchedFaq.answer
          : "I'm not sure about that. Would you like to know about our collection schedules, reporting issues, or waste segregation guides?"
      };
      setChatMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);

    setMessageInput('');
  };

  // Handle enter key in chat
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle clicking outside of chat
  const handleClickOutside = (e) => {
    if (showChat && e.target.closest('.chat-container') === null && !e.target.closest('.chat-button')) {
      setShowChat(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChat]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showChat) {
        setShowChat(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showChat]);

  return (
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
        secondaryText="Preparing your personalized collections overview."
        variant="login"
      />

      {/* Hamburger Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
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
                  ) : resident.avatar ? (
                    <img src={resident.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
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
                <h2 className="text-white font-semibold text-base truncate">{resident.name}</h2>
                <p className="text-green-100 text-sm">{resident.role}</p>
              </div>
              <button 
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full text-red-500 hover:text-red-400 hover:bg-white/10 transition-colors"
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
                        ? 'bg-white hover:bg-red-50 text-red-600 border border-red-100' 
                        : link.label === 'Settings'
                          ? 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'
                          : 'bg-white hover:bg-green-50/50 text-[#222222] border border-gray-100'
                      }
                      ${location.pathname === link.to ? (link.label === 'Logout' ? 'border-2 border-red-400' : 'border-2 border-[#218a4c]') : 'border'}
                    `}
                    onClick={() => handleNavigation(link.to, {
                      skipLoading: link.showLoading === false,
                      customAction: link.action
                    })}
                  >
                    <span className={link.label === 'Logout' ? 'text-red-500' : link.label === 'Settings' ? 'text-green-700' : 'text-[#218a4c]'}>
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
            <h2 className="text-2xl font-bold text-[#218a4c] mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-700 text-center">Are you sure you want to log out?</p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition focus:outline-[#218a4c] focus:ring-2 focus:ring-red-200"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
              <button
                className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-[#218a4c] font-semibold shadow hover:bg-gray-50 transition focus:outline-[#218a4c] focus:ring-2 focus:ring-green-100"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full animate-fadeIn">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Submit Feedback</h2>
            <form onSubmit={handleFeedbackFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                  <option value="appreciation">Appreciation</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Please share your thoughts..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!feedbackMessage.trim()}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    feedbackMessage.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setShowFeedbackConfirm(false);
                    setPendingFeedbackData(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 px-4 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <FeedbackConfirmationModal
        isOpen={showFeedbackConfirm}
        onConfirm={confirmFeedbackSubmission}
        onCancel={cancelFeedbackSubmission}
        isSubmitting={isFeedbackSubmitting}
        feedbackType={pendingFeedbackData?.type}
        feedbackMessage={pendingFeedbackData?.message}
      />
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-green-800 px-4 py-3 sticky top-0 z-10">
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
          onClick={() => handleNavigation('/resident', { closeMenu: false })}
        >
          KolekTrash
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full text-white hover:text-green-200 focus:outline-none transition-colors duration-150 group"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            onClick={() => handleNavigation('/resident/notifications', { closeMenu: false })}
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
        {/* --- Main Content Container: px-4 py-4, just like TruckDriverHome --- */}
        {location.pathname === '/resident' ? (
          <div className="flex-1 bg-gray-50 px-4 py-4">
            {/* Event Carousel */}
            <div className="relative w-full h-64 md:h-80 overflow-hidden shadow-lg mb-8 mt-4 rounded-xl">
              <Slider
                dots={true}
                infinite={true}
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={4000}
                arrows={false}
                dotsClass="slick-dots custom-dots"
              >
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="relative h-64 md:h-80">
                    <div
                      className="w-full h-full bg-cover bg-center relative rounded-xl"
                      style={{ backgroundImage: `url(${event.image})` }}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-xl"></div>
                      {/* Event Info */}
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
              <style>{`
                .custom-dots {
                  bottom: 20px !important;
                }
                .custom-dots li button:before {
                  color: white !important;
                  font-size: 12px !important;
                }
                .custom-dots li.slick-active button:before {
                  color: white !important;
                }
              `}</style>
            </div>
            {/* Quick Actions Section */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                <h2 className="text-xl font-bold text-green-800">Quick Actions</h2>
                <p className="text-sm text-gray-500">
                  Handle your most common tasks in just a few taps.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {quickActionItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={item.onClick}
                      className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-br from-green-700 to-green-600 p-6 text-left shadow-lg text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white">{item.title}</h3>
                          <p className="mt-2 text-sm text-white/80 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between text-sm font-medium text-white/90">
                        <span>{item.indicatorLabel}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-green-700">
                          <FiChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
        {/* Always render nested resident pages here */}
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>
      {/* Chat Button */}
      <button
        className={`chat-button fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${showChat ? 'bg-red-500 hover:bg-red-600' : 'bg-[#218a4c] hover:bg-[#1a6d3d]'} text-white p-2.5 sm:p-3 rounded-full shadow-lg focus:outline-[#218a4c] flex items-center gap-2 transition-all duration-200 hover:scale-110`}
        aria-label="Open Chat"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? (
          <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <MdQuestionAnswer className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Enhanced Chat Interface */}
      {showChat && (
        <div className="chat-container fixed inset-x-2 bottom-16 sm:inset-auto sm:bottom-24 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 w-[calc(100%-16px)] sm:w-full sm:max-w-[320px] animate-fadeInUp">
          {/* Chat Header */}
          <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-green-800 to-green-700 rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <MdQuestionAnswer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">KolekTrash Assistant</h2>
                <p className="text-[10px] sm:text-xs text-green-100">Ask me anything about waste collection</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-3 sm:p-4 h-[300px] sm:h-[350px] overflow-y-auto space-y-3 sm:space-y-4 bg-gray-50/50">
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {message.type === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MdQuestionAnswer className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div 
                  className={`max-w-[80%] p-2.5 sm:p-3 rounded-2xl shadow-sm text-sm ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MdQuestionAnswer className="w-4 h-4 text-green-600" />
                </div>
                <div className="max-w-[80%] p-2.5 sm:p-3 rounded-2xl shadow-sm bg-white text-gray-800 rounded-bl-none border border-gray-100">
                  <div className="flex items-center h-[18px]">
                    <div className="messenger-typing-dot"></div>
                    <div className="messenger-typing-dot"></div>
                    <div className="messenger-typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <style>{`
            .messenger-typing-dot {
              width: 8px;
              height: 8px;
              margin: 0 2px;
              background-color: #bbb;
              border-radius: 50%;
              display: inline-block;
              animation: messenger-typing 1.4s infinite ease-in-out;
            }
            .messenger-typing-dot:nth-child(1) { animation-delay: 200ms; }
            .messenger-typing-dot:nth-child(2) { animation-delay: 300ms; }
            .messenger-typing-dot:nth-child(3) { animation-delay: 400ms; }
            @keyframes messenger-typing {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); opacity: 0.5; }
              60% { transform: translateY(0); }
            }
          `}</style>

          {/* Chat Input Section */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100 rounded-b-2xl">
            {/* FAQ Quick Access */}
            <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
              {faqData.slice(0, 3).map((faq, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Add user message immediately
                    const userMessage = { type: 'user', content: faq.question };
                    setChatMessages(prev => [...prev, userMessage]);
                    
                    // Clear input immediately
                    setMessageInput('');
                    
                    // Add bot response after a short delay
                    setTimeout(() => {
                      const botResponse = {
                        type: 'bot',
                        content: faq.answer
                      };
                      setChatMessages(prev => [...prev, botResponse]);
                    }, 500);
                  }}
                  className="text-[10px] sm:text-xs bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium border border-green-100 hover:scale-105 active:scale-95 transition-transform"
                >
                  {faq.question}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 bg-gray-50/50"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 sm:p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg disabled:hover:scale-100"
              >
                <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="mt-auto text-xs text-center text-white bg-[#218a4c] py-3 w-full">
        © 2025 Municipality of Sipocot – MENRO. All rights reserved.
      </footer>
    </div>
  );
};

export default ResidentDashboard;

// Add animations to App.css if not present:
// .animate-fadeInLeft { animation: fadeInLeft 0.2s ease; }
// @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1, transform: none; } }
// .animate-fadeInUp { animation: fadeInUp 0.3s ease; }
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1, transform: none; } }
