import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '../../components/Icon.jsx'

export default function DepartmentsPage() {
  const [list, setList] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
  const { data } = await api.get('/departments')
  const items = data?.data || []
  setList(items)
  setFiltered(items)
    } catch (e) {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    setFiltered(list.filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.description?.toLowerCase().includes(term)
    ))
  }, [search, list])

  const create = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/departments/${editing._id}`, form)
        toast.success('Department updated')
        setEditing(null)
      } else {
        await api.post('/departments', form)
        toast.success('Department created')
      }
      setForm({ name: '', description: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const edit = (dept) => {
    setEditing(dept)
    setForm({ name: dept.name, description: dept.description })
  }

  const remove = async (id) => {
    if (!confirm('Delete this department?')) return
    try {
      await api.delete(`/departments/${id}`)
      toast.success('Deleted')
      fetchData()
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Departments</h2>
        <p className="text-gray-600 dark:text-gray-400">HR and administrative units</p>
      </div>

      <form onSubmit={create} className="grid md:grid-cols-3 gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={()=>{setEditing(null);setForm({name:'',description:''})}} className="px-4 py-2 rounded-lg bg-gray-500 text-white">Cancel</button>}
        </div>
      </form>

      <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <Icon name="search" className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by department name or description..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No departments.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((d) => (
                <li key={d._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>edit(d)} className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800">Edit</button>
                    <button onClick={()=>remove(d._id)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
