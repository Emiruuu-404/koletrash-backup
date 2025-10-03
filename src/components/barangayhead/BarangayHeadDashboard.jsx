import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiChevronRight, FiX, FiSettings, FiMessageSquare, FiSend } from 'react-icons/fi';
import { MdHome, MdReport, MdEvent, MdMenuBook, MdLogout, MdPerson, MdQuestionAnswer } from 'react-icons/md';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { authService } from '../../services/authService';

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

const tips = [
  'Tip: Monitor collection schedules and reports from residents!',
  'Reminder: Coordinate with MENRO for upcoming events.',
  'Did you know? You can review feedback and suggestions from your barangay.',
];

const eventImages = [
  {
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
    title: 'Tree Planting Activity',
    date: 'May 15, 2025',
    description: 'Join us in making Sipocot greener!',
  },
  {
    url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop',
    title: 'Coastal Cleanup Drive',
    date: 'May 20, 2025',
    description: 'Help us keep our waters clean',
  },
  {
    url: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    title: 'Waste Segregation Seminar',
    date: 'May 25, 2025',
    description: 'Learn proper waste management',
  },
  {
    url: 'https://images.unsplash.com/photo-1542601600647-3a722a90a76b?w=800&auto=format&fit=crop',
    title: 'Environmental Campaign',
    date: 'June 1, 2025',
    description: 'Building a sustainable future',
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', content: 'Hello Barangay Head! How can I support your barangay today?' },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(initialUnread);

  useEffect(() => {
    setUnreadNotifications(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const fallbackId = localStorage.getItem('user_id');
          const resolvedUserId = parsed.user_id || parsed.id || fallbackId;

          if (resolvedUserId) {
            const response = await authService.getUserData(resolvedUserId);
            if (response.status === 'success') {
              setUser(response.data);
            } else {
              console.error('Failed to fetch user data:', response.message);
              setUser(parsed);
            }
          } else {
            setUser(parsed);
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
    const uid = localStorage.getItem('user_id') || resolvedFromStorage || user?.user_id || user?.id;
    if (!uid) return;

    let active = true;
    const loadUnread = async () => {
      try {
        const res = await fetch(`https://koletrash.systemproj.com/backend/api/get_notifications.php?recipient_id=${uid}`);
        const data = await res.json();
        if (active && data?.success) {
          const count = (data.notifications || []).reduce((acc, notification) => {
            const isUnread = notification.response_status !== 'read';
            let pendingAssignment = false;
            try {
              const parsedMessage = JSON.parse(notification.message || '{}');
              if (parsedMessage && (parsedMessage.type === 'assignment' || parsedMessage.type === 'daily_assignments')) {
                pendingAssignment = !['accepted', 'declined'].includes((notification.response_status || '').toLowerCase());
              }
            } catch (err) {
              console.warn('Notification parse error', err);
            }
            return acc + ((isUnread || pendingAssignment) ? 1 : 0);
          }, 0);
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
  }, [user]);

  useEffect(() => {
    if (!showTip) return;
    const intervalId = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(intervalId);
  }, [showTip]);

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

  const barangayHead = {
    name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : 'Loading...',
    role: user?.role || 'Barangay Head',
    avatar: user?.avatar || '',
    username: user?.username || '',
    email: user?.email || '',
    assignedArea: user?.assignedArea || '',
  };

  const navLinks = [
    { label: 'Home', icon: <MdHome className="w-6 h-6" />, to: '/barangayhead', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead') navigate('/barangayhead'); } },
    { label: 'Submit Report Issue', icon: <MdReport className="w-6 h-6" />, to: '/barangayhead/report', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/report') navigate('/barangayhead/report'); } },
    { label: 'Submit Special Pick-up Request', icon: <MdEvent className="w-6 h-6" />, to: '/barangayhead/pickup', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/pickup') navigate('/barangayhead/pickup'); } },
    { label: 'View Collection Schedule', icon: <MdEvent className="w-6 h-6" />, to: '/barangayhead/schedule', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/schedule') navigate('/barangayhead/schedule'); } },
    { label: 'View Collection Reports', icon: <MdMenuBook className="w-6 h-6" />, to: '/barangayhead/collection-reports', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/collection-reports') navigate('/barangayhead/collection-reports'); } },
    { label: 'View Appointment Request', icon: <MdEvent className="w-6 h-6" />, to: '/barangayhead/appointments', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/appointments') navigate('/barangayhead/appointments'); } },
    { label: 'Access IEC Materials', icon: <MdMenuBook className="w-6 h-6" />, to: '/barangayhead/iec', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/iec') navigate('/barangayhead/iec'); } },
    { label: 'Feedback', icon: <FiMessageSquare className="w-6 h-6" />, to: '/barangayhead/feedback', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/feedback') navigate('/barangayhead/feedback'); } },
    { label: 'Settings', icon: <FiSettings className="w-6 h-6" />, to: '/barangayhead/settings', onClick: () => { setMenuOpen(false); if (location.pathname !== '/barangayhead/settings') navigate('/barangayhead/settings'); } },
    { label: 'Logout', icon: <MdLogout className="w-6 h-6 text-red-500" />, to: '/login', onClick: () => { setMenuOpen(false); setShowLogoutModal(true); } },
  ];

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('user');
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
      {loading && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-700 font-medium">Loading user data...</p>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white w-[280px] max-w-[85%] h-full shadow-xl z-50 animate-fadeInLeft flex flex-col">
            <div className="bg-gradient-to-b from-green-800 to-green-700 px-4 py-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow-lg">
                {barangayHead.avatar ? (
                  <img src={barangayHead.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <MdPerson className="w-7 h-7 text-green-800" />
                )}
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
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors ${
                      link.label === 'Logout'
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'
                        : 'bg-green-50/80 hover:bg-green-100 text-green-900 border border-green-100'
                    } ${location.pathname === link.to ? 'border-2' : 'border'}`}
                    onClick={link.onClick}
                  >
                    <span className={link.label === 'Logout' ? 'text-red-500' : 'text-green-700'}>{link.icon}</span>
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
        {location.pathname === '/barangayhead' ? (
          <div className="flex-1 bg-gray-50 px-4 py-4">
            <QuickTips tips={tips} tipIndex={tipIndex} showTip={showTip} setShowTip={setShowTip} />

            <div className="relative w-full h-64 md:h-80 overflow-hidden shadow-lg mb-8 mt-4">
              <Slider {...carouselSettings} className="h-full">
                {eventImages.map((event) => (
                  <div key={event.title} className="relative h-64 md:h-80">
                    <div className="w-full h-full bg-cover bg-center relative" style={{ backgroundImage: `url(${event.url})` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <MdEvent className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">{event.date}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">{event.title}</h3>
                        <p className="text-sm md:text-base text-gray-200">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            <div className="px-0 py-0 space-y-8">
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">Dashboard</h1>
                <p className="text-gray-700">Welcome back, {barangayHead.name}!</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <MdEvent className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-3xl font-bold text-green-800">8</span>
                  </div>
                  <h3 className="text-sm font-semibold text-green-700 mb-1">Collections Made</h3>
                  <p className="text-xs text-gray-500">This month's total</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <MdMenuBook className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-3xl font-bold text-green-800">95%</span>
                  </div>
                  <h3 className="text-sm font-semibold text-green-700 mb-1">On-time Rate</h3>
                  <p className="text-xs text-gray-500">Collection efficiency</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-green-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => navigate('/barangayhead/report')}
                    className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MdReport className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Report Issue</h3>
                      <p className="text-xs text-white/80 mt-1">Submit a report</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/barangayhead/pickup')}
                    className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MdEvent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Special Pick-up</h3>
                      <p className="text-xs text-white/80 mt-1">Request pick-up</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/barangayhead/schedule')}
                    className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MdEvent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">View Schedule</h3>
                      <p className="text-xs text-white/80 mt-1">See schedule</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/barangayhead/collection-reports')}
                    className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MdMenuBook className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">View Collection Reports</h3>
                      <p className="text-xs text-white/80 mt-1">See reports</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/barangayhead/appointments')}
                    className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <MdEvent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">View Appointment Request</h3>
                      <p className="text-xs text-white/80 mt-1">See requests</p>
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => navigate('/barangayhead/iec')}
                  className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full flex flex-col items-center text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <MdMenuBook className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Access IEC Materials</h3>
                    <p className="text-xs text-white/80 mt-1">View educational materials</p>
                  </div>
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-green-800 mb-4">Today's Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <MdEvent className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Next Collection</p>
                        <p className="text-sm text-gray-500">Monday, June 10, 2025</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-800">7:00 AM</p>
                      <p className="text-sm text-gray-500">Basura</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FiMessageSquare className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Pending Reports</p>
                        <p className="text-sm text-gray-500">{unreadNotifications} unread</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/barangayhead/notifications')}
                      className="p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors flex items-center justify-center"
                      aria-label="View Details"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
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
              .custom-dots li.slick-active button:before {
                color: white !important;
              }
            `}</style>
          </div>
        ) : null}

        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>

      <button
        className="chat-button fixed bottom-6 right-6 z-50 bg-[#218a4c] text-white p-3 rounded-full shadow-lg hover:bg-[#1a6d3d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2 transition-all duration-200 hover:scale-110"
        aria-label="Open Chat"
        onClick={() => setShowChat(true)}
      >
        <MdQuestionAnswer className="w-6 h-6" />
      </button>

      {showChat && (
        <div className="chat-container fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm animate-fadeInUp">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-green-800 to-green-700 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <MdQuestionAnswer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">KolekTrash Assistant</h2>
                <p className="text-xs text-green-100">Ask me anything about waste management</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 h-[400px] overflow-y-auto space-y-4 bg-gray-50/50">
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

          <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
            <div className="mb-3 skylight flex flex-wrap gap-2">
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

function QuickTips({ tips, tipIndex, showTip, setShowTip }) {
  if (!showTip) return null;
  return (
    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{tips[tipIndex]}</p>
            <div className="flex gap-1 mt-1">
              {tips.map((_, index) => (
                <div key={index} className={`w-1.5 h-1.5 rounded-full transition-colors ${index === tipIndex ? 'bg-green-500' : 'bg-green-300'}`} />
              ))}
            </div>
          </div>
        </div>
        <button
          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full transition-colors bg-transparent"
          aria-label="Close tip"
          onClick={() => setShowTip(false)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
