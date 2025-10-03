import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',  // Changed from email to username
    password: '',
  })

  const [showSignUp, setShowSignUp] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending login request...', { username: formData.username, password: formData.password });
      
      // Use the authService instead of direct fetch
      const { authService } = await import('../../services/authService.js');
      const data = await authService.login({
        username: formData.username,
        password: formData.password
      });
      
      console.log('Login response:', data);
      
      if (data.status === 'success' && data.data) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.data))
        localStorage.setItem('user_id', data.data.user_id); // Use 'user_id' as the user ID
        
        const userRole = (data.data.role || '').toLowerCase();
        console.log('User role:', userRole); // Debug log

        // Redirect based on user role
        switch (userRole) {
          case 'admin':
            console.log('Redirecting to admin dashboard...');
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'resident':
            navigate('/resident', { replace: true });
            break;
          case 'barangay_head':
            navigate('/barangayhead', { replace: true });
            break;
          case 'truck_driver':
            navigate('/truckdriver', { replace: true });
            break;
          case 'garbage_collector':
            navigate('/garbagecollector', { replace: true });
            break;
          default:
            console.error('Invalid role:', userRole);
            setError('Invalid user role: ' + data.data.role)
        }
        
        // Force a page reload as backup
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Network error. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (showSignUp) {
    return <SignUp onLoginClick={() => setShowSignUp(false)} />
  }
  if (showForgot) {
    return <ForgotPassword onBackToLogin={() => setShowForgot(false)} />
  }
  
  return (
    <>
      {/* Enhanced loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
            <h3 className="mt-6 text-xl font-semibold text-gray-800">Signing you in...</h3>
            <p className="text-sm text-gray-600 mt-2">Please wait while we verify your credentials</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-100 px-4 py-6">
        <div className="w-full max-w-md md:max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Left side: Branding or image placeholder */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-500 to-green-600 items-center justify-center relative overflow-hidden">
            <div className="text-center text-white p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="inline-block w-4 h-4 bg-white rounded-full"></span>
                <span className="inline-block w-3 h-8 bg-green-300 rounded-sm"></span>
              </div>
              <h1 className="text-4xl font-bold mb-4">KolekTrash</h1>
              <p className="text-green-100 text-lg">Smart Waste Management System</p>
              <div className="mt-8 space-y-2 text-green-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                  <span>Efficient Collection</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                  <span>Real-time Tracking</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                  <span>Community Management</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile header - visible only on mobile */}
          <div className="md:hidden bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-8 px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-block w-3 h-3 bg-white rounded-full"></span>
              <span className="inline-block w-2 h-6 bg-green-300 rounded-sm"></span>
            </div>
            <h1 className="text-2xl font-bold">KolekTrash</h1>
            <p className="text-green-100 text-sm mt-2">Smart Waste Management System</p>
          </div>
          
          {/* Right side: Login form */}
          <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
              <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
            </div>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-md mb-6 shadow-sm">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiLock size={18} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm -mt-3 pt-0">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-green-600 hover:text-green-700 font-medium transition-colors underline bg-transparent border-none focus:outline-none focus:ring-0"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignUp(true)}
                  className="text-green-600 hover:text-green-700 font-medium transition-colors underline bg-transparent border-none focus:ring-0"
                >
                  Create account
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <FiLogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Additional info section */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-green-600 hover:text-green-700 underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:text-green-700 underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login 
