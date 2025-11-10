import api from '../../utils/api.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

export default function DoctorAvailabilityPage() {
  const auth = useSelector(s => s.auth)
  const { doctorId: urlDoctorId } = useParams()
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState(urlDoctorId || null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [availability, setAvailability] = useState([])
  const [daysOff, setDaysOff] = useState([])
  const [scheduleModal, setScheduleModal] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 0,
    workingHours: { start: '09:00', end: '17:00' },
    breaks: [],
    isAvailable: true,
    effectiveFrom: new Date().toISOString().split('T')[0]
  })
  const [dayOffModal, setDayOffModal] = useState(false)
  const [dayOffForm, setDayOffForm] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: ''
  })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const fetchDoctorProfile = async () => {
    try {
      const { data } = await api.get('/doctors?limit=100')
      const doctors = data?.data || []
      setDoctors(doctors)
      
      // If Admin and doctorId from URL, use that
      if (auth.user?.role?.name === 'Admin' && urlDoctorId) {
        const doctor = doctors.find(d => d._id === urlDoctorId)
        if (doctor) {
          setSelectedDoctor(doctor)
          setDoctorId(urlDoctorId)
          return urlDoctorId
        }
      }
      
      // Otherwise find doctor profile for current user (Doctor role)
      const myDoctor = doctors.find(d => d.user?._id === auth.user?._id)
      if (myDoctor) {
        setSelectedDoctor(myDoctor)
        setDoctorId(myDoctor._id)
        return myDoctor._id
      }
      
      // Attempt to create a minimal profile if not exists
      try {
        const ensure = await api.post('/doctors/me/ensure')
        if (ensure.data?.data?._id) {
          setDoctorId(ensure.data.data._id)
          setSelectedDoctor(ensure.data.data)
          return ensure.data.data._id
        }
      } catch (err) {
        // ignore, fallback to error toast below
      }
    } catch (e) {
      toast.error('Failed to load doctor profile')
    }
    return null
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      let docId = doctorId
      if (!docId) {
        docId = await fetchDoctorProfile()
      }
      if (!docId) {
        toast.error('Doctor profile not found. Please contact Admin to create one.')
        setLoading(false)
        return
      }

      const [availRes, daysOffRes] = await Promise.all([
        api.get(`/doctors/${docId}/availability`),
        api.get(`/doctors/${docId}/days-off`)
      ])

      setAvailability(availRes.data?.data || [])
      setDaysOff(daysOffRes.data?.data || [])
    } catch (e) {
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [doctorId])

  const openScheduleModal = (schedule = null) => {
    if (schedule) {
      setScheduleModal(schedule)
      // Convert backend day name to numeric index
      const dayIndex = dayNames.indexOf(schedule.dayOfWeek)
      setScheduleForm({
        dayOfWeek: dayIndex >= 0 ? dayIndex : 0,
        workingHours: schedule.workingHours,
        breaks: schedule.breaks || [],
        isAvailable: schedule.isAvailable,
        effectiveFrom: schedule.effectiveFrom?.split('T')[0] || new Date().toISOString().split('T')[0]
      })
    } else {
      setScheduleModal({})
      setScheduleForm({
        dayOfWeek: 0,
        workingHours: { start: '09:00', end: '17:00' },
        breaks: [],
        isAvailable: true,
        effectiveFrom: new Date().toISOString().split('T')[0]
      })
    }
  }

  const submitSchedule = async (e) => {
    e.preventDefault()
    try {
      // Convert numeric dayOfWeek to day name for backend
      const payload = {
        ...scheduleForm,
        dayOfWeek: dayNames[scheduleForm.dayOfWeek],
        doctor: doctorId
      }
      
      if (scheduleModal._id) {
        await api.put(`/availability/${scheduleModal._id}`, payload)
        toast.success('Schedule updated')
      } else {
        await api.post(`/doctors/${doctorId}/availability`, payload)
        toast.success('Schedule created')
      }
      setScheduleModal(null)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save schedule')
    }
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this schedule entry?')) return
    try {
      await api.delete(`/availability/${id}`)
      toast.success('Schedule deleted')
      fetchData()
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  const submitDayOff = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/doctors/${doctorId}/days-off`, {
        ...dayOffForm,
        doctor: doctorId
      })
      toast.success('Day off requested')
      setDayOffModal(false)
      setDayOffForm({ startDate: '', endDate: '', type: 'vacation', reason: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to request day off')
    }
  }

  const deleteDayOff = async (id) => {
    if (!confirm('Cancel this time off?')) return
    try {
      await api.delete(`/days-off/${id}`)
      toast.success('Time off canceled')
      fetchData()
    } catch (e) {
      toast.error('Failed to cancel')
    }
  }

  const addBreak = () => {
    setScheduleForm(f => ({
      ...f,
      breaks: [...f.breaks, { start: '12:00', end: '13:00', reason: 'Lunch' }]
    }))
  }

  const removeBreak = (index) => {
    setScheduleForm(f => ({
      ...f,
      breaks: f.breaks.filter((_, i) => i !== index)
    }))
  }

  const updateBreak = (index, field, value) => {
    setScheduleForm(f => ({
      ...f,
      breaks: f.breaks.map((b, i) => i === index ? { ...b, [field]: value } : b)
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {auth.user?.role?.name === 'Admin' ? 'Doctor Schedule Management' : 'My Schedule'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {auth.user?.role?.name === 'Admin' ? 'Manage doctor working hours and time off' : 'Manage your working hours and time off'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openScheduleModal()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:shadow-lg transition-all"
          >
            + Add Schedule
          </button>
          <button
            onClick={() => setDayOffModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium hover:shadow-lg transition-all"
          >
            + Request Time Off
          </button>
        </div>
      </div>

      {/* Admin: Doctor Selector */}
      {auth.user?.role?.name === 'Admin' && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Doctor</label>
          <select
            value={doctorId || ''}
            onChange={(e) => {
              const newDoctorId = e.target.value
              setDoctorId(newDoctorId)
              const doc = doctors.find(d => d._id === newDoctorId)
              setSelectedDoctor(doc)
            }}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Select a doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>
                {d.user?.name || 'Unknown'} - {d.specialization || 'N/A'}
              </option>
            ))}
          </select>
          {selectedDoctor && (
            <p className="text-xs text-gray-500 mt-2">
              Managing schedule for: {selectedDoctor.user?.name} ({selectedDoctor.user?.email})
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : !doctorId ? (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {auth.user?.role?.name === 'Admin' 
              ? 'Please select a doctor from the dropdown above to manage their schedule.'
              : 'Doctor profile not found. Please contact Admin to create your doctor profile.'}
          </p>
        </div>
      ) : (
        <>
          {/* Weekly Schedule */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
            {availability.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No schedule configured. Click &quot;Add Schedule&quot; to set your working hours.</p>
            ) : (
              <div className="space-y-3">
                {dayNames.map((day, dayIndex) => {
                  // Filter schedules by converting backend day name to index
                  const daySchedules = availability.filter(a => {
                    const backendDayIndex = dayNames.indexOf(a.dayOfWeek)
                    return backendDayIndex === dayIndex
                  })
                  return (
                    <div key={dayIndex} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{day}</h4>
                        {daySchedules.length === 0 && (
                          <span className="text-xs text-gray-500">No schedule</span>
                        )}
                      </div>
                      {daySchedules.map((schedule) => (
                        <div key={schedule._id} className="flex items-center justify-between mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                schedule.isAvailable 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                              }`}>
                                {schedule.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                              <span className="text-sm font-medium">
                                {schedule.workingHours.start} - {schedule.workingHours.end}
                              </span>
                            </div>
                            {schedule.breaks && schedule.breaks.length > 0 && (
                              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Breaks: {schedule.breaks.map(b => `${b.start}-${b.end}`).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openScheduleModal(schedule)}
                              className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs hover:bg-blue-200 dark:hover:bg-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSchedule(schedule._id)}
                              className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs hover:bg-red-200 dark:hover:bg-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Days Off */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Time Off</h3>
            {daysOff.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No time off scheduled.</p>
            ) : (
              <div className="space-y-3">
                {daysOff.map((dayOff) => (
                  <div key={dayOff._id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            dayOff.type === 'vacation' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                            dayOff.type === 'sick' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200' :
                            dayOff.type === 'personal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                          }`}>
                            {dayOff.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {new Date(dayOff.startDate).toLocaleDateString()} - {new Date(dayOff.endDate).toLocaleDateString()}
                        </p>
                        {dayOff.reason && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">&quot;{dayOff.reason}&quot;</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteDayOff(dayOff._id)}
                        className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setScheduleModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {scheduleModal._id ? 'Edit Schedule' : 'Add Schedule'}
            </h3>
            <form onSubmit={submitSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Day of Week</label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={e => setScheduleForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  required
                >
                  {dayNames.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.workingHours.start}
                    onChange={e => setScheduleForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.workingHours.end}
                    onChange={e => setScheduleForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Breaks</label>
                  <button type="button" onClick={addBreak} className="text-xs text-blue-600 hover:text-blue-700">+ Add Break</button>
                </div>
                {scheduleForm.breaks.map((brk, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="time"
                      value={brk.start}
                      onChange={e => updateBreak(idx, 'start', e.target.value)}
                      className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm"
                    />
                    <input
                      type="time"
                      value={brk.end}
                      onChange={e => updateBreak(idx, 'end', e.target.value)}
                      className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={brk.reason || ''}
                        onChange={e => updateBreak(idx, 'reason', e.target.value)}
                        placeholder="Reason"
                        className="flex-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm"
                      />
                      <button type="button" onClick={() => removeBreak(idx)} className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Effective From</label>
                <input
                  type="date"
                  value={scheduleForm.effectiveFrom}
                  onChange={e => setScheduleForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scheduleForm.isAvailable}
                  onChange={e => setScheduleForm(f => ({ ...f, isAvailable: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium">Available for appointments</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium">
                  {scheduleModal._id ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setScheduleModal(null)} className="px-4 py-2 rounded-lg bg-gray-500 text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Off Modal */}
      {dayOffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDayOffModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Request Time Off</h3>
            <form onSubmit={submitDayOff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={dayOffForm.type}
                  onChange={e => setDayOffForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  required
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="training">Training</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dayOffForm.startDate}
                    onChange={e => setDayOffForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={dayOffForm.endDate}
                    onChange={e => setDayOffForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                <textarea
                  value={dayOffForm.reason}
                  onChange={e => setDayOffForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                  rows={3}
                  placeholder="Reason for time off..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium">
                  Request
                </button>
                <button type="button" onClick={() => setDayOffModal(false)} className="px-4 py-2 rounded-lg bg-gray-500 text-white">
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
