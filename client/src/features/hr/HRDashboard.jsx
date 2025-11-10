import { Link } from 'react-router-dom'
import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import Icon from '../../components/Icon.jsx'

export default function HRDashboard() {
  const [stats, setStats] = useState({ departments: 0, inventory: 0, doctors: 0 })

  useEffect(() => {
    (async () => {
      try {
        const [dept, inv, docs] = await Promise.all([
          api.get('/departments?limit=200'),
          api.get('/inventory'),
          api.get('/doctors?limit=200')
        ])
        setStats({
          departments: (dept.data?.data || []).length,
          inventory: (inv.data?.data || []).length,
          doctors: (docs.data?.data || []).length
        })
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  const cards = [
    { title: 'Departments', value: stats.departments, to: '/departments', gradient: 'from-indigo-500 to-blue-500', icon: <Icon name="department" className="text-3xl" /> },
    { title: 'Inventory', value: stats.inventory, to: '/inventory', gradient: 'from-emerald-500 to-green-500', icon: <Icon name="box" className="text-3xl" /> },
    { title: 'Doctors', value: stats.doctors, to: '/doctors', gradient: 'from-purple-500 to-pink-500', icon: <Icon name="user" className="text-3xl" /> }
  ]

  const hrCards = [
    { title: 'Employees', value: <Icon name="users" className="text-4xl" />, to: '/hr/employees', gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Leaves', value: <Icon name="calendar" className="text-4xl" />, to: '/hr/leaves', gradient: 'from-amber-500 to-orange-500' },
    { title: 'Payroll', value: <Icon name="money" className="text-4xl" />, to: '/hr/payroll', gradient: 'from-green-500 to-emerald-500' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">HR Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage people and departments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Link key={i} to={c.to} className={`p-5 rounded-2xl bg-gradient-to-r ${c.gradient} text-white shadow-lg hover:shadow-xl transition-shadow`}>
            <div className="text-3xl">{c.icon}</div>
            <div className="mt-3 text-sm uppercase tracking-wide opacity-80">{c.title}</div>
            <div className="text-2xl font-bold">{c.value}</div>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">HR Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hrCards.map((c, i) => (
            <Link key={i} to={c.to} className={`p-5 rounded-2xl bg-gradient-to-r ${c.gradient} text-white shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="text-4xl mb-2">{c.value}</div>
              <div className="text-lg font-semibold">{c.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
