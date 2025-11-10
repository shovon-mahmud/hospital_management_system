import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

function roleHome(role) {
  switch (role) {
    case 'Admin': return '/admin'
    case 'Doctor': return '/doctor'
    case 'Receptionist': return '/reception'
    case 'Patient': return '/patient'
    default: return '/'
  }
}

export default function GuestRoute() {
  const { user } = useSelector((s) => s.auth)
  if (user) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}
