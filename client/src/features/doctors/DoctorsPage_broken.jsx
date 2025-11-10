import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import Icon from '../../components/Icon.jsx'
import { Link } from 'react-router-dom'
import { fetchDoctors, fetchDepartments, fetchRoles, fetchDoctorAvailability } from '../data/dataSlice.js'

export default function DoctorsPage() {
  const dispatch = useDispatch()
  const auth = useSelector(s => s.auth)
  const { doctors, departments, roles, availability } = useSelector(s => s.data)
  const [filteredList, setFilteredList] = useState([])
  const [form, setForm] = useState({ name:'', email:'', specialization: '', experienceYears: 0, department: '', consultationFee: '', qualifications: '', languages: '', bio: '', buildingName:'', buildingNo:'', floorNo:'', roomNo:'' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const itemsPerPage = 10

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    // Fetch data from Redux (will use cache if available)
    dispatch(fetchDoctors())
    dispatch(fetchDepartments())
    dispatch(fetchRoles())
  }, [dispatch])

  // Fetch availability when doctors are loaded
  useEffect(() => {
    if (doctors.data.length > 0) {
      const doctorIds = doctors.data.map(d => d._id)
      dispatch(fetchDoctorAvailability(doctorIds))
    }
  }, [doctors.data.length, dispatch])

  // Update filtered list when doctors or search changes
  useEffect(() => {
  // Update filtered list when doctors or search changes
  useEffect(() => {
    const term = search.toLowerCase()
    const filtered = doctors.data.filter(d => 
      d.user?.name?.toLowerCase().includes(term) ||
      d.user?.email?.toLowerCase().includes(term) ||
      d.specialization?.toLowerCase().includes(term) ||
      (d.availability||[]).some(av => av.day?.toLowerCase().includes(term))
    )
    setFilteredList(filtered)
    setCurrentPage(1)
  }, [search, doctors.data])

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const create = async (e) => {
    e.preventDefault()
    if (editing) {
      try {
        const payload = {
          specialization: form.specialization,
          experienceYears: Number(form.experienceYears)||0,
        }
        if (form.department) payload.department = form.department
        if (form.consultationFee) payload.consultationFee = Number(form.consultationFee)
        if (form.qualifications) payload.qualifications = form.qualifications.split(',').map(s=>s.trim()).filter(Boolean)
        if (form.languages) payload.languages = form.languages.split(',').map(s=>s.trim()).filter(Boolean)
        if (form.bio) payload.bio = form.bio
        if (form.buildingName) payload.buildingName = form.buildingName
        if (form.buildingNo) payload.buildingNo = form.buildingNo
        if (form.floorNo) payload.floorNo = form.floorNo
        if (form.roomNo) payload.roomNo = form.roomNo
        // Update user profile name/email if changed
        if ((form.name && form.name !== editing.user?.name) || (form.email && form.email !== editing.user?.email)) {
          await api.put(`/users/${editing.user?._id}/profile`, { name: form.name || editing.user?.name, email: form.email || editing.user?.email })
        }
        await api.put(`/doctors/${editing._id}`, payload)
        toast.success('Doctor updated')
        setEditing(null)
        setForm({ name:'', email:'', specialization: '', experienceYears: 0, department: '', consultationFee: '', qualifications: '', languages: '', bio: '', buildingName:'', buildingNo:'', floorNo:'', roomNo:'' })
        dispatch(fetchDoctors())
      } catch (e) {
        toast.error(e.response?.data?.message || 'Update failed')
      }
    } else {
      try {
        const payload = {
          specialization: form.specialization,
          experienceYears: Number(form.experienceYears)||0,
        }
        if (form.department) payload.department = form.department
        if (form.consultationFee) payload.consultationFee = Number(form.consultationFee)
        if (form.qualifications) payload.qualifications = form.qualifications.split(',').map(s=>s.trim()).filter(Boolean)
        if (form.languages) payload.languages = form.languages.split(',').map(s=>s.trim()).filter(Boolean)
        if (form.bio) payload.bio = form.bio
        if (form.buildingName) payload.buildingName = form.buildingName
        if (form.buildingNo) payload.buildingNo = form.buildingNo
        if (form.floorNo) payload.floorNo = form.floorNo
        if (form.roomNo) payload.roomNo = form.roomNo
        await api.post('/doctors', payload)
        toast.success('Doctor added')
        setForm({ name:'', email:'', specialization: '', experienceYears: 0, department: '', consultationFee: '', qualifications: '', languages: '', bio: '', buildingName:'', buildingNo:'', floorNo:'', roomNo:'' })
        dispatch(fetchDoctors())
      } catch (e) {
        toast.error(e.response?.data?.message || 'Create failed')
      }
    }
  }

  const edit = (d) => {
    setEditing(d)
    setForm({
      name: d.user?.name || '',
      email: d.user?.email || '',
      specialization: d.specialization || '',
      experienceYears: d.experienceYears || 0,
      department: d.department?._id || '',
      consultationFee: d.consultationFee ?? '',
      qualifications: (d.qualifications || []).join(', '),
      languages: (d.languages || []).join(', '),
      bio: d.bio || '',
      buildingName: d.buildingName || '',
      buildingNo: d.buildingNo || '',
      floorNo: d.floorNo || '',
      roomNo: d.roomNo || ''
    })
  }

  const remove = async (id) => {
    if (!confirm('Delete this doctor?')) return
    try {
      await api.delete(`/doctors/${id}`)
      toast.success('Deleted')
      dispatch(fetchDoctors())
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  const updateUserRole = async (userId, roleId) => {
    try {
      await api.put(`/users/${userId}/role`, { roleId })
      toast.success('Role updated')
      dispatch(fetchDoctors())
    } catch (e) {
      toast.error(e.response?.data?.message || 'Role update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Doctors</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage doctors and availability</p>
      </div>
      <form onSubmit={create} className="grid md:grid-cols-3 gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} disabled={!editing} />
        <input type="email" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} disabled={!editing} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Specialization" value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} />
        <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Experience (years)" value={form.experienceYears} onChange={e=>setForm(f=>({...f,experienceYears:e.target.value}))} />
        {(auth?.user?.role?.name === 'Admin' || auth?.user?.role?.name === 'HR') && (
          <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
            <option value="">Select Department</option>
            {departments.data.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        )}
        <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Consultation Fee" value={form.consultationFee} onChange={e=>setForm(f=>({...f,consultationFee:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Building Name" value={form.buildingName} onChange={e=>setForm(f=>({...f,buildingName:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Building No" value={form.buildingNo} onChange={e=>setForm(f=>({...f,buildingNo:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Floor No" value={form.floorNo} onChange={e=>setForm(f=>({...f,floorNo:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Room No" value={form.roomNo} onChange={e=>setForm(f=>({...f,roomNo:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Qualifications (comma-separated)" value={form.qualifications} onChange={e=>setForm(f=>({...f,qualifications:e.target.value}))} />
        <input className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Languages (comma-separated)" value={form.languages} onChange={e=>setForm(f=>({...f,languages:e.target.value}))} />
        <textarea className="md:col-span-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Short bio" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={()=>{setEditing(null);setForm({ name:'', email:'', specialization: '', experienceYears: 0, department: '', consultationFee: '', qualifications: '', languages: '', bio: '', buildingName:'', buildingNo:'', floorNo:'', roomNo:'' })}} className="px-4 py-2 rounded-lg bg-gray-500 text-white">Cancel</button>}
        </div>
        {!editing && (
          <p className="md:col-span-3 text-xs text-gray-500">To set doctor name/email, update the user profile from existing records or contact Admin.</p>
        )}
      </form>

      <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <Icon name="search" className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name, email, specialization, or day..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span className="text-sm text-gray-500">{filteredList.length} results</span>
      </div>

      {doctors.loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {filteredList.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No doctors found.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedList.map((d) => (
                <li key={d._id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{d.user?.name || 'Doctor'}</p>
                      <p className="text-xs text-gray-500 truncate">{d.user?.email || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{d.specialization || ''} • {d.experienceYears || 0} yrs</p>
                      {(() => {
                        const doctorAvailability = availability.data[d._id] || []
                        if (doctorAvailability.length === 0) return null
                        return (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doctorAvailability.slice(0, 4).map((a, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                                {a.dayOfWeek}: {a.workingHours?.start}-{a.workingHours?.end}
                              </span>
                            ))}
                            {doctorAvailability.length > 4 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                +{doctorAvailability.length - 4} more
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Link to={`/availability/${d._id}`} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center hover:shadow-lg transition-all">Schedule</Link>
                      <button onClick={()=>setExpandedId(expandedId===d._id?null:d._id)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{expandedId===d._id?'Hide':'Details'}</button>
                      <button onClick={()=>edit(d)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Edit</button>
                      <button onClick={()=>remove(d._id)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white">Delete</button>
                    </div>
                  </div>
                  {expandedId===d._id && (
                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Profile</p>
                        <p>Name: {d.user?.name || '—'}</p>
                        <p>Email: {d.user?.email || '—'}</p>
                        <p>Specialization: {d.specialization || '—'}</p>
                        <p>Experience: {d.experienceYears || 0} years</p>
                        <p>Department: {d.department?.name || '—'}</p>
                        <p>Consultation Fee: {d.consultationFee ? `৳${d.consultationFee}` : '—'}</p>
                        {(d.buildingName || d.buildingNo || d.floorNo || d.roomNo) && (
                          <p>Room: {[
                            d.buildingName || null,
                            d.buildingNo ? `Bldg ${d.buildingNo}` : null,
                            d.floorNo ? `Floor ${d.floorNo}` : null,
                            d.roomNo ? `Room ${d.roomNo}` : null
                          ].filter(Boolean).join(', ')}</p>
                        )}
                        {(auth?.user?.role?.name === 'Admin' || auth?.user?.role?.name === 'HR') && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-500 mr-2">Role:</label>
                            <select
                              className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                              value={d.user?.role?._id || d.user?.role || ''}
                              onChange={e => updateUserRole(d.user?._id, e.target.value)}
                            >
                              <option value="">Select role</option>
                              {roles.data.map(r => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">Availability</p>
                        {(() => {
                          const doctorAvailability = availability.data[d._id] || []
                          if (doctorAvailability.length === 0) return <p className="text-xs text-gray-500">No schedule configured</p>
                          
                          // Group by day
                          const grouped = {}
                          doctorAvailability.forEach(a => {
                            if (!grouped[a.dayOfWeek]) grouped[a.dayOfWeek] = []
                            grouped[a.dayOfWeek].push(a)
                          })
                          
                          return (
                            <ul className="list-disc ml-4 space-y-1 text-xs">
                              {dayNames.map(day => {
                                const schedules = grouped[day]
                                if (!schedules) return null
                                return (
                                  <li key={day}>
                                    <span className="font-medium">{day}:</span>{' '}
                                    {schedules.map((s, i) => (
                                      <span key={i}>
                                        {s.workingHours?.start}-{s.workingHours?.end}
                                        {i < schedules.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </li>
                                )
                              }).filter(Boolean)}
                            </ul>
                          )
                        })()}
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 md:col-span-2">
                        <p className="font-semibold mb-1">Qualifications & Languages</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(d.qualifications||[]).map((q, i)=> <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">{q}</span>)}
                          {(d.languages||[]).map((l, i)=> <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">{l}</span>)}
                        </div>
                        {d.bio && <p className="text-xs text-gray-600 dark:text-gray-400">{d.bio}</p>}
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