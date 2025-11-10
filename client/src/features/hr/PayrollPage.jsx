import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

export default function PayrollPage() {
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ user: '', month: '', baseSalary: 0, allowances: 0, deductions: 0 })
  const { user } = useSelector((s) => s.auth)
  const isHR = user?.role === 'Admin' || user?.role === 'HR'

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [payRes, usersRes] = await Promise.all([
        api.get('/hr/payroll'),
        isHR ? api.get('/hr/users') : Promise.resolve({ data: { data: [] } })
      ])
      setList(payRes.data?.data || [])
      setUsers(usersRes.data?.data || [])
    } catch (e) {
      toast.error('Failed to load payroll')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/payroll', form)
      toast.success('Payroll created')
      setForm({ user: '', month: '', baseSalary: 0, allowances: 0, deductions: 0 })
      fetchAll()
    } catch (e) { toast.error(e.response?.data?.message || 'Create failed') }
  }

  const markPaid = async (id) => {
    try { await api.put(`/hr/payroll/${id}/paid`); toast.success('Marked paid'); fetchAll() } catch { toast.error('Action failed') }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const fmt = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Payroll</h2>
        <p className="text-gray-600 dark:text-gray-400">Monthly salary statements</p>
      </div>

      {isHR && (
        <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-6 gap-4">
          <select name="user" value={form.user} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <option value="">Select user</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
          <input name="month" value={form.month} onChange={onChange} placeholder="2025-01" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" required />
          <input type="number" step="0.01" name="baseSalary" value={form.baseSalary} onChange={onChange} placeholder="Base" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <input type="number" step="0.01" name="allowances" value={form.allowances} onChange={onChange} placeholder="Allowances" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <input type="number" step="0.01" name="deductions" value={form.deductions} onChange={onChange} placeholder="Deductions" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Create</button>
        </form>
      )}

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No payroll records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Base</th>
                    <th className="py-2 pr-4">Allowances</th>
                    <th className="py-2 pr-4">Deductions</th>
                    <th className="py-2 pr-4">Net</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map(p => (
                    <tr key={p._id}>
                      <td className="py-2 pr-4">{p.user?.name}</td>
                      <td className="py-2 pr-4">{p.month}</td>
                      <td className="py-2 pr-4">{fmt.format(p.baseSalary || 0)}</td>
                      <td className="py-2 pr-4">{fmt.format(p.allowances || 0)}</td>
                      <td className="py-2 pr-4">{fmt.format(p.deductions || 0)}</td>
                      <td className="py-2 pr-4 font-semibold">{fmt.format(p.netPay || 0)}</td>
                      <td className="py-2 pr-4">{p.status}</td>
                      <td className="py-2 pr-4">
                        {isHR && p.status !== 'paid' && (
                          <button onClick={() => markPaid(p._id)} className="text-emerald-600 hover:underline">Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
