import api from '../../utils/api.js'
import { useEffect, useMemo, useState } from 'react'
import DateTimeInput from '../../components/DateTimeInput.jsx'
import toast from 'react-hot-toast'
import Invoice from '../../components/Invoice.jsx'
import Icon from '../../components/Icon.jsx'

export default function ReceptionDashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0, queue: 0, unpaid: 0 })
  const [todayAppts, setTodayAppts] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [queue, setQueue] = useState([])
  const [unpaidBills, setUnpaidBills] = useState([])
  const [booking, setBooking] = useState({ patient: '', doctor: '', appointmentDate: '', notes: '' })
  const [scheduleModal, setScheduleModal] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({ appointmentDate: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview | today | booking | queue | billing
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [todayStatus, setTodayStatus] = useState('pending') // pending | confirmed | all
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', reason: '' })
  const [newPatientModal, setNewPatientModal] = useState(false)
  const [newPatient, setNewPatient] = useState({ name: '', email: '', phone: '', address: '', dateOfBirth: '', bloodGroup: '', emergencyContact: '' })
  const [appointmentPriority, setAppointmentPriority] = useState('medium')
  const [selectedBill, setSelectedBill] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [apptRes, patientRes, doctorRes, queueRes, billsRes] = await Promise.all([
        api.get('/appointments?limit=200'),
        api.get('/patients?limit=200'),
        api.get('/doctors?limit=200'),
        api.get('/waiting-queue'),
        api.get('/bills?limit=200')
      ])
      const list = apptRes.data?.data || []
      const ps = patientRes.data?.data || []
      const ds = doctorRes.data?.data || []
      const q = queueRes.data?.data || []
      const bills = billsRes.data?.data || []
      const today = new Date().toDateString()
      const todayAppts = list.filter(a => new Date(a.appointmentDate).toDateString() === today)
      setStats({
        today: todayAppts.length,
        pending: todayAppts.filter(a => a.status === 'pending').length,
        confirmed: todayAppts.filter(a => a.status === 'confirmed').length,
        completed: todayAppts.filter(a => a.status === 'completed').length,
        queue: q.filter(e => e.status === 'waiting').length,
        unpaid: bills.filter(b => b.status === 'unpaid').length
      })
      setTodayAppts(todayAppts)
      setPatients(ps)
      setDoctors(ds)
      setQueue(q.slice(0, 8))
      setUnpaidBills(bills.filter(b => b.status === 'unpaid').slice(0, 8))
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const confirm = async (id) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'confirmed' })
      toast.success('Confirmed')
      fetchData()
    } catch (e) {
      toast.error('Failed')
    }
  }

  const complete = async (id) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'completed' })
      toast.success('Marked completed')
      fetchData()
    } catch (e) {
      toast.error('Failed')
    }
  }

  const cancel = async (id) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'canceled' })
      toast.success('Canceled')
      fetchData()
    } catch (e) {
      toast.error('Failed')
    }
  }

  const generateBill = async (id) => {
    try {
      await api.post(`/appointments/${id}/bill`)
      toast.success('Bill generated')
      fetchData()
    } catch (e) {
      toast.error('Failed to generate bill')
    }
  }

  const updateBillStatus = async (id, status) => {
    try {
      await api.put(`/bills/${id}`, { status })
      toast.success('Bill updated')
      fetchData()
    } catch (e) {
      toast.error('Failed to update bill')
    }
  }

  const bookAppointment = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...booking, appointmentDate: new Date(booking.appointmentDate) }
      if (!payload.patient) return toast.error('Select a patient')
      if (!payload.doctor) return toast.error('Select a doctor')
      await api.post('/appointments', payload)
      toast.success('Appointment created')
      setBooking({ patient: '', doctor: '', appointmentDate: '', notes: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create appointment')
    }
  }

  const openScheduleModal = (entry) => {
    setScheduleModal(entry)
    setScheduleForm({ appointmentDate: '', notes: entry.notes || '' })
  }

  const submitSchedule = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/waiting-queue/${scheduleModal._id}/schedule`, scheduleForm)
      toast.success('Scheduled from queue')
      setScheduleModal(null)
      setScheduleForm({ appointmentDate: '', notes: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to schedule')
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
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reschedule')
    }
  }

  const createNewPatient = async (e) => {
    e.preventDefault()
    try {
      // First create user account
      const userRes = await api.post('/auth/register', {
        name: newPatient.name,
        email: newPatient.email,
        password: 'Patient@123', // Default password
        roleName: 'Patient'
      })
      
      // Then create patient profile
      const patientRes = await api.post('/patients', {
        user: userRes.data.data._id,
        phone: newPatient.phone,
        address: newPatient.address,
        dateOfBirth: newPatient.dateOfBirth,
        bloodGroup: newPatient.bloodGroup,
        emergencyContact: newPatient.emergencyContact
      })
      
      toast.success('Patient created successfully! Default password: Patient@123')
      setNewPatientModal(false)
      setNewPatient({ name: '', email: '', phone: '', address: '', dateOfBirth: '', bloodGroup: '', emergencyContact: '' })
      fetchData()
      
      // Auto-select the new patient in booking form
      setBooking(b => ({ ...b, patient: patientRes.data.data._id }))
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create patient')
    }
  }

  // Derived filters
  const filteredToday = useMemo(() => {
    let list = todayAppts
    if (selectedDoctor) {
      list = list.filter(a => a.doctor?._id === selectedDoctor)
    }
    if (todayStatus !== 'all') {
      list = list.filter(a => a.status === todayStatus)
    }
    // Sort by time ascending
    return list.sort((a,b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
  }, [todayAppts, selectedDoctor, todayStatus])

  const filteredQueue = useMemo(() => {
    let list = queue
    if (selectedDoctor) list = list.filter(e => e.doctor?._id === selectedDoctor)
    return list
  }, [queue, selectedDoctor])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Reception Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage appointments, queue, and billing</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'today', label: "Today's Appointments" },
          { key: 'booking', label: 'Quick Booking' },
          { key: 'queue', label: 'Waiting Queue' },
          { key: 'billing', label: 'Unpaid Bills' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab===t.key ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700'} `}
          >
            {t.label}
          </button>
        ))}
        {/* Doctor filter (applies to Today & Queue) */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Doctor:</span>
          <select value={selectedDoctor} onChange={e=>setSelectedDoctor(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm">
            <option value="">All</option>
            {doctors.map(d=> <option key={d._id} value={d._id}>{d.user?.name || d.specialization || d._id.slice(-6)}</option>)}
          </select>
        </div>
      </div>

      {/* Overview */}
      {activeTab==='overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ 
              { title: "Today's Appointments", value: loading ? '...' : stats.today, icon: <Icon name="calendar" className="text-2xl" />, gradient: 'from-blue-500 to-cyan-500', tab: 'today', status: 'all' },
              { title: 'Pending', value: loading ? '...' : stats.pending, icon: <Icon name="clock" className="text-2xl" />, gradient: 'from-yellow-500 to-orange-500', tab: 'today', status: 'pending' },
              { title: 'Confirmed', value: loading ? '...' : stats.confirmed, icon: <Icon name="document" className="text-2xl" />, gradient: 'from-indigo-500 to-blue-600', tab: 'today', status: 'confirmed' },
              { title: 'Completed Today', value: loading ? '...' : stats.completed, icon: <Icon name="check" className="text-2xl" />, gradient: 'from-green-500 to-emerald-500', tab: 'today', status: 'all' },
              { title: 'Waiting Queue', value: loading ? '...' : stats.queue, icon: <Icon name="users" className="text-2xl" />, gradient: 'from-purple-500 to-pink-500', tab: 'queue' },
              { title: 'Unpaid Bills', value: loading ? '...' : stats.unpaid, icon: <Icon name="card" className="text-2xl" />, gradient: 'from-rose-500 to-red-500', tab: 'billing' }
            ].map((stat, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                  setActiveTab(stat.tab)
                  if (stat.status) setTodayStatus(stat.status)
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 text-left cursor-pointer transform hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Quick Booking</h3>
                <p className="text-xs text-gray-500">Create a new appointment</p>
              </div>
              <button onClick={()=>setActiveTab('booking')} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm">Open</button>
            </div>
          </div>
        </>
      )}

      {/* Today's Appointments */}
      {activeTab==='today' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['pending','confirmed','all'].map(s => (
              <button key={s} onClick={()=>setTodayStatus(s)} className={`px-4 py-2 rounded-lg text-sm font-medium ${todayStatus===s ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700'}`}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          {loading && <p className="text-gray-500">Loading...</p>}
          {!loading && filteredToday.length === 0 && <p className="text-gray-500">No appointments match the filters</p>}
          <div className="space-y-3">
            {filteredToday.map(appt => (
              <div key={appt._id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold">{appt.patient?.user?.name || appt.patient?.patientId || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{appt.doctor?.user?.name || 'N/A'} - {new Date(appt.appointmentDate).toLocaleString()}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                    appt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                    appt.status === 'canceled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200'
                  }`}>{appt.status}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {appt.status !== 'confirmed' && appt.status !== 'completed' && appt.status !== 'canceled' && (
                    <button onClick={() => confirm(appt._id)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">Confirm</button>
                  )}
                  {appt.status !== 'completed' && appt.status !== 'canceled' && (
                    <button onClick={() => complete(appt._id)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-700 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">Complete</button>
                  )}
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button onClick={() => openReschedule(appt)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">Reschedule</button>
                  )}
                  {appt.status !== 'canceled' && appt.status !== 'completed' && (
                    <button onClick={() => cancel(appt._id)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">Cancel</button>
                  )}
                  <button onClick={() => generateBill(appt._id)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">Generate Bill</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Booking */}
      {activeTab==='booking' && (
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Booking</h3>
              <button 
                onClick={() => setNewPatientModal(true)} 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Icon name="plus" className="w-4 h-4" /> New Patient
              </button>
            </div>
            <form onSubmit={bookAppointment} className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={booking.patient} onChange={e=>setBooking(b=>({...b,patient:e.target.value}))} required>
                  <option value="">Select patient</option>
                  {patients.map(p=> <option key={p._id} value={p._id}>{p.user?.name || p.patientId}</option>)}
                </select>
                <select className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={booking.doctor} onChange={e=>setBooking(b=>({...b,doctor:e.target.value}))} required>
                  <option value="">Select doctor</option>
                  {doctors.map(d=> <option key={d._id} value={d._id}>{d.user?.name || d.specialization || d._id.slice(-6)}</option>)}
                </select>
                <DateTimeInput className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={booking.appointmentDate} onChange={val=>setBooking(b=>({...b,appointmentDate:val}))} required />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <select 
                  className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  value={appointmentPriority} 
                  onChange={e=>setAppointmentPriority(e.target.value)}
                >
                  <option value="low">Priority: Low</option>
                  <option value="medium">Priority: Medium</option>
                  <option value="high">Priority: High</option>
                  <option value="urgent">Priority: Urgent</option>
                </select>
                <input type="text" placeholder="Notes (optional)" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={booking.notes} onChange={e=>setBooking(b=>({...b,notes:e.target.value}))} />
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"><Icon name="calendar" className="w-5 h-5" /> Book Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      {activeTab==='queue' && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Waiting Queue</h3>
          {filteredQueue.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No patients in queue.</p>
          ) : (
            <ul className="space-y-3">
              {filteredQueue.map(entry => (
                <li key={entry._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.patient?.user?.name || '—'} → {entry.doctor?.user?.name || '—'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Priority:</span>
                        <select
                          value={entry.priority}
                          onChange={async (e) => {
                            e.stopPropagation()
                            const newPriority = e.target.value
                            try {
                              await api.put(`/waiting-queue/${entry._id}`, { priority: newPriority })
                              toast.success('Priority updated')
                              fetchData()
                            } catch (err) {
                              toast.error('Failed to update priority')
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      {entry.requestedDate && (
                        <p className="text-xs text-gray-500">Requested: {new Date(entry.requestedDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <button onClick={() => openScheduleModal(entry)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs">Schedule</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Unpaid Bills */}
      {activeTab==='billing' && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Unpaid Bills</h3>
            <a href="/billing" className="text-sm text-blue-600 hover:underline">View all</a>
          </div>
          {unpaidBills.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No unpaid bills 🎉</p>
          ) : (
            <ul className="space-y-3">
              {unpaidBills.map(b => (
                <li key={b._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">Bill #{b._id.slice(-6)} • ${b.total?.toFixed(2)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Status: {b.status}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setSelectedBill(b)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs hover:shadow-lg transition-all flex items-center gap-1"><Icon name="printer" className="w-3 h-3" /> Invoice</button>
                      <button onClick={() => updateBillStatus(b._id, 'paid')} className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs">Mark Paid</button>
                      <button onClick={() => updateBillStatus(b._id, 'refunded')} className="px-3 py-1 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">Refund</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setScheduleModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Schedule from Queue</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Patient: {scheduleModal.patient?.user?.name || '—'}<br/>
              Doctor: {scheduleModal.doctor?.user?.name || '—'}
            </p>
            <form onSubmit={submitSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Appointment Date & Time</label>
                <DateTimeInput 
                  value={scheduleForm.appointmentDate} 
                  onChange={val=>setScheduleForm(f=>({...f,appointmentDate:val}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea 
                  value={scheduleForm.notes} 
                  onChange={e=>setScheduleForm(f=>({...f,notes:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  rows={3}
                  placeholder="Notes..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium">
                  Schedule
                </button>
                <button type="button" onClick={()=>setScheduleModal(null)} className="px-4 py-2 rounded-lg bg-gray-500 text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setRescheduleModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Reschedule Appointment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Patient: {rescheduleModal.patient?.user?.name || rescheduleModal.patient?.patientId || '—'}<br/>
              Doctor: {rescheduleModal.doctor?.user?.name || '—'}<br/>
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

      {/* New Patient Modal */}
      {newPatientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setNewPatientModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Create New Patient</h3>
            <form onSubmit={createNewPatient} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input 
                    type="text"
                    value={newPatient.name}
                    onChange={e=>setNewPatient(p=>({...p,name:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input 
                    type="email"
                    value={newPatient.email}
                    onChange={e=>setNewPatient(p=>({...p,email:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input 
                    type="tel"
                    value={newPatient.phone}
                    onChange={e=>setNewPatient(p=>({...p,phone:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input 
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={e=>setNewPatient(p=>({...p,dateOfBirth:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Blood Group</label>
                  <select 
                    value={newPatient.bloodGroup}
                    onChange={e=>setNewPatient(p=>({...p,bloodGroup:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                  <input 
                    type="tel"
                    value={newPatient.emergencyContact}
                    onChange={e=>setNewPatient(p=>({...p,emergencyContact:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea 
                  value={newPatient.address}
                  onChange={e=>setNewPatient(p=>({...p,address:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  rows={2}
                  placeholder="Full address..."
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Icon name="info" className="w-4 h-4" /> Default password will be: <strong>Patient@123</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:shadow-lg transition-all">
                  Create Patient
                </button>
                <button type="button" onClick={()=>setNewPatientModal(false)} className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedBill && <Invoice bill={selectedBill} onClose={() => setSelectedBill(null)} />}
    </div>
  )
}
