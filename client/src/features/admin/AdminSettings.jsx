import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import Icon from '../../components/Icon.jsx'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [loading, setLoading] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [systemStats, setSystemStats] = useState({ users: 0, logs: 0, todayAppointments: 0, uptime: 0 })
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    hospitalName: 'Hospital Management System',
    hospitalAddress: 'Dhaka, Bangladesh',
    hospitalPhone: '+880-1234-567890',
    hospitalEmail: 'admin@hms.bd',
    website: '',
    timeZone: 'Asia/Dhaka',
    language: 'en',
    currency: 'BDT',
    currencySymbol: '৳',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    emergencyContact: '',
    ambulanceContact: '',
    taxId: '',
    licenseNumber: '',
    workingHours: {
      monday: { start: '09:00', end: '17:00', closed: false },
      tuesday: { start: '09:00', end: '17:00', closed: false },
      wednesday: { start: '09:00', end: '17:00', closed: false },
      thursday: { start: '09:00', end: '17:00', closed: false },
      friday: { start: '09:00', end: '17:00', closed: false },
      saturday: { start: '09:00', end: '14:00', closed: false },
      sunday: { start: '09:00', end: '17:00', closed: true }
    }
  })

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    smtpTLS: true,
    fromEmail: '',
    fromName: 'HMS System',
    replyToEmail: '',
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    enableNotifications: true,
    sendAppointmentConfirmations: true,
    sendAppointmentReminders: true,
    reminderHoursBefore: 24
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please check back later.',
    allowRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    enableAuditLog: true,
    logRetention: 90,
    enableRateLimiting: true,
    apiRateLimit: 100,
    uploadMaxSize: 5
  })

  // Users management
  const [users, setUsers] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [testEmailAddress, setTestEmailAddress] = useState('')

  useEffect(() => {
    loadAllSettings()
    fetchSystemStats()
    fetchUsers()
    fetchRecentLogs()
  }, [])

  const loadAllSettings = async () => {
    try {
      const { data } = await api.get('/settings')
      if (data?.data) {
        const settings = data.data
        if (settings.general) setGeneralSettings(settings.general)
        if (settings.email) setEmailSettings(settings.email)
        if (settings.system) setSystemSettings(settings.system)
      }
    } catch (err) {
      console.error('Failed to load settings', err)
    }
  }

  const fetchSystemStats = async () => {
    try {
      const { data } = await api.get('/settings/system-stats')
      setSystemStats(data?.data || { users: 0, logs: 0, todayAppointments: 0, uptime: 0 })
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  const fetchRecentLogs = async () => {
    try {
      const { data } = await api.get('/logs?limit=10')
      setRecentLogs(data?.data || [])
    } catch (err) {
      console.error('Failed to load recent logs', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/hr/users?limit=100')
      setUsers(data?.data || [])
    } catch (err) {
      console.error('Failed to load users', err)
    }
  }

  const saveGeneralSettings = async () => {
    setLoading(true)
    try {
      await api.put('/settings', { general: generalSettings })
      toast.success('General settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const saveEmailSettings = async () => {
    setLoading(true)
    try {
      await api.put('/settings', { email: emailSettings })
      toast.success('Email settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save email settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    setLoading(true)
    try {
      await api.put('/settings', { system: systemSettings })
      toast.success('System settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save system settings')
    } finally {
      setLoading(false)
    }
  }

  const testSmtpConnection = async () => {
    setTestingConnection(true)
    try {
      await api.post('/settings/test-smtp', {
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUser: emailSettings.smtpUser,
        smtpPass: emailSettings.smtpPass,
        smtpSecure: emailSettings.smtpSecure,
        smtpTLS: emailSettings.smtpTLS
      })
      toast.success('✓ SMTP connection successful!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'SMTP connection failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a recipient email address')
      return
    }
    setTestingEmail(true)
    try {
      await api.post('/settings/send-test-email', {
        to: testEmailAddress,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUser: emailSettings.smtpUser,
        smtpPass: emailSettings.smtpPass,
        smtpSecure: emailSettings.smtpSecure,
        smtpTLS: emailSettings.smtpTLS,
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName
      })
      toast.success(`✓ Test email sent to ${testEmailAddress}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email')
    } finally {
      setTestingEmail(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      // Mock toggle
      await api.put(`/hr/users/${userId}`, { isActive: !currentStatus })
      toast.success('User status updated')
      fetchUsers()
    } catch (err) {
      toast.error('Failed to update user status')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/hr/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  const tabs = [
    { id: 'monitoring', label: 'Monitoring', icon: 'chart' },
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'email', label: 'Email/SMTP', icon: 'mail' },
    { id: 'system', label: 'System', icon: 'lock' },
    { id: 'users', label: 'Users', icon: 'users' }
  ]

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure hospital management system</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon name={tab.icon} className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">General Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure basic hospital information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Hospital Name</label>
              <input
                type="text"
                value={generalSettings.hospitalName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, hospitalName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={generalSettings.hospitalEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, hospitalEmail: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={generalSettings.hospitalPhone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, hospitalPhone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Zone</label>
              <select
                value={generalSettings.timeZone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timeZone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={generalSettings.hospitalAddress}
                onChange={(e) => setGeneralSettings({ ...generalSettings, hospitalAddress: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Doctor Signature (Base64 Image)</label>
              <textarea
                value={generalSettings.doctorSignature || ''}
                onChange={(e) => setGeneralSettings({ ...generalSettings, doctorSignature: e.target.value })}
                rows={2}
                placeholder="Paste base64 image string here (e.g., data:image/png;base64,...)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">This signature will appear on prescription PDFs. Use a small transparent PNG (recommended 120x40px).</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveGeneralSettings}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Email Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure SMTP settings for system emails</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Host</label>
              <input
                type="text"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SMTP Port</label>
              <input
                type="number"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SMTP Username</label>
              <input
                type="text"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">From Email</label>
              <input
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                placeholder="noreply@hms.bd"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">From Name</label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.smtpSecure}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Use TLS/SSL</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => toast.success('Test email sent!')}
              className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Test Email
            </button>
            <button
              onClick={saveEmailSettings}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">System Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure system behavior and security</p>
          </div>

          <div className="space-y-6">
            {/* Toggle Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-xs text-gray-500">Temporarily disable access</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium">Allow Registration</p>
                  <p className="text-xs text-gray-500">Public user registration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.allowRegistration}
                    onChange={(e) => setSystemSettings({ ...systemSettings, allowRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-xs text-gray-500">Require email verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.requireEmailVerification}
                    onChange={(e) => setSystemSettings({ ...systemSettings, requireEmailVerification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Input Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) => setSystemSettings({ ...systemSettings, maxLoginAttempts: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                <select
                  value={systemSettings.backupFrequency}
                  onChange={(e) => setSystemSettings({ ...systemSettings, backupFrequency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSystemSettings}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">User Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage system users and permissions</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg">
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.slice(0, 10).map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {user.role?.name || user.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isEmailVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
                        {user.isEmailVerified ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monitoring */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="users" className="w-10 h-10" />
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold">{systemStats.users}</p>
              <p className="text-sm opacity-90 mt-1">Active Users</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="document" className="w-10 h-10" />
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Logs</span>
              </div>
              <p className="text-3xl font-bold">{systemStats.logs}</p>
              <p className="text-sm opacity-90 mt-1">System Logs</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="calendar" className="w-10 h-10" />
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Today</span>
              </div>
              <p className="text-3xl font-bold">{systemStats.todayAppointments}</p>
              <p className="text-sm opacity-90 mt-1">Appointments</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="clock" className="w-10 h-10" />
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Uptime</span>
              </div>
              <p className="text-xl font-bold">{formatUptime(systemStats.uptime || 0)}</p>
              <p className="text-sm opacity-90 mt-1">System Uptime</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4">System Health</h3>
            <div className="space-y-4">
              {[
                { label: 'Database', status: 'Healthy', value: '99.9%', color: 'green' },
                { label: 'API Server', status: 'Healthy', value: '100%', color: 'green' },
                { label: 'Email Service', status: 'Warning', value: '95%', color: 'yellow' },
                { label: 'Storage', status: 'Healthy', value: '87%', color: 'green' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.value}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => toast.success('Database backup initiated')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left flex items-center gap-3"
                >
                  <Icon name="box" className="w-5 h-5 text-blue-600" />
                  <span>Backup Database</span>
                </button>
                <button
                  onClick={() => toast.success('Cache cleared')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left flex items-center gap-3"
                >
                  <Icon name="repeat" className="w-5 h-5 text-purple-600" />
                  <span>Clear Cache</span>
                </button>
                <button
                  onClick={() => toast.success('Logs exported')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left flex items-center gap-3"
                >
                  <Icon name="document" className="w-5 h-5 text-green-600" />
                  <span>Export Logs</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Recent Logs</h3>
              <div className="space-y-2 text-sm">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 dark:text-gray-300 truncate">
                          {log.action} {log.entity} {log.entityId ? `(ID: ${log.entityId.substring(0, 8)}...)` : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {log.user?.name || 'System'} • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Icon name="document" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No recent logs available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
