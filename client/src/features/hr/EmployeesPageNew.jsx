import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import toast from 'react-hot-toast'

export default function EmployeesPage() {
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ user: '', department: '', title: '', joinDate: '' })
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ user: '', department: '', title: '', joinDate: '', salary: '' })

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

  const startEdit = (emp) => {
    setEditingId(emp._id)
    setEditTitle(emp.title || '')
  }

  const openEditModal = (emp) => {
    setEditModal(emp)
    setEditForm({
      user: emp.user?._id || '',
      department: emp.department?._id || '',
      title: emp.title || '',
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '',
      salary: emp.salary || ''
    })
  }

  const closeEditModal = () => {
    setEditModal(null)
    setEditForm({ user: '', department: '', title: '', joinDate: '', salary: '' })
  }

  const saveFullEdit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/hr/employees/${editModal._id}`, editForm)
      toast.success('Employee updated successfully')
      closeEditModal()
      fetchAll()
    } catch { toast.error('Update failed') }
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/hr/employees/${id}`, { title: editTitle })
      toast.success('Updated')
      setEditingId(null)
      fetchAll()
    } catch { toast.error('Update failed') }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const onEditFormChange = (e) => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Title', 'Join Date']
    const rows = filtered.map(e => [
      e.user?.name || '',
      e.user?.email || '',
      e.department?.name || '',
      e.title || '',
      e.joinDate ? new Date(e.joinDate).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = list.filter(e => {
    const matchName = !search || (e.user?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || e.department?._id === filterDept
    return matchName && matchDept
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Employees</h2>
        <p className="text-gray-600 dark:text-gray-400">Directory of staff members</p>
      </div>

      <form onSubmit={submit} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="col-span-5 flex gap-2 items-center mb-2">
          <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex-1" />
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <option value="">All Departments</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <button type="button" onClick={exportCSV} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Export CSV</button>
        </div>
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
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">Add Employee</button>
      </form>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">Showing {filtered.length} of {list.length} employees</div>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No employees found.</p>
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
                  {filtered.map(e => (
                    <tr key={e._id}>
                      <td className="py-2 pr-4">{e.user?.name}</td>
                      <td className="py-2 pr-4">{e.user?.email}</td>
                      <td className="py-2 pr-4">{e.department?.name || '-'}</td>
                      <td className="py-2 pr-4">
                        {editingId === e._id ? (
                          <input value={editTitle} onChange={(ev) => setEditTitle(ev.target.value)} className="px-2 py-1 border rounded w-full" />
                        ) : (
                          e.title || '-'
                        )}
                      </td>
                      <td className="py-2 pr-4">{e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 pr-4 space-x-2">
                        {editingId === e._id ? (
                          <>
                            <button onClick={() => saveEdit(e._id)} className="text-emerald-600 hover:underline">Save</button>
                            <button onClick={cancelEdit} className="text-gray-600 hover:underline">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEditModal(e)} className="text-blue-600 hover:underline">Edit All</button>
                            <button onClick={() => startEdit(e)} className="text-purple-600 hover:underline text-xs">Quick</button>
                            <button onClick={() => remove(e._id)} className="text-red-600 hover:underline">Delete</button>
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

      {/* Full Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeEditModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Edit Employee</h3>
            <form onSubmit={saveFullEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <select name="user" value={editForm.user} onChange={onEditFormChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <option value="">Select User</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select name="department" value={editForm.department} onChange={onEditFormChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <option value="">No department</option>
                  {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input name="title" value={editForm.title} onChange={onEditFormChange} placeholder="Title" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Join Date</label>
                <input type="date" name="joinDate" value={editForm.joinDate} onChange={onEditFormChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salary (৳)</label>
                <input type="number" name="salary" value={editForm.salary} onChange={onEditFormChange} placeholder="Salary" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">Save Changes</button>
                <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
