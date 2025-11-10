import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon.jsx';

const VerifyEmailLink = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, waiting
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Check for token in URL
    if (token) {
      verifyToken();
    } else {
      // No token, show waiting/instructions page
      const emailFromUrl = searchParams.get('email');
      if (emailFromUrl) {
        setEmail(emailFromUrl);
      }
      setStatus('waiting');
      setMessage('Please check your email and click the verification link we sent you.');
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      toast.success('Email verified! Redirecting to login...');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Email verified successfully! You can now log in.' } 
        });
      }, 3000);
    } catch (err) {
      setStatus('error');
      const errorMsg = err.response?.data?.message || 'Verification failed';
      setMessage(errorMsg);
      
      // Extract email from error response if available
      if (err.response?.data?.email) {
        setEmail(err.response.data.email);
      }
      
      // Check if it's an expired token error
      if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
        toast.error('Verification link has expired or is invalid');
      } else if (errorMsg.includes('already verified')) {
        toast.info('Email already verified!');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleResendLink = async () => {
    if (!email) {
      toast.error('Unable to resend. Please try logging in to receive a new verification link.');
      navigate('/login');
      return;
    }

    setResending(true);

    try {
      const response = await api.post('/auth/resend-code', { email });
      
      toast.success(response.data.message || 'A new verification link has been sent to your email!');
      setMessage('A new verification link has been sent. Please check your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend link. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return { icon: 'spinner', color: 'from-blue-500 to-purple-600', animate: 'animate-spin' };
      case 'success':
        return { icon: 'check-circle', color: 'from-green-500 to-blue-600', animate: '' };
      case 'error':
        return { icon: 'x-circle', color: 'from-red-500 to-orange-600', animate: '' };
      case 'waiting':
        return { icon: 'mail', color: 'from-blue-500 to-purple-600', animate: '' };
      default:
        return { icon: 'mail', color: 'from-gray-500 to-gray-600', animate: '' };
    }
  };

  const statusConfig = getStatusIcon();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${statusConfig.color} rounded-2xl flex items-center justify-center mb-6`}>
              <Icon name={statusConfig.icon} className={`w-12 h-12 text-white ${statusConfig.animate}`} />
            </div>

            <h1 className="text-3xl font-bold mb-4">
              {status === 'verifying' && (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Verifying Email...
                </span>
              )}
              {status === 'success' && (
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Email Verified!
                </span>
              )}
              {status === 'error' && (
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Verification Failed
                </span>
              )}
              {status === 'waiting' && (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Check Your Email
                </span>
              )}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message || 'Please wait while we verify your email address...'}
            </p>

            {status === 'verifying' && (
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                  <Icon name="check" className="w-5 h-5" />
                  <span className="font-medium">Redirecting to login...</span>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                {message.includes('expired') && email && (
                  <button
                    onClick={handleResendLink}
                    disabled={resending}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {resending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="spinner" className="w-5 h-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="mail" className="w-5 h-5" />
                        Resend Verification Link
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  Go to Login
                </button>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need help?{' '}
                  <a 
                    href="/signup" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create a new account
                  </a>
                </p>
              </div>
            )}

            {status === 'success' && (
              <button
                onClick={() => navigate('/login')}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Continue to Login →
              </button>
            )}

            {status === 'waiting' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Icon name="info" className="w-5 h-5" />
                    What to do next:
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 ml-7 list-decimal">
                    <li>Check your email inbox{email && `: ${email}`}</li>
                    <li>Look for an email from Hospital Management System</li>
                    <li>Click the verification link in the email</li>
                    <li>You&apos;ll be automatically verified and redirected to login</li>
                  </ol>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> The verification link expires in 24 hours.
                </p>

                {email && (
                  <button
                    onClick={handleResendLink}
                    disabled={resending}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {resending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="spinner" className="w-5 h-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="mail" className="w-5 h-5" />
                        Didn&apos;t receive it? Resend Link
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailLink;
