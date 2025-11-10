import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getSocket, joinUserRoom } from './utils/socket.js'
import Navbar from './components/Navbar.jsx'
import Icon from './components/Icon.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import GuestRoute from './routes/GuestRoute.jsx'
import LoginPage from './features/auth/login.jsx'
import SignupPage from './features/auth/signup.jsx'
import VerifyEmailLink from './features/auth/VerifyEmailLink.jsx'
import AdminDashboard from './features/reports/AdminDashboard.jsx'
import DoctorDashboard from './features/doctors/DoctorDashboard.jsx'
import PatientDashboard from './features/patients/PatientDashboard.jsx'
import ReceptionDashboard from './features/appointments/ReceptionDashboard.jsx'
import PatientsPage from './features/patients/PatientsPage.jsx'
import DoctorsPage from './features/doctors/DoctorsPage.jsx'
import AppointmentsPage from './features/appointments/AppointmentsPage.jsx'
import BillsPage from './features/billing/BillsPage.jsx'
import DepartmentsPage from './features/hr/DepartmentsPage.jsx'
import HRDashboard from './features/hr/HRDashboard.jsx'
import EmployeesPage from './features/hr/EmployeesPageNew.jsx'
import LeavesPage from './features/hr/LeavesPageNew.jsx'
import PayrollPage from './features/hr/PayrollPageNew.jsx'
import InventoryPage from './features/inventory/InventoryPage.jsx'
import NotificationsPage from './features/notifications/NotificationsPage.jsx'
import LogsPage from './features/logs/LogsPage.jsx'
import WaitingQueuePage from './features/queue/WaitingQueuePage.jsx'
import DoctorAvailabilityPage from './features/doctors/DoctorAvailabilityPage.jsx'
import AdminSettings from './features/admin/AdminSettings.jsx'
import ApiTestPage from './features/admin/ApiTestPage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import PrescriptionsPage from './features/prescriptions/PrescriptionsPage.jsx'

export default function App() {
  const { user } = useSelector((s) => s.auth)

  useEffect(() => {
    if (!user?._id) return
    const s = getSocket()
    joinUserRoom(user._id)
    const onNotification = (payload) => {
      const msg = payload?.message || 'You have a new notification'
      const title = payload?.title || 'Notification'
      toast.custom((t) => (
        <div className={`pointer-events-auto max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl ring-1 ring-black ring-opacity-5 p-4 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <Icon name="bell" className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{msg}</p>
            </div>
          </div>
        </div>
      ), { duration: 4000 })
    }
    s.on('notification', onNotification)
    return () => { s.off('notification', onNotification) }
  }, [user?._id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailLink />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Admin"]} />}> 
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/api-test" element={<ApiTestPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Admin","HR"]} />}> 
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/hr/employees" element={<EmployeesPage />} />
            <Route path="/hr/leaves" element={<LeavesPage />} />
            <Route path="/hr/payroll" element={<PayrollPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Doctor"]} />}> 
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/availability" element={<DoctorAvailabilityPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Admin"]} />}> 
            <Route path="/availability/:doctorId?" element={<DoctorAvailabilityPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Receptionist"]} />}> 
            <Route path="/reception" element={<ReceptionDashboard />} />
          </Route>

          {/* Shared routes for staff roles */}
          <Route element={<ProtectedRoute roles={["Admin","Receptionist","Doctor"]} />}> 
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/queue" element={<WaitingQueuePage />} />
            <Route path="/billing" element={<BillsPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Patient"]} />}> 
            <Route path="/patient" element={<PatientDashboard />} />
          </Route>

          {/* Profile - accessible to all authenticated users */}
          <Route element={<ProtectedRoute roles={["Admin","HR","Doctor","Receptionist","Patient"]} />}> 
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster 
        position="top-right"
        containerStyle={{ pointerEvents: 'none' }}
        toastOptions={{
          className: 'backdrop-blur-lg',
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#1f2937',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      />
    </div>
  )
}


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

function Home() {
  const { user } = useSelector((s) => s.auth)
  if (user) return <Navigate to={roleHome(user.role)} replace />
  const roles = [
    { name: 'Admin', path: '/admin', icon: <Icon name="users" className="text-5xl" />, gradient: 'from-purple-500 to-pink-500', description: 'Manage hospital operations' },
    { name: 'Doctor', path: '/doctor', icon: <Icon name="user" className="text-5xl" />, gradient: 'from-blue-500 to-cyan-500', description: 'View appointments & patients' },
    { name: 'Receptionist', path: '/reception', icon: <Icon name="calendar" className="text-5xl" />, gradient: 'from-green-500 to-emerald-500', description: 'Schedule & confirm appointments' },
    { name: 'Patient', path: '/patient', icon: <Icon name="hospital" className="text-5xl" />, gradient: 'from-orange-500 to-red-500', description: 'Book appointments & view history' }
  ]

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4 animate-float">
        <h1 className="text-5xl md:text-6xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hospital Management System
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Modern healthcare management platform with role-based access, real-time appointments, and comprehensive patient care
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <Link 
            key={role.name}
            to={role.path} 
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
            <div className="relative z-10 space-y-4">
              <div className="text-5xl">{role.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{role.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
              </div>
              <div className={`inline-flex items-center text-sm font-medium bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
                Access Dashboard
                <div className="ml-1 transform group-hover:translate-x-1 transition-transform">
                  <Icon name="arrow-right" className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
            <Icon name="calendar" className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Real-Time Scheduling</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Instant appointment booking with slot validation</p>
        </div>

        <div className="p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
            <Icon name="users" className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Role-based access with JWT authentication</p>
        </div>

        <div className="p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
            <Icon name="box" className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive insights and reporting</p>
        </div>
      </div>
    </div>
  )
}
