import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import DateTimeInput from '../../components/DateTimeInput.jsx'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import PrescriptionForm from '../prescriptions/PrescriptionForm.jsx'

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ today: 0, total: 0, pending: 0 })
  const [appointments, setAppointments] = useState([])
  const [recentAppointments, setRecentAppointments] = useState([])
  const [queueCount, setQueueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [followUpModal, setFollowUpModal] = useState(null)
  const [followUpForm, setFollowUpForm] = useState({ followUpDate: '', reason: '' })
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', reason: '' })
  const [prescriptionModal, setPrescriptionModal] = useState(null)
  const [prescriptionExisting, setPrescriptionExisting] = useState(null)
  const [prescriptionLoading, setPrescriptionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [apptRes, queueRes] = await Promise.all([
        api.get('/appointments?limit=100'),
        api.get('/waiting-queue').catch(() => ({ data: { data: [] } }))
      ])
      const list = apptRes.data?.data || []
      const queue = queueRes.data?.data || []
      const today = new Date().toDateString()
      const todayAppts = list.filter(a => new Date(a.appointmentDate).toDateString() === today)
      const completed = list.filter(a => a.status === 'completed').slice(0, 5)
      setStats({
        today: todayAppts.length,
        total: list.length,
        pending: list.filter(a => a.status === 'pending').length
      })
      setAppointments(todayAppts.slice(0, 5))
      setRecentAppointments(completed)
      setQueueCount(queue.filter(q => q.status === 'waiting').length)
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const complete = async (id) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'completed' })
      toast.success('Appointment completed')
      fetchData()
    } catch (e) {
      toast.error('Failed')
    }
  }

  const openPrescription = async (appt) => {
    setPrescriptionModal(appt)
    setPrescriptionExisting(null)
    setPrescriptionLoading(true)
    try {
      const { data } = await api.get(`/appointments/${appt._id}/prescription`)
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setPrescriptionExisting(data.data[0]) // Show most recent
      }
    } catch (e) {
      // ignore 404
    } finally {
      setPrescriptionLoading(false)
    }
  }

  const handlePrescriptionCreated = (p) => {
    setPrescriptionExisting(p)
    toast.success('Prescription saved')
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
        fetchData()
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to schedule follow-up')
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Doctor Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your appointments and patient care</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { title: "Today's Appointments", value: loading ? '...' : stats.today, icon: <Icon name="calendar" className="text-2xl" />, gradient: 'from-blue-500 to-cyan-500', link: '/appointments' },
            { title: 'Waiting Queue', value: loading ? '...' : queueCount, icon: <Icon name="users" className="text-2xl" />, gradient: 'from-orange-500 to-amber-500', link: '/queue' },
            { title: 'Pending Reviews', value: loading ? '...' : stats.pending, icon: <Icon name="box" className="text-2xl" />, gradient: 'from-green-500 to-emerald-500', link: '/appointments' }
        ].map((stat, idx) => (
            <Link key={idx} to={stat.link} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 block">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl mb-3`}>
              {stat.icon}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
            </Link>
        ))}
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Today&apos;s Appointments</h3>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && appointments.length === 0 && <p className="text-gray-500">No appointments today</p>}
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt._id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{appt.patient?.patientId || 'N/A'}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    appt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    appt.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>{appt.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(appt.appointmentDate).toLocaleTimeString()}</p>
              </div>
              <div className="flex gap-2">
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                  <button onClick={() => openReschedule(appt)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">
                    Reschedule
                  </button>
                )}
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                  <button onClick={() => complete(appt._id)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">
                    Complete
                  </button>
                )}
                <button onClick={() => openPrescription(appt)} className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all">
                  Rx
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Recent Completed Appointments */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Completed Appointments</h3>
            <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-700">View All →</Link>
          </div>
          {loading && <p className="text-gray-500">Loading...</p>}
          {!loading && recentAppointments.length === 0 && <p className="text-gray-500">No completed appointments</p>}
          <div className="space-y-3">
            {recentAppointments.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-medium">{appt.patient?.user?.name || appt.patient?.patientId || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(appt.appointmentDate).toLocaleDateString()} • Completed</p>
                  {appt.notes && <p className="text-xs text-gray-500 mt-1 italic">&quot;{appt.notes}&quot;</p>}
                </div>
                <button 
                  onClick={() => openFollowUp(appt)} 
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Schedule Follow-up
                </button>
                <button 
                  onClick={() => openPrescription(appt)} 
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  View Rx
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/appointments" className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-2xl mb-2"><Icon name="calendar" className="text-white" /></div>
            <h4 className="font-semibold">All Appointments</h4>
            <p className="text-sm opacity-90">View and manage appointments</p>
          </Link>
          <Link to="/availability" className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-2xl mb-2"><Icon name="calendar" className="text-white" /></div>
            <h4 className="font-semibold">My Schedule</h4>
            <p className="text-sm opacity-90">Manage availability & time off</p>
          </Link>
          <Link to="/queue" className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-2xl mb-2"><Icon name="users" className="text-white" /></div>
            <h4 className="font-semibold">Waiting Queue</h4>
            <p className="text-sm opacity-90">View patients waiting for slots</p>
          </Link>
        </div>

        {/* Follow-up Modal */}
        {followUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setFollowUpModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Schedule Follow-up</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Patient: {followUpModal.patient?.user?.name || '—'}
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

        {/* Reschedule Modal */}
        {rescheduleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setRescheduleModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Reschedule Appointment</h3>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Patient:</strong> {rescheduleModal.patient?.user?.name || rescheduleModal.patient?.patientId || '—'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Current Date:</strong> {new Date(rescheduleModal.appointmentDate).toLocaleString()}
                </p>
              </div>
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
                  <label className="block text-sm font-medium mb-2">Reason for Rescheduling</label>
                  <textarea 
                    value={rescheduleForm.reason} 
                    onChange={e=>setRescheduleForm(f=>({...f,reason:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                    rows={3}
                    placeholder="Reason for rescheduling..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all">
                    Confirm Reschedule
                  </button>
                  <button type="button" onClick={()=>setRescheduleModal(null)} className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {prescriptionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setPrescriptionModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e=>e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Prescription</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Patient: <span className="font-medium text-gray-900 dark:text-white">{prescriptionModal.patient?.user?.name || '—'}</span></p>
              {prescriptionLoading && <p className="text-gray-500 dark:text-gray-400">Loading prescription...</p>}
              {!prescriptionLoading && prescriptionExisting && (
                <div className="space-y-3 mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Created {new Date(prescriptionExisting.createdAt).toLocaleString()}</div>
                  <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1">
                    {prescriptionExisting.medications.map((m,i)=>(
                      <li key={i} className="leading-relaxed">
                        <span className="font-semibold">{m.name}</span> {m.strength && <span className="text-gray-600 dark:text-gray-400">{m.strength}</span>} • {m.dosage} {m.frequency} • {m.duration}{m.instructions && <span className="text-xs text-gray-600 dark:text-gray-400"> • {m.instructions}</span>}
                      </li>
                    ))}
                  </ul>
                  {prescriptionExisting.advice && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Advice:</p>
                      <p className="text-xs italic text-gray-700 dark:text-gray-300">{prescriptionExisting.advice}</p>
                    </div>
                  )}
                  <div className="flex gap-3 mt-3">
                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/prescriptions/${prescriptionExisting._id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:shadow-lg transition-all">
                      <Icon name="document" className="w-4 h-4" /> Open PDF
                    </a>
                    <button onClick={()=>setPrescriptionExisting(null)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">Edit / Replace</button>
                  </div>
                </div>
              )}
              {!prescriptionLoading && !prescriptionExisting && (
                <PrescriptionForm appointmentId={prescriptionModal._id} onCreated={handlePrescriptionCreated} />
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={()=>setPrescriptionModal(null)} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
