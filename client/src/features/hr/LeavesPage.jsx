import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

export default function LeavesPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' })
  const { user } = useSelector((s) => s.auth)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/hr/leaves')
      setList(data?.data || [])
    } catch (e) {
      toast.error('Failed to load leave requests')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Leave Requests</h2>
        <p className="text-gray-600 dark:text-gray-400">Request and manage leaves</p>
      </div>

      <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="date" name="startDate" value={form.startDate} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <input type="date" name="endDate" value={form.endDate} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <input name="reason" value={form.reason} onChange={onChange} placeholder="Reason" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Submit Request</button>
      </form>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No leave requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map(r => (
                    <tr key={r._id}>
                      <td className="py-2 pr-4">{r.user?.name}</td>
                      <td className="py-2 pr-4">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{r.reason || '-'}</td>
                      <td className="py-2 pr-4">{r.status}</td>
                      <td className="py-2 pr-4 space-x-2">
                        {canApprove && r.status === 'pending' && (
                          <>
                            <button onClick={() => decide(r._id, 'approved')} className="text-emerald-600 hover:underline">Approve</button>
                            <button onClick={() => decide(r._id, 'rejected')} className="text-red-600 hover:underline">Reject</button>
                          </>
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
