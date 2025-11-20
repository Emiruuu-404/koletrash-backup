import { useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Sidebar from './components/admin/Sidebar'
import Dashboard from './components/admin/Dashboard'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import ForgotPassword from './components/auth/ForgotPassword'
import RequireAuth, { GuestOnly } from './components/auth/RequireAuth'
import ManageSchedule from './components/admin/ManageSchedule'
import ManageUsers from './components/admin/ManageUsers'
import ManageRoute from './components/admin/ManageRoute'
import Pickup from './components/admin/Pickup'
import PickupSimple from './components/admin/PickupSimple'
import BarangayActivity from './components/admin/BarangayActivity'
import BarangayActivityNew from './components/admin/BarangayActivityNew'
import TaskManagement from './components/admin/TaskManagement'
import LandingPage from './components/landingpage/LandingPage'
import Navbar from './components/landingpage/Navbar'
import Section1 from './components/landingpage/Section1'
import Section2 from './components/landingpage/Section2'
import Section3 from './components/landingpage/Section3'
import Section4 from './components/landingpage/Section4'
import ResidentDashboard from './components/resident/ResidentDashboard'
import ResidentHome from './components/resident/ResidentHome'
import ResidentReport from './components/resident/ResidentReport'
import ResidentIssueStatus from './components/resident/ResidentIssueStatus'
import ResidentSchedule from './components/resident/ResidentSchedule'
import ResidentIEC from './components/resident/ResidentIEC'
import ResidentNotifications from './components/resident/ResidentNotifications'
import ResidentSettings from './components/resident/ResidentSettings'
import ResidentFeedback from './components/resident/Feedback'
import BarangayHeadDashboard from './components/barangayhead/BarangayHeadDashboard'
import BarangayHeadNotifications from './components/barangayhead/BarangayHeadNotifications'
import BarangayHeadSettings from './components/barangayhead/BarangayHeadSettings'
import Home from './components/barangayhead/Home'
import ReportIssue from './components/barangayhead/ReportIssue'
import BarangayHeadIssueStatus from './components/barangayhead/BarangayHeadIssueStatus'
import BarangayHeadFeedback from './components/barangayhead/Feedback'
import PickupRequest from './components/barangayhead/PickupRequest'
import CollectionSchedule from './components/barangayhead/CollectionSchedule'
import CollectionReports from './components/barangayhead/CollectionReports'
import Appointments from './components/barangayhead/Appointments'
import IEC from './components/barangayhead/IEC'
import TruckDriverDashboard from './components/truckdriver/TruckDriverDashboard'
import TruckDriverHome from './components/truckdriver/TruckDriverHome'
import TruckDriverNotifications from './components/truckdriver/TruckDriverNotifications'
import TruckDriverSettings from './components/truckdriver/TruckDriverSettings'
import TruckDriverCollectionSchedule from './components/truckdriver/TruckDriverCollectionSchedule'
import TruckDriverTask from './components/truckdriver/TruckDriverTask'
import TruckDriverRoutes from './components/truckdriver/TruckDriverRoutes'
import RouteRun from './components/truckdriver/RouteRun'
import TruckDriverVehicle from './components/truckdriver/TruckDriverVehicle'
import GarbageCollectorDashboard from './components/garbagecollector/GarbageCollectorDashboard'
import GarbageCollectorHome from './components/garbagecollector/GarbageCollectorHome'
import GarbageCollectorNotifications from './components/garbagecollector/GarbageCollectorNotifications'
import GarbageCollectorSettings from './components/garbagecollector/GarbageCollectorSettings'
import GarbageCollectorRoutes from './components/garbagecollector/GarbageCollectorRoutes'
import CollectorRouteRun from './components/garbagecollector/CollectorRouteRun'
import GarbageCollectorTasks from './components/garbagecollector/GarbageCollectorTasks'
import GarbageCollectorSchedule from './components/garbagecollector/GarbageCollectorSchedule'
import Issues from './components/admin/Issues'
import AdminFeedback from './components/admin/Feedback'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from './contexts/LoaderContext.jsx';

function Placeholder({ title }) {
  return (
    <div className="w-full h-full p-8">
      <h1 className="text-2xl font-bold text-green-700 mb-4">{title}</h1>
      <p className="text-gray-600">This is the {title} page.</p>
    </div>
  )
}

function App() {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileBtnRef = useRef(null)
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New event added', read: false },
    { id: 2, message: 'Schedule updated', read: false },
    { id: 3, message: 'Reminder: Meeting tomorrow', read: true },
    { id: 4, message: 'Garbage collection delayed', read: false },
    { id: 5, message: 'New message from admin', read: true },
    { id: 6, message: 'System maintenance scheduled', read: false },
    { id: 7, message: 'Weekly report available', read: true },
    { id: 8, message: 'Event registration open', read: false },
    { id: 9, message: 'Profile updated successfully', read: true },
    { id: 10, message: 'New feature added to the app', read: false },
  ])
  const navigate = useNavigate()
  const location = useLocation()
  const { showLoader } = useLoader()

  // theme toggling removed per request

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const goToSettings = () => {
    setProfileOpen(false)
    navigate('/admin/users')
  }

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    
    // Call logout API to set online_status to offline
    const userId = localStorage.getItem('user_id')
    if (userId) {
      const { authService } = await import('./services/authService')
      await authService.logout(parseInt(userId))
    }
    
    localStorage.removeItem('user')
    localStorage.removeItem('user_id')
    localStorage.removeItem('access_token')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('token_type')
    await showLoader({
      primaryText: 'Signing you out…',
      secondaryText: 'We\'re securely closing your session.',
      variant: 'login'
    })
    navigate('/', { replace: true })
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
    navigate(-1)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Check if we're on auth pages or landing page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password'
  const isLandingPage = location.pathname === '/'

  // Sidebar switching logic
  let sidebar = null;
  if (location.pathname.startsWith('/admin')) {
    sidebar = <Sidebar handleLogout={handleLogout} />;
  }
  // In the future, add custom sidebars for resident, barangayhead, truckdriver here

  // Dynamic Admin Title
  const isAdmin = location.pathname.startsWith('/admin')
  const getAdminTitle = () => {
    if (!isAdmin) return ''
    if (location.pathname.startsWith('/admin/dashboard')) return 'Dashboard'
    if (location.pathname.startsWith('/admin/users')) return 'User Management'
    if (location.pathname.startsWith('/admin/schedule')) return 'Schedule Management'
    if (location.pathname.startsWith('/admin/routes')) return 'Route Management'
    if (location.pathname.startsWith('/admin/pickup')) return 'Special Pickup'
    if (location.pathname.startsWith('/admin/barangay')) return 'Barangay Activity'
    if (location.pathname.startsWith('/admin/feedback')) return 'Feedback'
    if (location.pathname.startsWith('/admin/issues')) return 'Issues'
    if (location.pathname.startsWith('/admin/task-management')) return 'Task Management'
    return 'Admin'
  }

  return (
    <div className="h-screen flex bg-emerald-50 overflow-hidden">
      {!isLandingPage && !isAuthPage && sidebar}
      <main className="flex-1 min-h-screen w-full h-full flex flex-col overflow-hidden">
        {isAdmin && (
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white/90 backdrop-blur-sm border-b border-emerald-100/60 shadow-sm px-5 py-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-emerald-900">{getAdminTitle()}</h1>
                <p className="text-[11px] text-emerald-700/70">Track operations and monitor activities</p>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <button
                ref={profileBtnRef}
                onClick={() => setProfileOpen((v) => !v)}
                onBlur={() => {
                  setTimeout(() => setProfileOpen(false), 120)
                }}
                className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                AD
              </button>

              {profileOpen && (
                <div role="menu" className="absolute right-0 top-11 z-50 w-44 rounded-md border border-emerald-100 bg-white shadow-soft py-1">
                  <button onMouseDown={(e) => e.preventDefault()} onClick={goToSettings} className="w-full text-left px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-50">Settings</button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50/60">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <Routes>
          {/* Landing page - default route */}
          <Route path="/" element={<LandingPage />} />
          {/* Auth routes (guest only) */}
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          {/* Admin routes - protected */}
          <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><Navigate to="/admin/dashboard" replace /></RequireAuth>} />
          <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={['admin']}><Dashboard /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth allowedRoles={['admin']}><ManageUsers /></RequireAuth>} />
          <Route path="/admin/routes" element={<RequireAuth allowedRoles={['admin']}><ManageRoute /></RequireAuth>} />
          <Route path="/admin/schedule" element={<RequireAuth allowedRoles={['admin']}><ManageSchedule /></RequireAuth>} />
          <Route path="/admin/pickup" element={<RequireAuth allowedRoles={['admin']}><PickupSimple /></RequireAuth>} />
          <Route path="/admin/barangay" element={<RequireAuth allowedRoles={['admin']}><BarangayActivity /></RequireAuth>} />
          <Route path="/admin/barangay-new" element={<RequireAuth allowedRoles={['admin']}><BarangayActivityNew /></RequireAuth>} />
          <Route path="/admin/feedback" element={<RequireAuth allowedRoles={['admin']}><AdminFeedback /></RequireAuth>} />
          <Route path="/admin/issues" element={<RequireAuth allowedRoles={['admin']}><Issues /></RequireAuth>} />
          <Route path="/admin/task-management" element={<RequireAuth allowedRoles={['admin']}><TaskManagement /></RequireAuth>} />
          {/* Admin catch-all for undefined admin routes */}
          <Route path="/admin/*" element={<RequireAuth allowedRoles={['admin']}><Placeholder title="Admin Page Not Found" /></RequireAuth>} />
          {/* Resident routes - protected */}
          <Route
            path="/resident"
            element={<RequireAuth allowedRoles={['resident']}><ResidentDashboard unreadNotifications={unreadCount} /></RequireAuth>}
          >
            <Route index element={<ResidentHome />} />
            <Route path="report" element={<ResidentReport />} />
            <Route path="issue-status" element={<ResidentIssueStatus />} />
            <Route path="schedule" element={<ResidentSchedule />} />
            <Route path="iec" element={<ResidentIEC />} />
            <Route path="notifications" element={<ResidentNotifications notifications={notifications} setNotifications={setNotifications} />} />
            <Route path="feedback" element={<ResidentFeedback />} />
            <Route path="settings" element={<ResidentSettings />} />
          </Route>
          {/* Barangay Head routes - protected */}
          <Route
            path="/barangayhead"
            element={<RequireAuth allowedRoles={['barangay_head']}><BarangayHeadDashboard unreadNotifications={unreadCount} /></RequireAuth>}
          >
            <Route index element={<Home />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="issue-status" element={<BarangayHeadIssueStatus />} />
            <Route path="feedback" element={<BarangayHeadFeedback />} />
            <Route path="pickup" element={<PickupRequest />} />
            <Route path="schedule" element={<CollectionSchedule />} />
            <Route path="collection-reports" element={<CollectionReports />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="iec" element={<IEC />} />
            <Route path="notifications" element={<BarangayHeadNotifications notifications={notifications} setNotifications={setNotifications} />} />
            <Route path="settings" element={<BarangayHeadSettings />} />
          </Route>
          {/* Truck Driver routes - protected */}
          <Route
            path="/truckdriver"
            element={<RequireAuth allowedRoles={['truck_driver']}><TruckDriverDashboard unreadNotifications={unreadCount} /></RequireAuth>}
          >
            <Route index element={<TruckDriverHome />} />
            <Route path="schedule" element={<TruckDriverCollectionSchedule />} />
            <Route path="tasks" element={<TruckDriverTask />} />
            <Route path="routes" element={<TruckDriverRoutes />} />
            <Route path="route/:id" element={<RouteRun />} />
            <Route path="vehicle" element={<TruckDriverVehicle />} />
            <Route path="notifications" element={<TruckDriverNotifications notifications={notifications} setNotifications={setNotifications} />} />
            <Route path="settings" element={<TruckDriverSettings />} />
          </Route>
          {/* Garbage Collector routes - protected */}
          <Route
            path="/garbagecollector"
            element={<RequireAuth allowedRoles={['garbage_collector']}><GarbageCollectorDashboard unreadNotifications={unreadCount} /></RequireAuth>}
          >
            <Route index element={<GarbageCollectorHome />} />
            <Route path="schedule" element={<GarbageCollectorSchedule />} />
            <Route path="tasks" element={<GarbageCollectorTasks />} />
            <Route path="routes" element={<GarbageCollectorRoutes />} />
            <Route path="route/:id" element={<CollectorRouteRun />} />
            <Route path="notifications" element={<GarbageCollectorNotifications notifications={notifications} setNotifications={setNotifications} />} />
            <Route path="settings" element={<GarbageCollectorSettings />} />
          </Route>
          {/* Foreman routes - protected */}
          <Route
            path="/foreman"
            element={<RequireAuth allowedRoles={['foreman']}><Placeholder title="Foreman Portal" /></RequireAuth>}
          />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[2000]">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col items-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign Out</h2>
            <p className="mb-6 text-gray-600 text-center">Are you sure you want to sign out from your account?</p>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
