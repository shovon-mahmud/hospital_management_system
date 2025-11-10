import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import DateTimeInput from '../../components/DateTimeInput.jsx'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import Icon from '../../components/Icon.jsx'

export default function AppointmentsPage() {
  const auth = useSelector(s => s.auth)
  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({ patient: '', doctor: '', appointmentDate: '', notes: '' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', reason: '' })
  const [followUpModal, setFollowUpModal] = useState(null)
  const [followUpForm, setFollowUpForm] = useState({ followUpDate: '', reason: '' })
  const itemsPerPage = 10

  const fetchAll = async () => {
    setLoading(true)
    try {
      const reqs = [api.get('/appointments?limit=200')]
      if (auth?.user?.role !== 'Patient') reqs.push(api.get('/patients?limit=100'))
      reqs.push(api.get('/doctors?limit=100'))
      const results = await Promise.all(reqs)
      const ap = results[0]
      const ds = results[results.length - 1]
      const ps = auth?.user?.role !== 'Patient' ? results[1] : { data: { data: [] } }
      setList(ap.data?.data || [])
      setFilteredList(ap.data?.data || [])
      setPatients(ps.data?.data || [])
      setDoctors(ds.data?.data || [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    let filtered = list.filter(a => 
      a.status?.toLowerCase().includes(term) ||
      a.patient?.patientId?.toLowerCase().includes(term) ||
      a.patient?.user?.name?.toLowerCase().includes(term) ||
      a.patient?.user?.email?.toLowerCase().includes(term) ||
      a.doctor?.user?.name?.toLowerCase().includes(term) ||
      a.doctor?.user?.email?.toLowerCase().includes(term) ||
      a.doctor?.specialization?.toLowerCase().includes(term) ||
      a.notes?.toLowerCase().includes(term)
    )
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }
    setFilteredList(filtered)
    setCurrentPage(1)
  }, [search, list, statusFilter])

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const create = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        const payload = { ...form, appointmentDate: new Date(form.appointmentDate) }
        if (!payload.patient) delete payload.patient
        await api.put(`/appointments/${editing._id}`, payload)
        toast.success('Appointment updated')
        setEditing(null)
      } else {
        const payload = { ...form, appointmentDate: new Date(form.appointmentDate) }
        if (!payload.patient) delete payload.patient
        await api.post('/appointments', payload)
        toast.success('Appointment created')
      }
      setForm({ patient: '', doctor: '', appointmentDate: '', notes: '' })
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const edit = (appt) => {
    setEditing(appt)
    const dateStr = new Date(appt.appointmentDate).toISOString().slice(0, 16)
    setForm({ patient: appt.patient?._id || '', doctor: appt.doctor?._id || '', appointmentDate: dateStr, notes: appt.notes || '' })
  }

  const setStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status })
      fetchAll()
    } catch (e) {
      toast.error('Update failed')
    }
  }

  const generateBill = async (id) => {
    try {
      await api.post(`/appointments/${id}/bill`)
      toast.success('Bill generated')
      fetchAll()
    } catch (e) {
      toast.error('Failed to generate bill')
    }
  }

  const openReschedule = (appt) => {
    setRescheduleModal(appt)
    setRescheduleForm({ newDate: '', reason: '' })
  }

  const submitReschedule = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/appointments/${rescheduleModal._id}/reschedule`, rescheduleForm)
      toast.success('Appointment rescheduled')
      setRescheduleModal(null)
      setRescheduleForm({ newDate: '', reason: '' })
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reschedule')
    }
  }

  const openFollowUp = (appt) => {
    setFollowUpModal(appt)
    setFollowUpForm({ followUpDate: '', reason: '' })
  }

  const submitFollowUp = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/appointments/${followUpModal._id}/follow-up`, followUpForm)
      toast.success('Follow-up scheduled')
      setFollowUpModal(null)
      setFollowUpForm({ followUpDate: '', reason: '' })
      fetchAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to schedule follow-up')
    }
  }

  const resendConfirmation = async (id) => {
    try {
      await api.post(`/appointments/${id}/resend-confirmation`)
      toast.success('Confirmation email sent')
    } catch (e) {
      toast.error('Failed to send confirmation')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Appointments</h2>
        <p className="text-gray-600 dark:text-gray-400">View and manage appointments</p>
      </div>
      <form onSubmit={create} className="grid md:grid-cols-4 gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        {auth?.user?.role !== 'Patient' && (
          <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))}>
            <option value="">Select patient</option>
            {patients.map(p=> <option key={p._id} value={p._id}>{p.user?.name || p.patientId}</option>)}
          </select>
        )}
        <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))}>
          <option value="">Select doctor</option>
          {doctors.map(d=> <option key={d._id} value={d._id}>{d.user?.name || d.specialization || d._id.slice(-6)}</option>)}
        </select>
  <DateTimeInput className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.appointmentDate} onChange={val=>setForm(f=>({...f,appointmentDate:val}))} required />
        <textarea className="md:col-span-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        <div className="md:col-span-2 flex gap-2">
          <button className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={()=>{setEditing(null);setForm({patient:'',doctor:'',appointmentDate:'',notes:''})}} className="px-4 py-2 rounded-lg bg-gray-500 text-white">Cancel</button>}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <Icon name="search" className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by status, patient, doctor, notes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-500">{filteredList.length} results</span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'canceled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {filteredList.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No appointments found.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {paginatedList.map((a) => (
                <li key={a._id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          a.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                          a.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                          a.status === 'canceled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200' :
                          a.status === 'rescheduled' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}>
                          {a.status}
                        </span>
                        {a.confirmationSentAt && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 flex items-center gap-1">
                            <Icon name="envelope" className="w-2.5 h-2.5" /> Confirmed {a.confirmedByPatient ? '✓' : 'Sent'}
                          </span>
                        )}
                        {a.isFollowUp && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 flex items-center gap-1">
                            <Icon name="repeat" className="w-2.5 h-2.5" /> Follow-up
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{new Date(a.appointmentDate).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-semibold">Patient: {a.patient?.user?.name || a.patient?.patientId || '—'}</p>
                      <p className="text-xs text-gray-500">Doctor: {a.doctor?.user?.name || '—'} ({a.doctor?.specialization || '—'})</p>
                      {a.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{a.notes}&quot;</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={()=>setExpandedId(expandedId===a._id?null:a._id)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{expandedId===a._id?'Hide':'Details'}</button>
                      {(auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist') && (
                        <button className="px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-xs" onClick={()=>edit(a)}>Edit</button>
                      )}
                    </div>
                  </div>
                  {expandedId===a._id && (
                    <div className="mt-3 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold mb-2">Patient Details</p>
                          <p>Name: {a.patient?.user?.name || '—'}</p>
                          <p>ID: {a.patient?.patientId || '—'}</p>
                          <p>Email: {a.patient?.user?.email || '—'}</p>
                          <p>Phone: {a.patient?.contact?.phone || '—'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold mb-2">Doctor Details</p>
                          <p>Name: {a.doctor?.user?.name || '—'}</p>
                          <p>Email: {a.doctor?.user?.email || '—'}</p>
                          <p>Specialization: {a.doctor?.specialization || '—'}</p>
                          <p>Department: {a.doctor?.department?.name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist' || auth?.user?.role === 'Doctor') && (
                          <>
                            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs" onClick={()=>setStatus(a._id,'confirmed')}>Confirm</button>
                            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs" onClick={()=>setStatus(a._id,'completed')}>Complete</button>
                            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs" onClick={()=>setStatus(a._id,'canceled')}>Cancel</button>
                          </>
                        )}
                        {(auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist') && (
                          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs" onClick={()=>generateBill(a._id)}>Generate Bill</button>
                        )}
                        {(auth?.user?.role === 'Patient' || auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist') && a.status !== 'canceled' && a.status !== 'completed' && (
                          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs" onClick={()=>openReschedule(a)}>Reschedule</button>
                        )}
                        {(auth?.user?.role === 'Doctor' || auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist') && a.status === 'completed' && (
                          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs" onClick={()=>openFollowUp(a)}>Schedule Follow-up</button>
                        )}
                        {(auth?.user?.role === 'Admin' || auth?.user?.role === 'Receptionist') && (
                          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs" onClick={()=>resendConfirmation(a._id)}>Resend Confirmation</button>
                        )}
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

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setRescheduleModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Reschedule Appointment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Current: {new Date(rescheduleModal.appointmentDate).toLocaleString()}
            </p>
            <form onSubmit={submitReschedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Date & Time</label>
                <DateTimeInput 
                  value={rescheduleForm.newDate} 
                  onChange={val=>setRescheduleForm(f=>({...f,newDate:val}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                <textarea 
                  value={rescheduleForm.reason} 
                  onChange={e=>setRescheduleForm(f=>({...f,reason:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  rows={3}
                  placeholder="Reason for rescheduling..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium">
                  Reschedule
                </button>
                <button type="button" onClick={()=>setRescheduleModal(null)} className="px-4 py-2 rounded-lg bg-gray-500 text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {followUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setFollowUpModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Schedule Follow-up</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Patient: {followUpModal.patient?.user?.name || '—'}<br/>
              Doctor: {followUpModal.doctor?.user?.name || '—'}
            </p>
            <form onSubmit={submitFollowUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Follow-up Date & Time</label>
                <DateTimeInput 
                  value={followUpForm.followUpDate} 
                  onChange={val=>setFollowUpForm(f=>({...f,followUpDate:val}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea 
                  value={followUpForm.reason} 
                  onChange={e=>setFollowUpForm(f=>({...f,reason:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  rows={3}
                  placeholder="Reason for follow-up..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium">
                  Schedule
                </button>
                <button type="button" onClick={()=>setFollowUpModal(null)} className="px-4 py-2 rounded-lg bg-gray-500 text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
