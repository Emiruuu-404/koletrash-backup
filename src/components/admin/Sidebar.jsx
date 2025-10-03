import { NavLink, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiUser,
  FiMap,
  FiCalendar,
  FiTruck,
  FiActivity,
  FiMessageSquare,
  FiAlertCircle,
  FiLogOut
} from 'react-icons/fi'
import { FaUsers, FaMapMarkedAlt, FaCalendarAlt, FaTasks, FaTruckMoving, FaBuilding, FaComments, FaExclamationCircle, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt className="w-6 h-6 mr-3 text-white" /> },
  { divider: true },
  { to: '/admin/users', label: 'Manage Users', icon: <FaUsers className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/routes', label: 'Manage Routes', icon: <FaMapMarkedAlt className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/schedule', label: 'Manage Schedule', icon: <FaCalendarAlt className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/task-management', label: 'Task Management', icon: <FaTasks className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/pickup', label: 'Special Pick-up Request', icon: <FaTruckMoving className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/barangay', label: 'Barangay Activity', icon: <FaBuilding className="w-6 h-6 mr-3 text-white" /> },
  { divider: true },
  { to: '/admin/feedback', label: 'Feedback', icon: <FaComments className="w-6 h-6 mr-3 text-white" /> },
  { to: '/admin/issues', label: 'Issues', icon: <FaExclamationCircle className="w-6 h-6 mr-3 text-white" /> },
  { divider: true },
  { to: '/logout', label: 'Logout', icon: <FaSignOutAlt className="w-6 h-6 mr-3 text-white" />, isLogout: true },
]

export default function Sidebar({ handleLogout }) {
  const location = useLocation()
  return (
    <aside className="w-64 h-screen sticky top-0 bg-gradient-to-b from-green-900 to-green-700 text-white flex flex-col shadow-xl">
      <div className="px-6 py-6 text-xl font-extrabold tracking-wide border-b border-green-800 flex items-center">
        {/* Professional shield icon */}
        <svg className="w-8 h-8 mr-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2c-.28 0-.56.06-.81.18l-7 3.11A2 2 0 003 7.06V12c0 5.25 3.92 9.74 8.47 10.93.36.09.74.09 1.1 0C17.08 21.74 21 17.25 21 12V7.06a2 2 0 00-1.19-1.77l-7-3.11A1.98 1.98 0 0012 2zm0 2.18l7 3.11V12c0 4.41-3.29 8.19-7 9.32C8.29 20.19 5 16.41 5 12V7.29l7-3.11z" />
        </svg>
        KolekTrash Admin
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item, idx) =>
          item.divider ? (
            <hr key={idx} className="my-3 border-green-800 opacity-40" />
          ) : item.isLogout ? (
            <button
              key={item.to}
              onClick={handleLogout}
              className={`flex items-center w-full px-6 py-3 text-base font-semibold rounded-lg transition-all duration-150 hover:bg-green-800 hover:text-white text-white bg-transparent border-0 outline-none mt-2 ${location.pathname === '/logout' ? 'bg-green-100 text-green-800' : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-base font-semibold rounded-lg transition-all duration-150 mt-2 hover:bg-green-600 hover:text-white ${isActive ? 'bg-green-600 text-white shadow' : 'text-white'}`
              }
              end={item.to === '/admin/dashboard'}
            >         
              {item.icon}
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  )
}
