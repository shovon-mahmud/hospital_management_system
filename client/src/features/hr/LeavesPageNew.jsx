import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import Icon from '../../components/Icon.jsx'

export default function LeavesPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' })
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useSelector((s) => s.auth)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const { data } = await api.get('/hr/leaves', { params })
      setList(data?.data || [])
    } catch (e) {
      toast.error('Failed to load leave requests')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/leaves', form)
      toast.success('Leave request submitted')
      setForm({ startDate: '', endDate: '', reason: '' })
      fetchData()
    } catch (e) { toast.error(e.response?.data?.message || 'Submit failed') }
  }

  const decide = async (id, status) => {
    try { await api.put(`/hr/leaves/${id}/decision`, { status }); toast.success(`Marked ${status}`); fetchData() } catch { toast.error('Action failed') }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const canApprove = user?.role === 'Admin' || user?.role === 'HR'

  const calculateDays = (start, end) => {
    if (!start || !end) return 0
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1
    return days > 0 ? days : 0
  }

  const requestedDays = calculateDays(form.startDate, form.endDate)

  const exportCSV = () => {
    const headers = ['User', 'Start Date', 'End Date', 'Reason', 'Status', 'Approver', 'Decided At']
    const rows = list.map(r => [
      r.user?.name || '',
      new Date(r.startDate).toLocaleDateString(),
      new Date(r.endDate).toLocaleDateString(),
      r.reason || '',
      r.status,
      r.approver?.name || '',
      r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summary = {
    total: list.length,
    pending: list.filter(r => r.status === 'pending').length,
    approved: list.filter(r => r.status === 'approved').length,
    rejected: list.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Leave Requests</h2>
        <p className="text-gray-600 dark:text-gray-400">Request and manage leaves</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Total</div>
          <div className="text-3xl font-bold">{summary.total}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Pending</div>
          <div className="text-3xl font-bold">{summary.pending}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Approved</div>
          <div className="text-3xl font-bold">{summary.approved}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4">
          <div className="text-sm opacity-90">Rejected</div>
          <div className="text-3xl font-bold">{summary.rejected}</div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={onChange} required min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={onChange} required min={form.startDate || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input name="reason" value={form.reason} onChange={onChange} placeholder="Reason for leave" required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div className="flex flex-col justify-end">
            <button disabled={requestedDays === 0} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Submit Request
              {requestedDays > 0 && ` (${requestedDays} day${requestedDays > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
        {requestedDays > 15 && (
          <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Icon name="warning" className="w-4 h-4" /> You are requesting {requestedDays} days. Requests over 15 days may require additional approval.
            </p>
          </div>
        )}
      </form>

      <div className="flex gap-2 items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 ml-auto">Export CSV</button>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2 pr-4">Days</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Approver</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map(r => {
                    const days = Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1
                    return (
                      <tr key={r._id}>
                        <td className="py-2 pr-4">{r.user?.name}</td>
                        <td className="py-2 pr-4">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{days} day{days > 1 ? 's' : ''}</td>
                        <td className="py-2 pr-4">{r.reason || '-'}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>{r.status}</span>
                        </td>
                        <td className="py-2 pr-4">{r.approver?.name || '-'}</td>
                        <td className="py-2 pr-4 space-x-2">
                          {canApprove && r.status === 'pending' && (
                            <>
                              <button onClick={() => decide(r._id, 'approved')} className="text-emerald-600 hover:underline">Approve</button>
                              <button onClick={() => decide(r._id, 'rejected')} className="text-red-600 hover:underline">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
