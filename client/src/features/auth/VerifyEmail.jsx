import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon.jsx';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email');
  
  const [formData, setFormData] = useState({
    email: emailFromUrl || '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    }
    // Show message from login redirect if present
    if (location.state?.message) {
      toast.info(location.state.message);
    }
  }, [emailFromUrl, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For code input, only allow digits and limit to 6 characters
    if (name === 'code') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', {
        email: formData.email,
        code: formData.code
      });
      
      toast.success(response.data.message || 'Email verified successfully!');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified! You can now log in.' } });
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setResending(true);

    try {
      const response = await api.post('/auth/resend-code', {
        email: formData.email
      });
      
      toast.success(response.data.message || 'A new verification code has been sent to your email!');
      setFormData(prev => ({ ...prev, code: '' })); // Clear code input
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 transform hover:scale-110 transition-transform duration-200">
              <Icon name="mail" className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="mail" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  disabled={!!emailFromUrl}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="lock" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="000000"
                  maxLength={6}
                  pattern="\d{6}"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono text-lg tracking-widest text-center"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Code expires in 15 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || formData.code.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="spinner" className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Didn&apos;t receive a code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || !formData.email}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                ← Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

