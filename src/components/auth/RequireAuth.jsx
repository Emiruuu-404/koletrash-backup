import { Navigate, useLocation } from 'react-router-dom'

export function isAuthenticated() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return false
    const user = JSON.parse(raw)
    return Boolean(user && user.user_id)
  } catch {
    return false
  }
}

export default function RequireAuth({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export function GuestOnly({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return children
}





