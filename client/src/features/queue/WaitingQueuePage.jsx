import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import DateTimeInput from '../../components/DateTimeInput.jsx'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

export default function WaitingQueuePage() {
  const auth = useSelector(s => s.auth)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [scheduleModal, setScheduleModal] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({ appointmentDate: '', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const queueRes = await api.get('/waiting-queue')
      setQueue(queueRes.data?.data || [])
    } catch (e) {
      toast.error('Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const updatePriority = async (id, priority) => {
    try {
      await api.put(`/waiting-queue/${id}`, { priority })
      toast.success('Priority updated')
      fetchData()
    } catch (e) {
      toast.error('Failed to update priority')
    }
  }

  const notifyPatient = async (entry) => {
    try {
      const patientUserId = entry.patient?.user?._id
      if (!patientUserId) return toast.error('Patient user not found')
      const roomBits = [
        entry.doctor?.buildingName || null,
        entry.doctor?.buildingNo ? `Bldg ${entry.doctor.buildingNo}` : null,
        entry.doctor?.floorNo ? `Floor ${entry.doctor.floorNo}` : null,
        entry.doctor?.roomNo ? `Room ${entry.doctor.roomNo}` : null
      ].filter(Boolean)
      const location = roomBits.join(', ')
      await api.post('/notifications', {
        user: patientUserId,
        type: 'room-call',
        title: 'Please enter the doctor\'s room',
        message: location ? `Your turn now. Proceed to ${location}.` : 'Your turn now. Please proceed to the doctor\'s room.',
        meta: { appointmentId: entry.scheduledAppointment || null, doctorId: entry.doctor?._id || null }
      })
      toast.success('Notification sent')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send notification')
    }
  }

  const removeFromQueue = async (id) => {
    if (!confirm('Remove from queue?')) return
    try {
      await api.delete(`/waiting-queue/${id}`)
      toast.success('Removed from queue')
      fetchData()
    } catch (e) {
      toast.error('Failed to remove')
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
      toast.success('Appointment scheduled from queue')
      setScheduleModal(null)
      setScheduleForm({ appointmentDate: '', notes: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to schedule')
    }
  }

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Waiting Queue</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage patient waiting list and schedule appointments</p>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {queue.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No patients in queue.</p>
          ) : (
            <ul className="space-y-4">
              {queue.map((entry) => (
                <li key={entry._id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${priorityColors[entry.priority]}`}>
                          {entry.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          entry.status === 'waiting' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                          entry.status === 'scheduled' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                          entry.status === 'expired' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-200' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mb-1">Patient: {entry.patient?.user?.name || '—'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Doctor: {entry.doctor?.user?.name || '—'} ({entry.doctor?.specialization || '—'})</p>
                      {entry.requestedDate && (
                        <p className="text-xs text-gray-500 mt-1">Requested: {new Date(entry.requestedDate).toLocaleDateString()}</p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{entry.notes}&quot;</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Added: {new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {entry.status === 'waiting' && (
                        <>
                          <button 
                            onClick={() => openScheduleModal(entry)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium"
                          >
                            Schedule
                          </button>
                          {(auth?.user?.role?.name === 'Admin' || auth?.user?.role?.name === 'Receptionist') && (
                            <select 
                              value={entry.priority} 
                              onChange={(e) => updatePriority(entry._id, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs border border-gray-300 dark:border-gray-600"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          )}
                          {(auth?.user?.role?.name === 'Admin' || auth?.user?.role?.name === 'Receptionist' || auth?.user?.role?.name === 'Doctor') && (
                            <button 
                              onClick={() => notifyPatient(entry)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs"
                            >
                              Notify Patient
                            </button>
                          )}
                          <button 
                            onClick={() => removeFromQueue(entry._id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {entry.status === 'scheduled' && entry.scheduledAppointment && (
                        <p className="text-xs text-green-600 dark:text-green-400">✓ Scheduled</p>
                      )}
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
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Schedule Appointment</h3>
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
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea 
                  value={scheduleForm.notes} 
                  onChange={e=>setScheduleForm(f=>({...f,notes:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" 
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium">
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
    </div>
  )
}
