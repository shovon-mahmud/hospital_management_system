import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

export default function PayrollPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ user: '', month: new Date().toISOString().slice(0, 7), baseSalary: '', allowances: 0, deductions: 0 })
  const [users, setUsers] = useState([])
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState([])
  const { user } = useSelector((s) => s.auth)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (monthFilter) params.month = monthFilter
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/hr/payroll', { params })
      setList(data?.data || [])
    } catch (e) {
      toast.error('Failed to load payroll')
    } finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/hr/users')
      setUsers(data?.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchData(); fetchUsers() }, [])
  useEffect(() => { fetchData() }, [monthFilter, statusFilter])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/payroll', form)
      toast.success('Payroll created')
      setForm({ user: '', month: new Date().toISOString().slice(0, 7), baseSalary: '', allowances: 0, deductions: 0 })
      fetchData()
    } catch (e) { toast.error(e.response?.data?.message || 'Create failed') }
  }

  const markPaid = async (id) => {
    try { await api.put(`/hr/payroll/${id}/paid`); toast.success('Marked paid'); fetchData() } catch { toast.error('Action failed') }
  }

  const bulkMarkPaid = async () => {
    if (selected.length === 0) return toast.error('No items selected')
    try {
      await Promise.all(selected.map(id => api.put(`/hr/payroll/${id}/paid`)))
      toast.success(`${selected.length} record(s) marked paid`)
      setSelected([])
      fetchData()
    } catch { toast.error('Bulk action failed') }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const canManage = user?.role === 'Admin' || user?.role === 'HR'

  const exportCSV = () => {
    const headers = ['Employee', 'Month', 'Base Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status', 'Paid At']
    const rows = list.map(r => [
      r.user?.name || '',
      r.month || '',
      r.baseSalary || 0,
      r.allowances || 0,
      r.deductions || 0,
      r.netPay || 0,
      r.status,
      r.paidAt ? new Date(r.paidAt).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selected.length === list.filter(r => r.status === 'unpaid').length) setSelected([])
    else setSelected(list.filter(r => r.status === 'unpaid').map(r => r._id))
  }

  const summary = {
    total: list.length,
    unpaid: list.filter(r => r.status === 'unpaid').length,
    paid: list.filter(r => r.status === 'paid').length,
    totalAmount: list.reduce((sum, r) => sum + (r.netPay || 0), 0),
    unpaidAmount: list.filter(r => r.status === 'unpaid').reduce((sum, r) => sum + (r.netPay || 0), 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Payroll Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage employee payroll</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Total Records</div>
          <div className="text-3xl font-bold">{summary.total}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Unpaid</div>
          <div className="text-3xl font-bold">{summary.unpaid}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Paid</div>
          <div className="text-3xl font-bold">{summary.paid}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Total Amount</div>
          <div className="text-2xl font-bold">৳{summary.totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Unpaid Amount</div>
          <div className="text-2xl font-bold">৳{summary.unpaidAmount.toLocaleString()}</div>
        </div>
      </div>

      {canManage && (
        <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select name="user" value={form.user} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <option value="">Select User</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
          <input type="month" name="month" value={form.month} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <input type="number" name="baseSalary" value={form.baseSalary} onChange={onChange} placeholder="Base Salary" required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <input type="number" name="allowances" value={form.allowances} onChange={onChange} placeholder="Allowances" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <input type="number" name="deductions" value={form.deductions} onChange={onChange} placeholder="Deductions" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">Create</button>
        </form>
      )}

      <div className="flex gap-2 items-center">
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Filter by month" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        {canManage && selected.length > 0 && (
          <button onClick={bulkMarkPaid} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Mark {selected.length} as Paid</button>
        )}
        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 ml-auto">Export CSV</button>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No payroll records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    {canManage && <th className="py-2 pr-4"><input type="checkbox" checked={selected.length === list.filter(r => r.status === 'unpaid').length && list.filter(r => r.status === 'unpaid').length > 0} onChange={toggleAll} /></th>}
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Base Salary</th>
                    <th className="py-2 pr-4">Allowances</th>
                    <th className="py-2 pr-4">Deductions</th>
                    <th className="py-2 pr-4">Net Pay</th>
                    <th className="py-2 pr-4">Status</th>
                    {canManage && <th className="py-2 pr-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map(r => (
                    <tr key={r._id}>
                      {canManage && <td className="py-2 pr-4">{r.status === 'unpaid' && <input type="checkbox" checked={selected.includes(r._id)} onChange={() => toggleSelect(r._id)} />}</td>}
                      <td className="py-2 pr-4">{r.user?.name || '—'}</td>
                      <td className="py-2 pr-4">{r.month || '—'}</td>
                      <td className="py-2 pr-4">৳{(r.baseSalary || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4">৳{(r.allowances || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4">৳{(r.deductions || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 font-semibold">৳{(r.netPay || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded text-xs ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
                      </td>
                      {canManage && (
                        <td className="py-2 pr-4">
                          {r.status === 'unpaid' && <button onClick={() => markPaid(r._id)} className="text-emerald-600 hover:underline">Mark Paid</button>}
                        </td>
                      )}
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
