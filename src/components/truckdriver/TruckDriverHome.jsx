import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiTrendingUp, FiMapPin, FiClock, FiTruck, FiCalendar, FiChevronRight, FiPlay } from 'react-icons/fi';
import { MdEvent, MdLocationOn } from 'react-icons/md';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { authService } from '../../services/authService';
import StatusUpdate from '../shared/StatusUpdate';

export default function TruckDriverHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          const userId = userData.id || userData.user_id;
          if (userId) {
            const response = await authService.getUserData(userId);
            if (response.status === 'success') {
              setUser(response.data);
            } else {
              console.error('Failed to fetch user data:', response.message);
              setUser(userData);
            }
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Driver info (fallback data)
  const driver = {
    name: user?.full_name || 'Juan Dela Cruz',
    role: 'Truck Driver',
    id: user?.id || user?.user_id || 'TD-001',
    truck: 'Truck #05',
    shift: 'Morning Shift'
  };

  // Today's Statistics
  const todayStats = {
    completed: 8,
    pending: 4,
    total: 12,
    efficiency: 85
  };

  // MENRO events carousel images
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

  // Quick actions
  const quickActions = [
    {
      title: 'View Schedule',
      description: 'Check today\'s collection schedule',
      icon: <FiCalendar className="w-6 h-6" />,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      onClick: () => navigate('/truckdriver/schedule')
    },
    {
      title: 'My Routes',
      description: 'View assigned collection routes',
      icon: <FiMapPin className="w-6 h-6" />,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      onClick: () => navigate('/truckdriver/routes')
    },
    {
      title: 'Vehicle Status',
      description: 'Check truck maintenance status',
      icon: <FiTruck className="w-6 h-6" />,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      onClick: () => navigate('/truckdriver/vehicle')
    },
    {
      title: 'My Tasks',
      description: 'View assigned tasks',
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      onClick: () => navigate('/truckdriver/tasks')
    }
  ];

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    dotsClass: "slick-dots custom-dots"
  };

  return (
    <div className="flex-1 bg-gray-50 px-4 py-4">
      {/* Quick Tips Section */}
      <QuickTips />
      
      {/* Hero Section: Full-width Event Carousel */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden shadow-lg mb-8 mt-4">
        <Slider {...carouselSettings} className="h-full">
          {eventImages.map((event, index) => (
            <div key={index} className="relative h-64 md:h-80">
              <div 
                className="w-full h-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${event.url})` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                {/* Event Info */}
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

      {/* Main Content */}
      <div className="px-0 py-0 space-y-8">
        {/* Welcome Section */}
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-700">
            Welcome back, {driver.name}!
          </p>
        </div>

        {/* Stats Section: Two-column Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Completed Routes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-green-800">{todayStats.completed}</span>
            </div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Completed Routes</h3>
            <p className="text-xs text-gray-500">Out of {todayStats.total} total</p>
          </div>

          {/* Efficiency Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-green-800">{todayStats.efficiency}%</span>
            </div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Efficiency Rate</h3>
            <p className="text-xs text-gray-500">This week's performance</p>
          </div>
        </div>

        {/* Status Update Section */}
        {user && (
          <div>
            <StatusUpdate 
              userId={user.id || user.user_id} 
              currentStatus={user.status}
              onStatusUpdate={(newStatus) => {
                setUser(prev => ({ ...prev, status: newStatus }));
              }}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-green-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`${action.color} ${action.hoverColor} text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{action.title}</h3>
                    <p className="text-xs text-white/80 mt-1">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-green-800 mb-4">Today's Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Current Shift</p>
                  <p className="text-sm text-gray-500">{driver.shift}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-800">{driver.truck}</p>
                <p className="text-sm text-gray-500">Assigned Vehicle</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiMapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Pending Routes</p>
                  <p className="text-sm text-gray-500">{todayStats.pending} remaining</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/truckdriver/schedule')}
                className="p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors flex items-center justify-center"
                aria-label="View Details"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for carousel dots */}
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
  );
}

function QuickTips() {
  const tips = [
    'Check your collection route before starting your shift!',
    'Always wear safety gear during collection.',
    'You can mark routes as completed in real-time.'
  ];
  const [tipIndex, setTipIndex] = React.useState(0);
  const [showTip, setShowTip] = React.useState(true);

  React.useEffect(() => {
    if (!showTip) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length, showTip]);

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
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === tipIndex ? 'bg-green-500' : 'bg-green-300'
                  }`}
                />
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
