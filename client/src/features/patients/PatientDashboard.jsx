import api from '../../utils/api.js'
import { useEffect, useMemo, useState } from 'react'
import DateTimeInput from '../../components/DateTimeInput.jsx'
import toast from 'react-hot-toast'
import Invoice from '../../components/Invoice.jsx'
// import PrescriptionsPage from '../prescriptions/PrescriptionsPage.jsx'
import Icon from '../../components/Icon.jsx'

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [form, setForm] = useState({ doctor: '', appointmentDate: '', notes: '' })
  const [bills, setBills] = useState([])
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', reason: '' })
  const [selectedBill, setSelectedBill] = useState(null)
  const [doctorQuery, setDoctorQuery] = useState('')
  const [availability, setAvailability] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [rxLoading, setRxLoading] = useState(false)
  const [rxOpen, setRxOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [availLoading, setAvailLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [appts, docs, myBills] = await Promise.all([
        api.get('/appointments?limit=50'),
        api.get('/doctors?limit=100'),
        api.get('/bills?limit=50')
      ])
      setAppointments(appts.data?.data || [])
      setDoctors(docs.data?.data || [])
      setBills(myBills.data?.data || [])
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(); loadPrescriptions(); }, [])

  const loadPrescriptions = async () => {
    setRxLoading(true)
    try {
      const { data } = await api.get('/prescriptions/mine')
      setPrescriptions(data?.data || [])
    } catch { /* ignore */ } finally { setRxLoading(false) }
  }

  // Fetch availability when doctor changes
  useEffect(() => {
    const id = form.doctor
    if (!id) { setAvailability([]); return }
    const load = async () => {
      setAvailLoading(true)
      try {
        const { data } = await api.get(`/doctors/${id}/availability`)
        setAvailability(data?.data || [])
      } catch (e) {
        setAvailability([])
      } finally {
        setAvailLoading(false)
      }
    }
    load()
  }, [form.doctor])

  const bookAppointment = async (e) => {
    e.preventDefault()
    // Basic validations
    if (!form.doctor) return toast.error('Please select a doctor')
    if (!form.appointmentDate) return toast.error('Please select date & time')
    const when = new Date(form.appointmentDate)
    if (Number.isNaN(when.getTime())) return toast.error('Invalid date & time')
    if (when < new Date()) return toast.error('Selected time is in the past')

    // Validate against doctor's availability if present
    if (availability?.length) {
      const day = dayName(when)
      const dayRule = availability.find(a => a.dayOfWeek === day && a.isAvailable !== false)
      if (!dayRule) {
        return toast.error("Selected time is outside doctor's working days")
      }
      const t = minutesOfDay(when)
      const w = dayRule.workingHours
      if (w) {
        const startM = hhmmToMinutes(w.start)
        const endM = hhmmToMinutes(w.end)
        if (t < startM || t > endM) {
          return toast.error("Selected time is outside working hours")
        }
      }
      if (Array.isArray(dayRule.breaks)) {
        const inBreak = dayRule.breaks.some(b => t >= hhmmToMinutes(b.start) && t <= hhmmToMinutes(b.end))
        if (inBreak) return toast.error('Selected time falls within a break')
      }
    }
    try {
      await api.post('/appointments', { ...form, appointmentDate: new Date(form.appointmentDate) })
      toast.success('Appointment booked')
      setForm({ doctor: '', appointmentDate: '', notes: '' })
      setShowBooking(false)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed')
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

  const upcomingAppts = appointments.filter(a => new Date(a.appointmentDate) > new Date() && a.status !== 'canceled')
  const nextAppt = useMemo(() => (
    [...upcomingAppts].sort((a,b)=> new Date(a.appointmentDate)-new Date(b.appointmentDate))[0]
  ), [appointments])
  const unpaidBills = useMemo(()=> bills.filter(b => b.status !== 'paid'), [bills])
  const unpaidTotal = useMemo(()=> unpaidBills.reduce((s,b)=> s + (b.total||0), 0), [unpaidBills])

  const filteredDoctors = useMemo(() => {
    const q = doctorQuery.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter(d => {
      const name = (d.user?.name || '').toLowerCase()
      const spec = (d.specialization || '').toLowerCase()
      return name.includes(q) || spec.includes(q)
    })
  }, [doctorQuery, doctors])

  // Helpers
  function dayName(d){
    return d.toLocaleDateString(undefined, { weekday: 'long' })
  }
  function hhmmToMinutes(s){
    const [h,m] = String(s||'').split(':').map(n=>parseInt(n,10))
    return (h*60) + (m||0)
  }
  function minutesOfDay(d){
    return d.getHours()*60 + d.getMinutes()
  }
  function formatCurrency(n){
    try { return new Intl.NumberFormat(undefined, { style:'currency', currency:'USD' }).format(n||0) } catch { return `৳${(n||0).toFixed(2)}` }
  }
  // const myUnpaid = bills.filter(b => b.status === 'unpaid')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Patient Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your health and appointments</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border border-orange-200/60 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Next Appointment</div>
          <div className="mt-2 text-xl font-semibold">
            {loading ? '—' : nextAppt ? new Date(nextAppt.appointmentDate).toLocaleString() : 'No upcoming'}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {nextAppt?.doctor?.user?.name || ''} {nextAppt?.doctor?.specialization ? `• ${nextAppt.doctor.specialization}`: ''}
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200/60 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Appointments</div>
          <div className="mt-2 text-3xl font-extrabold text-blue-700 dark:text-blue-300">{upcomingAppts.length}</div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border border-emerald-200/60 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Unpaid Total</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{formatCurrency(unpaidTotal)}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{unpaidBills.length} bill(s)</div>
        </div>
      </div>

      {/* Booking card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mt-6">
        <h3 className="text-lg font-semibold mb-4">Book New Appointment</h3>
        {!showBooking ? (
          <button onClick={() => setShowBooking(true)} className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
            <Icon name="plus" className="w-5 h-5" />
            Schedule Appointment
          </button>
        ) : (
          <form onSubmit={bookAppointment} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <input
                  type="text"
                  value={doctorQuery}
                  onChange={(e)=> setDoctorQuery(e.target.value)}
                  placeholder="Search doctor by name or specialization"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <select className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} required>
              <option value="">Select Doctor</option>
                {filteredDoctors.map(d => <option key={d._id} value={d._id}>{d.user?.name || d.specialization} - {d.specialization}</option>)}
                </select>
              </div>
            </div>

            {form.doctor && (
              <div className="text-xs text-gray-700 dark:text-gray-300 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="calendar" className="w-4 h-4" />
                  <p className="font-semibold">Doctor Availability</p>
                  {availLoading && <span className="text-[11px] text-gray-500">Loading…</span>}
                </div>
                {!availLoading && availability.length === 0 && (
                  <p>No availability provided.</p>
                )}
                {!availLoading && availability.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availability.map((a, idx) => (
                      <div key={idx} className="rounded-lg p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold">{a.dayOfWeek}</div>
                        {a.isAvailable === false ? (
                          <div className="text-[11px] text-red-600">Not available</div>
                        ) : (
                          <div className="text-[11px] text-gray-600 dark:text-gray-400">
                            {a.workingHours?.start && a.workingHours?.end ? (
                              <span>{a.workingHours.start} - {a.workingHours.end}</span>
                            ) : '—'}
                            {Array.isArray(a.breaks) && a.breaks.length > 0 && (
                              <div className="mt-1">Breaks: {a.breaks.map((b)=> `${b.start}-${b.end}`).join(', ')}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DateTimeInput className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" value={form.appointmentDate} onChange={val => setForm(f => ({ ...f, appointmentDate: val }))} required />
            <textarea className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows="2" />
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white">Book</button>
              <button type="button" onClick={() => { setShowBooking(false); setForm({ doctor: '', appointmentDate: '', notes: '' }) }} className="px-4 py-2 rounded-lg bg-gray-500 text-white">Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[...Array(3)].map((_,i)=>(
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          )}
          {!loading && upcomingAppts.length === 0 && <p className="text-gray-500">No upcoming appointments</p>}
          <div className="space-y-3">
            {upcomingAppts.map((appt) => (
              <div key={appt._id} className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{appt.doctor?.user?.name || 'N/A'} - {appt.doctor?.specialization || ''}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(appt.appointmentDate).toLocaleString()} • {appt.status}</p>
                  </div>
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button 
                      onClick={() => openReschedule(appt)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Prescriptions</h3>
            <button onClick={()=>{ setRxOpen(prev=>!prev); if(!rxOpen) loadPrescriptions(); }} className="text-sm text-orange-600 hover:text-red-600">{rxOpen?'Hide':'Refresh'}</button>
          </div>
          {rxLoading && <p className="text-gray-500">Loading prescriptions...</p>}
          {!rxLoading && prescriptions.length === 0 && <p className="text-gray-500">No prescriptions yet.</p>}
          <div className="space-y-3 max-h-64 overflow-auto">
            {prescriptions.slice(0, rxOpen ? prescriptions.length : 5).map(p => (
              <div key={p._id} className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 cursor-pointer hover:shadow-md transition-shadow" onClick={()=>setSelectedPrescription(p)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{(p.medications||[]).map(m=>m.name).filter(Boolean).join(', ')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={(e)=>{ e.stopPropagation(); window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/prescriptions/${p._id}/pdf`); }} className="px-2 py-1 rounded bg-orange-600 text-white text-xs hover:bg-orange-700">PDF</button>
                </div>
              </div>
            ))}
          </div>
          {prescriptions.length > 5 && !rxOpen && <button onClick={()=>setRxOpen(true)} className="mt-3 text-xs text-orange-600 underline">View all ({prescriptions.length})</button>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">My Bills</h3>
          {loading && <p className="text-gray-500">Loading…</p>}
          {!loading && bills.length === 0 && <p className="text-gray-500">No bills yet.</p>}
          <div className="space-y-2">
            {bills.map((b) => (
              <div key={b._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-1">
                  <p className="text-sm font-medium">Bill #{b._id.slice(-8)} • {formatCurrency(b.total||0)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">For: {b.appointment?.doctor?.user?.name || '—'} • {b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedBill(b)} 
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs hover:shadow-lg transition-all flex items-center gap-1"
                  >
                    <Icon name="printer" className="w-3 h-3" /> Invoice
                  </button>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    b.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                    b.status === 'refunded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200'
                  }`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setRescheduleModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Reschedule Appointment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium">
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

      {/* Invoice Modal */}
      {selectedBill && <Invoice bill={selectedBill} onClose={() => setSelectedBill(null)} />}

      {/* Prescription Detail Drawer */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setSelectedPrescription(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Prescription Details</h3>
              <button onClick={()=>setSelectedPrescription(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Icon name="close" className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Prescribed on {new Date(selectedPrescription.createdAt).toLocaleString()}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Medications</h4>
                <div className="space-y-3">
                  {selectedPrescription.medications.map((m,i)=>(
                    <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{m.name} {m.strength && <span className="text-sm text-gray-600 dark:text-gray-400">{m.strength}</span>}</p>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 space-y-1">
                            <div><strong>Dosage:</strong> {m.dosage}</div>
                            <div><strong>Frequency:</strong> {m.frequency}</div>
                            <div><strong>Duration:</strong> {m.duration}</div>
                            {m.route && <div><strong>Route:</strong> {m.route}</div>}
                            {m.instructions && <div><strong>Instructions:</strong> {m.instructions}</div>}
                            {m.prn && <div className="text-red-600 dark:text-red-400 text-xs font-medium">PRN (as needed)</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.advice && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Advice</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">{selectedPrescription.advice}</p>
                </div>
              )}

              {selectedPrescription.nextTests && selectedPrescription.nextTests.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Recommended Tests</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {selectedPrescription.nextTests.map((t,i)=><li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}

              {selectedPrescription.followUpAfterDays != null && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Follow-up</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Recommended after <strong>{selectedPrescription.followUpAfterDays} day(s)</strong></p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-3">
                <button onClick={()=>window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/prescriptions/${selectedPrescription._id}/pdf`)} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Icon name="document" className="w-5 h-5" /> Open PDF
                </button>
                <button onClick={()=>setSelectedPrescription(null)} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
