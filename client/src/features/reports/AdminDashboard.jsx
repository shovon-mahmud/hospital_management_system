import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api.js'
import Icon from '../../components/Icon.jsx'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ patients: 0, appointments: 0, doctors: 0, revenue: 0, todayAppointments: 0, pendingBills: 0 })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const navigate = useNavigate()

  useEffect(() => { 
    (async () => {
      try {
        const [patients, appts, doctors, bills, logs] = await Promise.all([
          api.get('/patients?limit=1000'),
          api.get('/appointments?limit=1000'),
          api.get('/doctors?limit=100'),
          api.get('/bills?limit=1000'),
          api.get('/logs?limit=10').catch(() => ({ data: { data: [] } }))
        ])
        
        const today = new Date().toDateString()
        const todayAppts = (appts.data?.data || []).filter(a => 
          new Date(a.appointmentDate).toDateString() === today
        )
        const pendingBills = (bills.data?.data || []).filter(b => b.status !== 'paid')
        
        setStats({ 
          patients: patients.data?.data?.length || 0, 
          appointments: appts.data?.data?.length || 0,
          doctors: doctors.data?.data?.length || 0,
          revenue: bills.data?.data?.reduce((acc, b) => acc + (b.total || 0), 0) || 0,
          todayAppointments: todayAppts.length,
          pendingBills: pendingBills.length
        })
        
        // Format recent activity from logs
        const activity = (logs.data?.data || []).map(log => ({
          text: `${log.action} ${log.entity}`,
          time: new Date(log.createdAt).toLocaleTimeString(),
          user: log.user?.name || 'System'
        }))
        setRecentActivity(activity)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })() 
  }, [])

  const cards = [
    { title: 'Total Patients', value: stats.patients, icon: <Icon name="users" className="text-2xl" />, gradient: 'from-blue-500 to-cyan-500', change: '+12%', to: '/patients' },
    { title: 'Total Appointments', value: stats.appointments, icon: <Icon name="calendar" className="text-2xl" />, gradient: 'from-purple-500 to-pink-500', change: '+8%', to: '/appointments', subtitle: `${stats.todayAppointments} today` },
    { title: 'Active Doctors', value: stats.doctors, icon: <Icon name="user" className="text-2xl" />, gradient: 'from-green-500 to-emerald-500', change: '+3%', to: '/doctors' },
    { title: 'Total Revenue', value: `৳${stats.revenue.toLocaleString()}`, icon: <Icon name="money" className="text-2xl" />, gradient: 'from-orange-500 to-red-500', change: '+15%', to: '/billing', subtitle: `${stats.pendingBills} pending` }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor hospital operations and analytics</p>
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => toast.success('Report generation coming soon')}
        >
          Generate Report
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => navigate(card.to)}
              className="text-left group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full pointer-events-none`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl`}>
                    {card.icon}
                  </div>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20">
                    {card.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  {card.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{activity.text}</span>
                  <span className="text-xs text-gray-500 ml-2">by {activity.user}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            )) : (
              ['New patient registered', 'Appointment confirmed', 'Bill generated', 'Doctor added'].map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{activity}</span>
                  <span className="text-xs text-gray-500 ml-auto">Just now</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Patient', icon: <Icon name="users" className="text-2xl" />, to: '/patients' },
              { label: 'Schedule', icon: <Icon name="calendar" className="text-2xl" />, to: '/appointments' },
              { label: 'Reports', icon: <Icon name="box" className="text-2xl" />, onClick: () => toast('Reports dashboard coming soon') },
              { label: 'Settings', icon: <Icon name="settings" className="text-2xl" />, to: '/admin/settings' }
            ].map((action, idx) => (
              <button
                key={idx}
                className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => (action.onClick ? action.onClick() : navigate(action.to))}
              >
                <div className="text-2xl">{action.icon}</div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
