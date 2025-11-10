import { useEffect, useState, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice.js'
import Icon from './Icon.jsx'
import api from '../utils/api.js'

export default function Navbar() {
  const { user } = useSelector((s) => s.auth)
  const dispatch = useDispatch()
  const location = useLocation()

  // Theme handling (light/dark)
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])
  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // Menus
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ patients: [], doctors: [], appointments: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    setNotifMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return
    const fetchNotifications = async () => {
      setNotifLoading(true)
      try {
        const { data } = await api.get('/notifications')
        setNotifications((data?.data || []).slice(0, 5)) // Only recent 5
      } catch (err) {
        console.error('Failed to load notifications', err)
      } finally {
        setNotifLoading(false)
      }
    }
    fetchNotifications()
  }, [user])

  // Search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ patients: [], doctors: [], appointments: [] })
      setSearchOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      setSearchOpen(true)
      try {
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
          api.get(`/patients?limit=5&search=${searchQuery}`).catch(() => ({ data: { data: [] } })),
          api.get(`/doctors?limit=5&search=${searchQuery}`).catch(() => ({ data: { data: [] } })),
          api.get(`/appointments?limit=5&search=${searchQuery}`).catch(() => ({ data: { data: [] } }))
        ])
        setSearchResults({
          patients: patientsRes.data?.data || [],
          doctors: doctorsRes.data?.data || [],
          appointments: appointmentsRes.data?.data || []
        })
      } catch (err) {
        console.error('Search error', err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const unreadCount = notifications.filter(n => !n.read).length

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`, { read: true })
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const roleLinks = useMemo(() => {
    if (!user) return { categories: [], flat: [] }
    
    let categories = []
    let flat = []
    
    if (user.role === 'Admin') {
      categories = [
        {
          label: 'Clinical',
          links: [
            { to: '/patients', label: 'Patients', icon: 'users' },
            { to: '/appointments', label: 'Appointments', icon: 'calendar' },
            { to: '/doctors', label: 'Doctors', icon: 'user' },
            { to: '/queue', label: 'Queue', icon: 'clock' },
          ]
        },
        {
          label: 'Management',
          links: [
            { to: '/billing', label: 'Billing', icon: 'money' },
            { to: '/departments', label: 'Departments', icon: 'department' },
            { to: '/inventory', label: 'Inventory', icon: 'box' },
          ]
        },
        {
          label: 'HR & System',
          links: [
            { to: '/hr/employees', label: 'Employees', icon: 'users' },
            { to: '/hr/leaves', label: 'Leaves', icon: 'calendar' },
            { to: '/hr/payroll', label: 'Payroll', icon: 'money' },
            { to: '/logs', label: 'Logs', icon: 'document' },
            { to: '/admin/api-test', label: 'API Test', icon: 'beaker' },
          ]
        }
      ]
      flat = categories.flatMap(c => c.links)
    }
    if (user.role === 'HR') {
      categories = [
        {
          label: 'HR',
          links: [
            { to: '/hr', label: 'HR Dashboard', icon: 'users' },
            { to: '/hr/employees', label: 'Employees', icon: 'users' },
            { to: '/hr/leaves', label: 'Leaves', icon: 'calendar' },
            { to: '/hr/payroll', label: 'Payroll', icon: 'money' },
          ]
        },
        {
          label: 'Resources',
          links: [
            { to: '/departments', label: 'Departments', icon: 'department' },
            { to: '/doctors', label: 'Doctors', icon: 'user' },
            { to: '/inventory', label: 'Inventory', icon: 'box' },
          ]
        }
      ]
      flat = categories.flatMap(c => c.links)
    }
    if (user.role === 'Receptionist') {
      flat = [
        { to: '/reception', label: 'Dashboard', icon: 'chart' },
        { to: '/appointments', label: 'Appointments', icon: 'calendar' },
        { to: '/queue', label: 'Queue', icon: 'clock' },
        { to: '/billing', label: 'Billing', icon: 'money' },
        { to: '/prescriptions', label: 'Prescriptions', icon: 'document' },
      ]
    }
    if (user.role === 'Doctor') {
      flat = [
        { to: '/doctor', label: 'Dashboard', icon: 'chart' },
        { to: '/appointments', label: 'My Appointments', icon: 'calendar' },
        { to: '/availability', label: 'My Schedule', icon: 'clock' },
        { to: '/queue', label: 'Waiting Queue', icon: 'users' },
        { to: '/prescriptions', label: 'Prescriptions', icon: 'document' },
      ]
    }
    
    return { categories, flat }
  }, [user])

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  // eslint-disable-next-line react/prop-types
  const MobileToggleIcon = ({ open }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-800 dark:text-gray-100">
      {open ? (
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )

  // eslint-disable-next-line react/prop-types
  const NavDropdown = ({ category, isActive }) => {
    const [open, setOpen] = useState(false)
    // eslint-disable-next-line react/prop-types
    const { label, links } = category || {}
    if (!links) return null
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-1"
        >
          {label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-50">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isActive(l.to)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon name={l.icon} className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <MobileToggleIcon open={mobileOpen} />
            </button>
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-sm">
                <div className="text-white"><Icon name="hospital" className="w-6 h-6 text-white" /></div>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HMS
              </span>
            </Link>
          </div>

          {/* Center: Search (md+) */}
          <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md mx-6 relative">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Icon name="search" className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search patients, doctors, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : (
                  <>
                    {searchResults.patients.length > 0 && (
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Patients</div>
                        {searchResults.patients.map((p) => (
                          <Link
                            key={p._id}
                            to={`/patients`}
                            onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <Icon name="user" className="w-5 h-5 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.user?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{p.patientId || p.contact?.phone || ''}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.doctors.length > 0 && (
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Doctors</div>
                        {searchResults.doctors.map((d) => (
                          <Link
                            key={d._id}
                            to={`/doctors`}
                            onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <Icon name="user" className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.user?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{d.specialization || ''}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.appointments.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Appointments</div>
                        {searchResults.appointments.map((a) => (
                          <Link
                            key={a._id}
                            to={`/appointments`}
                            onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <Icon name="calendar" className="w-5 h-5 text-purple-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {a.patient?.user?.name || 'Patient'} → {a.doctor?.user?.name || 'Doctor'}
                              </div>
                              <div className="text-xs text-gray-500">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.patients.length === 0 && searchResults.doctors.length === 0 && searchResults.appointments.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifMenuOpen(o => !o)}
                  className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Notifications"
                >
                  <Icon name="bell" className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifMenuOpen(false)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markNotificationRead(n._id)}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop navigation links - grouped dropdown for many links or flat for few */}
            {user && roleLinks.categories.length > 0 ? (
              <div className="hidden lg:flex items-center gap-1 ml-2">
                {roleLinks.categories.map((cat) => (
                  <NavDropdown key={cat.label} category={cat} isActive={isActive} />
                ))}
              </div>
            ) : user && roleLinks.flat.length > 0 ? (
              <div className="hidden md:flex items-center gap-2 ml-2 text-sm">
                {roleLinks.flat.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={
                      `px-3 py-2 rounded-md transition-colors ${isActive(l.to)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`
                    }
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {/* User section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-sm"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white leading-4">{user.name}</span>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">{user.role}</span>
                  </div>
                  <svg className="hidden sm:block" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <Icon name="user" className="w-5 h-5" /> Profile
                      </Link>
                      {user.role === 'Admin' && (
                        <Link to="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                          <Icon name="settings" className="w-5 h-5" /> Settings
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => { setUserMenuOpen(false); dispatch(logout()) }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all" to="/signup">
                  Sign Up
                </Link>
                <Link className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all" to="/login">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Icon name="search" className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Mobile Search Results */}
          {searchOpen && (searchResults.patients.length > 0 || searchResults.doctors.length > 0 || searchResults.appointments.length > 0) && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-1 max-h-64 overflow-y-auto">
              {searchResults.patients.slice(0, 3).map((p) => (
                <Link
                  key={p._id}
                  to={`/patients`}
                  onClick={() => { setSearchQuery(''); setSearchOpen(false); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white dark:hover:bg-gray-700"
                >
                  <Icon name="user" className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{p.user?.name || 'Patient'}</span>
                </Link>
              ))}
              {searchResults.doctors.slice(0, 3).map((d) => (
                <Link
                  key={d._id}
                  to={`/doctors`}
                  onClick={() => { setSearchQuery(''); setSearchOpen(false); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white dark:hover:bg-gray-700"
                >
                  <Icon name="user" className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{d.user?.name || 'Doctor'}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Role links */}
          {user && (
            <div className="space-y-2">
              {roleLinks.categories.length > 0 ? (
                roleLinks.categories.map((cat) => (
                  <div key={cat.label}>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">{cat.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.links.map((l) => (
                        <Link
                          key={l.to}
                          to={l.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isActive(l.to)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <Icon name={l.icon} className="w-4 h-4" />
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {roleLinks.flat.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isActive(l.to)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <Icon name={l.icon} className="w-4 h-4" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auth actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {isDark ? 'Dark' : 'Light'} mode
            </button>

            {user ? (
              <button
                onClick={() => { setMobileOpen(false); dispatch(logout()) }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium"
              >
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium" to="/signup">
                  Sign Up
                </Link>
                <Link onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium" to="/login">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
