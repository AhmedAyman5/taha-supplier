import { Navigate, Outlet } from 'react-router'
import { DEV_SKIP_LOGIN } from '../services/auth'
import { isLoggedIn } from '../services/authStorage'

// The ONLY place that uses DEV_SKIP_LOGIN to grant access
function ProtectedRoute() {
  if (DEV_SKIP_LOGIN || isLoggedIn()) return <Outlet />
  return <Navigate to="/login" replace />
}

export default ProtectedRoute
