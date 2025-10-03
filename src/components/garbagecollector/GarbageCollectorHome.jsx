import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FiBell, FiChevronRight } from 'react-icons/fi';
import { MdEvent, MdMenuBook, MdReport } from 'react-icons/md';
import { authService } from '../../services/authService';
import StatusUpdate from '../shared/StatusUpdate';

// Dummy event images for carousel
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
];

// Quick Tips Data
const tips = [
  "Remember to check your safety equipment before starting your route.",
  "Take note of any irregularities in collection schedules.",
  "Report any collection issues immediately to the supervisor.",
  "Maintain cleanliness and proper handling of waste materials.",
  "Coordinate with your team for efficient collection."
];

// Quick Tips Component - styled to match Truck Driver home
const QuickTips = ({ tips, tipIndex, showTip, setShowTip, setTipIndex }) => {
  useEffect(() => {
    if (!showTip) return;
    const interval = setInterval(() => {
      setTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [showTip, tips.length, setTipIndex]);

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
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${index === tipIndex ? 'bg-green-500' : 'bg-green-300'}`}
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
};

// Carousel Settings
const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  dotsClass: "slick-dots custom-dots",
  arrows: false,
};

function GarbageCollectorHome() {
  const [showTip, setShowTip] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
          const userId = userData.id || userData.user_id;
          if (userId) {
            const response = await authService.getUserData(userId);
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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 px-4 py-4">
      {/* Quick Tips Section */}
      <QuickTips tips={tips} tipIndex={tipIndex} showTip={showTip} setShowTip={setShowTip} setTipIndex={setTipIndex} />
      
      {/* Event Carousel */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden shadow-lg mb-8 mt-4 rounded-xl">
        <Slider {...carouselSettings} className="h-full">
          {eventImages.map((event, index) => (
            <div key={index} className="relative h-64 md:h-80">
              <div
                className="w-full h-full bg-cover bg-center relative rounded-xl"
                style={{ backgroundImage: `url(${event.url})` }}
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
                  <p className="text-sm md:text-base text-gray-200">{event.description}</p>
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
      
      {/* Main Content Area */}
      <div className="text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
          Dashboard
        </h1>
      </div>
      
      {/* 2x2 Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
        {/* Today's Collection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <MdEvent className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-800">8</span>
          </div>
          <h3 className="text-sm font-semibold text-green-700 mb-1">Today's Collection</h3>
          <p className="text-xs text-gray-500">Total pickups today</p>
        </div>
        
        {/* Completed Tasks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <MdReport className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-800">5</span>
          </div>
          <h3 className="text-sm font-semibold text-green-700 mb-1">Completed Tasks</h3>
          <p className="text-xs text-gray-500">Tasks finished</p>
        </div>
        
        {/* Routes Covered */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <MdMenuBook className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-800">12</span>
          </div>
          <h3 className="text-sm font-semibold text-green-700 mb-1">Routes Covered</h3>
          <p className="text-xs text-gray-500">Routes completed</p>
        </div>
        
        {/* On-time Rate */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FiBell className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-800">95%</span>
          </div>
          <h3 className="text-sm font-semibold text-green-700 mb-1">On-time Rate</h3>
          <p className="text-xs text-gray-500">This week's performance</p>
        </div>
      </div>
      
      {/* Status Update Section */}
      {user && (
        <div className="mb-8">
          <StatusUpdate 
            userId={user.id || user.user_id} 
            currentStatus={user.status}
            onStatusUpdate={(newStatus) => {
              setUser(prev => ({ ...prev, status: newStatus }));
            }}
          />
        </div>
      )}
      
      {/* Quick Actions Section */}
      <h2 className="text-xl font-bold text-green-800 mb-4">Quick Actions</h2>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/garbagecollector/tasks')}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <MdReport className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">View Tasks</h3>
                <p className="text-xs text-white/80 mt-1">See your assigned tasks</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/garbagecollector/schedule')}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <MdEvent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">View Schedule</h3>
                <p className="text-xs text-white/80 mt-1">Check your collection schedule</p>
              </div>
            </div>
          </button>
        </div>
        <button
          onClick={() => navigate('/garbagecollector/routes')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MdMenuBook className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">View Routes</h3>
              <p className="text-xs text-white/80 mt-1">See your assigned routes</p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Today's Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-bold text-green-800 mb-4">Today's Summary</h2>
        <div className="space-y-4">
          {/* Next Assigned Route */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <MdMenuBook className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Next Assigned Route</p>
                <p className="text-sm text-gray-500">Zone 3, Barangay San Roque</p>
                <p className="text-sm text-green-700 font-semibold">7:00 AM - 9:00 AM</p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => navigate('/garbagecollector/routes')}
                className="p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors flex items-center justify-center"
                aria-label="View Route Details"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Today's Tasks */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <MdReport className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Today's Tasks</p>
                <p className="text-sm text-gray-500">5 tasks remaining</p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => navigate('/garbagecollector/tasks')}
                className="p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors flex items-center justify-center"
                aria-label="View Tasks"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Recent Issues Reported */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <FiBell className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 mb-1">Recent Issues Reported</p>
                <span className="font-medium text-gray-800">2 issues reported on your route</span>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => navigate('/garbagecollector/tasks')}
                className="p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors flex items-center justify-center"
                aria-label="View Issues"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Reminders */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <FiBell className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Reminders</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Wear safety gear at all times</li>
                <li>Check vehicle before departure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GarbageCollectorHome;
