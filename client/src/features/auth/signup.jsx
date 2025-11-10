import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { register } from './authSlice.js'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'

export default function SignupPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, status, error } = useSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Patient-specific fields
  const [gender, setGender] = useState('Other')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    const payload = { 
      name, 
      email, 
      password,
      patientData: {
        gender,
        dateOfBirth: dateOfBirth || undefined,
        bloodGroup: bloodGroup || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        contact: {
          phone: phone || undefined,
          address: address || undefined,
          emergencyContact: emergencyContact || undefined
        },
        medical: {
          allergies: allergies ? allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
          history: medicalHistory ? medicalHistory.split(',').map(h => h.trim()).filter(Boolean) : []
        }
      }
    }
    const res = await dispatch(register(payload))
    if (res.meta.requestStatus === 'rejected') {
      toast.error(res.payload || 'Registration failed')
    } else {
      toast.success('Account created! Please check your email for verification link.')
      // Redirect to verification page after successful registration
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          state: { message: 'A verification link has been sent to your email. Please check your inbox and click the link to verify your account.' }
        })
      }, 1500)
    }
  }

  if (user) {
    const roleName = user.role?.name || user.role
    return <Navigate to={`/${roleName.toLowerCase()}`} replace />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4">
              <Icon name="user" className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">Create an Account</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign up as a patient to book appointments</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Account Information */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="Jane Doe"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="you@example.com" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="••••••••" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Personal Details</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    type="date"
                    value={dateOfBirth} 
                    onChange={(e) => setDateOfBirth(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blood Group</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Select...</option>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (cm)</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    type="number"
                    placeholder="170"
                    value={heightCm} 
                    onChange={(e) => setHeightCm(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    type="number"
                    placeholder="65"
                    value={weightKg} 
                    onChange={(e) => setWeightKg(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="+880 1234567890"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="+880 9876543210"
                    value={emergencyContact} 
                    onChange={(e) => setEmergencyContact(e.target.value)} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    rows="2"
                    placeholder="House 12, Road 5, Dhanmondi, Dhaka-1205"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Medical Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="Peanuts, Penicillin (comma-separated)"
                    value={allergies} 
                    onChange={(e) => setAllergies(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical History</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="Diabetes, Asthma (comma-separated)"
                    value={medicalHistory} 
                    onChange={(e) => setMedicalHistory(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={status==='loading'}
            >
              {status==='loading' ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account? <Link to="/login" className="text-emerald-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
