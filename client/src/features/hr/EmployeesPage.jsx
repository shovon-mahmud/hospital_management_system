import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'

export default function EmployeesPage() {
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ user: '', department: '', title: '', joinDate: '' })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [empRes, usersRes, deptRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/users'),
        api.get('/departments')
      ])
      setList(empRes.data?.data || [])
      setUsers(usersRes.data?.data || [])
      setDepts(deptRes.data?.data || [])
    } catch (e) {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/employees', form)
      toast.success('Employee created')
      setForm({ user: '', department: '', title: '', joinDate: '' })
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Create failed')
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const remove = async (id) => {
    if (!confirm('Delete this employee?')) return
    try { await api.delete(`/hr/employees/${id}`); fetchAll(); toast.success('Deleted') } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Employees</h2>
        <p className="text-gray-600 dark:text-gray-400">Directory of staff members</p>
      </div>

      <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select name="user" value={form.user} onChange={onChange} required className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="">Select user</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
        </select>
        <select name="department" value={form.department} onChange={onChange} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="">No department</option>
          {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <input name="title" value={form.title} onChange={onChange} placeholder="Title" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <input type="date" name="joinDate" value={form.joinDate} onChange={onChange} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Add Employee</button>
      </form>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          {list.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No employees.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Join Date</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map(e => (
                    <tr key={e._id}>
                      <td className="py-2 pr-4">{e.user?.name}</td>
                      <td className="py-2 pr-4">{e.user?.email}</td>
                      <td className="py-2 pr-4">{e.department?.name || '-'}</td>
                      <td className="py-2 pr-4">{e.title || '-'}</td>
                      <td className="py-2 pr-4">{e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => remove(e._id)} className="text-red-600 hover:underline">Delete</button>
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

// basic input and button styles
// Using Tailwind utility classes already available
