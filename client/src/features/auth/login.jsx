import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { login } from './authSlice.js'
import toast from 'react-hot-toast'
import { Navigate, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, status, error } = useSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    const res = await dispatch(login({ email, password }))
    if (res.meta.requestStatus === 'rejected') {
      const errorMessage = res.payload || 'Login failed'
      
      // Check if error is 403 (unverified email)
      if (res.error?.message?.includes('verify your email') || errorMessage.includes('verify')) {
        toast.error(errorMessage)
        // Redirect to verify page with email pre-filled
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
            state: { message: 'Please verify your email to continue. A verification link has been sent to your inbox. Click the link in your email to verify your account.' }
          })
        }, 1500)
      } else {
        toast.error(errorMessage)
      }
    } else {
      toast.success('Welcome!')
    }
  }

  if (user) {
    const roleName = user.role?.name || user.role
    return <Navigate to={`/${roleName.toLowerCase()}`} replace />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 transform hover:scale-110 transition-transform duration-200">
              <Icon name="user" className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="mail" className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="admin@hms.bd" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="lock" className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="••••••••" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={status==='loading'}
            >
              {status==='loading' ? (
                <span className="flex items-center justify-center">
                  <Icon name="spinner" className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 space-y-2">
              <p className="font-medium">Demo accounts:</p>
              <p>Admin: admin@hms.bd / Admin@123</p>
              <p>HR: hr@hms.bd / Pass@123</p>
              <p>Reception: reception@hms.bd / Pass@123</p>
              <p>Doctor: dr.nami@hms.bd / Pass@123</p>
              <p>Patient: chitoge@example.bd / Pass@123</p>
              <p>
                New here? <a href="/signup" className="text-emerald-600 hover:underline">Create an account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
