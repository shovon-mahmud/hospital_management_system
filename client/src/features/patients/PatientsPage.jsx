import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Icon from '../../components/Icon.jsx'

export default function PatientsPage() {
  const auth = useSelector(s => s.auth) // reserved for role-based UI toggles
  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', email:'', phone: '', address: '', emergencyContact: '' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [roles, setRoles] = useState([])
  const itemsPerPage = 10

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/patients?limit=200')
      setList(data?.data || [])
      setFilteredList(data?.data || [])
      // Try to load roles (Admin-only)
      try {
        const resRoles = await api.get('/roles')
        setRoles(resRoles.data?.data || resRoles.data || [])
      } catch (err) {
        console.error('Failed to load roles', err)
      }
    } catch (e) {
      console.error('Failed to load patients', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    const filtered = list.filter(p => 
      p.patientId?.toLowerCase().includes(term) ||
      p.user?.name?.toLowerCase().includes(term) ||
      p.user?.email?.toLowerCase().includes(term) ||
      p.contact?.phone?.toLowerCase().includes(term) ||
      p.contact?.address?.toLowerCase().includes(term) ||
      (p.medical?.allergies || []).some(a => a.toLowerCase().includes(term)) ||
      (p.medical?.history || []).some(h => h.toLowerCase().includes(term))
    )
    setFilteredList(filtered)
    setCurrentPage(1)
  }, [search, list])

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const create = async (e) => {
    e.preventDefault()
    if (editing) {
      try {
        // Build update payload with extended fields if present on form
        const payload = {
          contact: { phone: form.phone, address: form.address, emergencyContact: form.emergencyContact },
        }
        if (form.gender) payload.gender = form.gender
        if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
        if (form.bloodGroup) payload.bloodGroup = form.bloodGroup
        if (form.heightCm) payload.heightCm = Number(form.heightCm)
        if (form.weightKg) payload.weightKg = Number(form.weightKg)
        if (form.insuranceProvider || form.insuranceNumber) payload.insurance = { provider: form.insuranceProvider || '', number: form.insuranceNumber || '' }
        if (form.notes) payload.notes = form.notes
        // Update user profile (name/email) if changed
        if ((form.name && form.name !== editing.user?.name) || (form.email && form.email !== editing.user?.email)) {
          await api.put(`/users/${editing.user?._id}/profile`, { name: form.name || editing.user?.name, email: form.email || editing.user?.email })
        }
        await api.put(`/patients/${editing._id}`, payload)
        toast.success('Patient updated')
        setEditing(null)
        setForm({ name:'', email:'', phone: '', address: '', emergencyContact: '', gender:'', dateOfBirth:'', bloodGroup:'', heightCm:'', weightKg:'', insuranceProvider:'', insuranceNumber:'', notes:'' })
        fetchData()
      } catch (e) {
        toast.error(e.response?.data?.message || 'Update failed')
      }
    } else {
      try {
        const payload = {
          contact: { phone: form.phone, address: form.address, emergencyContact: form.emergencyContact },
        }
        if (form.gender) payload.gender = form.gender
        if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
        if (form.bloodGroup) payload.bloodGroup = form.bloodGroup
        if (form.heightCm) payload.heightCm = Number(form.heightCm)
        if (form.weightKg) payload.weightKg = Number(form.weightKg)
        if (form.insuranceProvider || form.insuranceNumber) payload.insurance = { provider: form.insuranceProvider || '', number: form.insuranceNumber || '' }
        if (form.notes) payload.notes = form.notes
        await api.post('/patients', payload)
        toast.success('Patient added')
        setForm({ name:'', email:'', phone: '', address: '', emergencyContact: '', gender:'', dateOfBirth:'', bloodGroup:'', heightCm:'', weightKg:'', insuranceProvider:'', insuranceNumber:'', notes:'' })
        fetchData()
      } catch (e) {
        toast.error(e.response?.data?.message || 'Create failed')
      }
    }
  }

  const edit = (p) => {
    setEditing(p)
    setForm({ 
      name: p.user?.name || '',
      email: p.user?.email || '',
      phone: p.contact?.phone || '', 
      address: p.contact?.address || '', 
      emergencyContact: p.contact?.emergencyContact || '',
      gender: p.gender || '',
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0,10) : '',
      bloodGroup: p.bloodGroup || '',
      heightCm: p.heightCm || '',
      weightKg: p.weightKg || '',
      insuranceProvider: p.insurance?.provider || '',
      insuranceNumber: p.insurance?.number || '',
      notes: p.notes || ''
    })
  }

  const remove = async (id) => {
    if (!confirm('Delete this patient?')) return
    try {
      await api.delete(`/patients/${id}`)
      toast.success('Deleted')
      fetchData()
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  const updateUserRole = async (userId, roleId) => {
    try {
      await api.put(`/users/${userId}/role`, { roleId })
      toast.success('Role updated')
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Role update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Patients</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage patient records</p>
      </div>
      <form onSubmit={create} className="grid md:grid-cols-4 gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} disabled={!editing} />
        <input type="email" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} disabled={!editing} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Address" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Emergency Contact" value={form.emergencyContact} onChange={e=>setForm(f=>({...f,emergencyContact:e.target.value}))} />
        <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.gender||''} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
          <option value="">Gender</option>
          {['Male','Female','Other'].map(g=> <option key={g} value={g}>{g}</option>)}
        </select>
        <input type="date" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="DOB" value={form.dateOfBirth||''} onChange={e=>setForm(f=>({...f,dateOfBirth:e.target.value}))} />
        <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.bloodGroup||''} onChange={e=>setForm(f=>({...f,bloodGroup:e.target.value}))}>
          <option value="">Blood Group</option>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg=> <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Height (cm)" value={form.heightCm||''} onChange={e=>setForm(f=>({...f,heightCm:e.target.value}))} />
        <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Weight (kg)" value={form.weightKg||''} onChange={e=>setForm(f=>({...f,weightKg:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Insurance Provider" value={form.insuranceProvider||''} onChange={e=>setForm(f=>({...f,insuranceProvider:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Insurance Number" value={form.insuranceNumber||''} onChange={e=>setForm(f=>({...f,insuranceNumber:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 md:col-span-2" placeholder="Notes" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={()=>{setEditing(null);setForm({ name:'', email:'', phone: '', address: '', emergencyContact: '' })}} className="px-4 py-2 rounded-lg bg-gray-500 text-white">Cancel</button>}
        </div>
        {!editing && (
          <p className="md:col-span-4 text-xs text-gray-500">To create a new patient with name and email, please use Reception Dashboard &rarr; New Patient.</p>
        )}
      </form>

      <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <Icon name="search" className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by patient ID, phone, or address..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">{filteredList.length} results</span>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {filteredList.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No patients found.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedList.map((p) => (
                <li key={p._id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.user?.name || p.patientId} <span className="font-normal text-gray-500">({p.patientId})</span></p>
                      <p className="text-xs text-gray-500 truncate">{p.user?.email || '—'} • {p.contact?.phone || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{p.contact?.address || '—'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.medical?.allergies || []).slice(0,3).map((a, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">Allergy: {a}</span>
                        ))}
                        {(p.medical?.history || []).slice(0,3).map((h, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">Hx: {h}</span>
                        ))}
                        {(p.medical?.prescriptions || []).slice(0,2).map((rx, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">Rx: {rx}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button onClick={()=>setExpandedId(expandedId===p._id?null:p._id)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{expandedId===p._id?'Hide':'Details'}</button>
                      <button onClick={()=>edit(p)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Edit</button>
                      <button onClick={()=>remove(p._id)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white">Delete</button>
                    </div>
                  </div>
                  {expandedId===p._id && (
                    <div className="mt-3 grid md:grid-cols-3 gap-3 text-xs text-gray-700 dark:text-gray-300">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Contact</p>
                        <p>Phone: {p.contact?.phone || '—'}</p>
                        <p>Address: {p.contact?.address || '—'}</p>
                        <p>Emergency: {p.contact?.emergencyContact || '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Personal</p>
                        <p>Gender: {p.gender || '—'}</p>
                        <p>DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'}</p>
                        <p>Blood Group: {p.bloodGroup || '—'}</p>
                        <p>Height: {p.heightCm ? `${p.heightCm} cm` : '—'}</p>
                        <p>Weight: {p.weightKg ? `${p.weightKg} kg` : '—'}</p>
                        <p className="font-semibold mb-1 mt-2">Insurance</p>
                        <p>Provider: {p.insurance?.provider || '—'}</p>
                        <p>Number: {p.insurance?.number || '—'}</p>
                        {(auth?.user?.role?.name === 'Admin' || auth?.user?.role?.name === 'HR') && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-500 mr-2">Role:</label>
                            <select
                              className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                              value={p.user?.role?._id || p.user?.role || ''}
                              onChange={e => updateUserRole(p.user?._id, e.target.value)}
                            >
                              <option value="">Select role</option>
                              {roles.map(r => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Medical History</p>
                        <ul className="list-disc ml-4 space-y-1">
                          {(p.medical?.history?.length? p.medical.history : ['—']).map((h, i)=> <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 md:col-span-3">
                        <p className="font-semibold mb-1">Allergies & Prescriptions</p>
                        <div className="grid md:grid-cols-2 gap-2">
                          <p>Allergies: {(p.medical?.allergies || []).join(', ') || '—'}</p>
                          <p>Prescriptions: {(p.medical?.prescriptions || []).join(', ') || '—'}</p>
                        </div>
                        {p.notes && <p className="mt-2 text-gray-600 dark:text-gray-400">Notes: {p.notes}</p>}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
