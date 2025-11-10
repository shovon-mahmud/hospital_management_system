/* eslint-disable react/prop-types */
import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

function roleHome(role) {
  switch (role) {
    case 'Admin': return '/admin'
    case 'HR': return '/hr'
    case 'Doctor': return '/doctor'
    case 'Receptionist': return '/reception'
    case 'Patient': return '/patient'
    default: return '/'
  }
}

export default function ProtectedRoute({ roles }) {
  const { user } = useSelector((s) => s.auth)
  if (!user) return <Navigate to="/login" replace />
  
  const userRole = user.role?.name || user.role
  if (roles?.length && !roles.includes(userRole)) return <Navigate to={roleHome(userRole)} replace />
  return <Outlet />
}
