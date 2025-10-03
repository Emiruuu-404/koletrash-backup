import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiUser, FiMail, FiLock, FiMapPin, FiChevronDown, FiUserPlus, FiSearch, FiCheck, FiX, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import { authService } from '../../services/authService'
import axios from "axios";

const barangays = [
  'Aldezar',
  'Alteza',
  'Anib',
  'Awayan',
  'Azucena',
  'Bagong Sirang',
  'Binahian',
  'Bolo Norte',
  'Bolo Sur',
  'Bulan',
  'Bulawan',
  'Cabuyao',
  'Caima',
  'Calagbangan',
  'Calampinay',
  'Carayrayan',
  'Cotmo',
  'Gabi',
  'Gaongan',
  'Impig',
  'Lipilip',
  'Lubigan Jr.',
  'Lubigan Sr.',
  'Malaguico',
  'Malubago',
  'Manangle',
  'Mangapo',
  'Mangga',
  'Manlubang',
  'Mantila',
  'North Centro (Poblacion)',
  'North Villazar',
  'Sagrada Familia',
  'Salanda',
  'Salvacion',
  'San Isidro',
  'San Vicente',
  'Serranzana',
  'South Centro (Poblacion)',
  'South Villazar',
  'Taisan',
  'Tara',
  'Tible',
  'Tula-tula',
  'Vigaan',
  'Yabo'
]

export default function SignUp() {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    contact_num: '',
    email: '',
    username: '',
    barangay: barangays[0],
    password: '',
    confirmPassword: '',
    address: '',
    barangay_id: ''
  })
  
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [barangaySearch, setBarangaySearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' })
  const navigate = useNavigate()

  // Validation rules
  const validationRules = {
    firstname: (value) => {
      if (!value.trim()) return 'First name is required'
      if (value.length < 2) return 'First name must be at least 2 characters'
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'First name can only contain letters and spaces'
      return null
    },
    lastname: (value) => {
      if (!value.trim()) return 'Last name is required'
      if (value.length < 2) return 'Last name must be at least 2 characters'
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Last name can only contain letters and spaces'
      return null
    },
    contact_num: (value) => {
      if (!value.trim()) return 'Contact number is required'
      if (!/^(\+63|0)?9\d{9}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid Philippine mobile number'
      return null
    },
    email: (value) => {
      if (!value.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
      return null
    },
    username: (value) => {
      if (!value.trim()) return 'Username is required'
      if (value.length < 3) return 'Username must be at least 3 characters'
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
      return null
    },
    barangay_id: (value) => {
      if (!value) return 'Please select a barangay'
      return null
    },
    password: (value) => {
      if (!value) return 'Password is required'
      if (value.length < 6) return 'Password must be at least 6 characters'
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter'
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter'
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number'
      return null
    },
    confirmPassword: (value) => {
      if (!value) return 'Please confirm your password'
      if (value !== form.password) return 'Passwords do not match'
      return null
    },
    address: (value) => {
      if (!value.trim()) return 'Address is required'
      if (value.length < 10) return 'Address must be at least 10 characters'
      return null
    }
  }

  // Validate single field
  const validateField = (name, value) => {
    const rule = validationRules[name]
    return rule ? rule(value) : null
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key])
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle field change with validation
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Handle field blur with validation
  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  // Handle barangay selection
  const handleBarangaySelect = (b) => {
    setForm(prev => ({ ...prev, barangay: b, barangay_id: b, address: b }))
    setDropdownOpen(false)
    setBarangaySearch('')
    
    // Clear barangay error
    if (errors.barangay_id) {
      setErrors(prev => ({ ...prev, barangay_id: null }))
    }
  }

  const handleDropdownToggle = () => {
    setDropdownOpen((v) => !v)
    setBarangaySearch('')
  }

  const handleBarangaySearch = (e) => {
    setBarangaySearch(e.target.value)
  }

  const filteredBarangays = barangays.filter(b =>
    b.toLowerCase().includes(barangaySearch.toLowerCase())
  )

  const handleDropdownKeyDown = (e) => {
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      setBarangaySearch(e.key)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched = {}
      Object.keys(form).forEach(key => allTouched[key] = true)
      setTouched(allTouched)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.post(
        "https://koletrash.systemproj.com/backend/api/register_resident.php",
        form
      );
      const message = res.data?.message || 'Your account has been created successfully.'
      setSuccess(message);
      setFeedbackModal({
        open: true,
        type: 'success',
        title: 'Account Created!',
        message
      })
      
      // Clear form
      setForm({
        firstname: '',
        lastname: '',
        contact_num: '',
        email: '',
        username: '',
        barangay: barangays[0],
        password: '',
        confirmPassword: '',
        address: '',
        barangay_id: ''
      })
      
      // Clear errors and touched states
      setErrors({})
      setTouched({})

    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.'
      setError(message)
      setFeedbackModal({
        open: true,
        type: 'error',
        title: 'Registration Failed',
        message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setFeedbackModal(prev => ({ ...prev, open: false }))
  }

  const handleGoToLogin = () => {
    handleCloseModal()
    navigate('/login', { replace: true })
  }

  // Helper function to get field status
  const getFieldStatus = (name) => {
    if (!touched[name]) return 'default'
    if (errors[name]) return 'error'
    if (form[name] && !errors[name]) return 'success'
    return 'default'
  }

  // Helper function to get field classes
  const getFieldClasses = (name) => {
    const baseClasses = "pl-12 w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
    const status = getFieldStatus(name)
    
    switch (status) {
      case 'error':
        return `${baseClasses} border-red-300 focus:ring-red-500`
      case 'success':
        return `${baseClasses} border-green-300 focus:ring-green-500`
      default:
        return `${baseClasses} border-gray-300 focus:ring-green-500`
    }
  }

  return (
    <>
      {/* Enhanced loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
            <h3 className="mt-6 text-xl font-semibold text-gray-800">Creating your account...</h3>
            <p className="text-sm text-gray-600 mt-2">Please wait while we set up your account</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
            <div className="flex flex-col items-center text-center space-y-4 mt-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${
                  feedbackModal.type === 'success'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {feedbackModal.type === 'success' ? (
                  <FiCheckCircle size={36} />
                ) : (
                  <FiAlertTriangle size={32} />
                )}
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${feedbackModal.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {feedbackModal.title}
                </h3>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{feedbackModal.message}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full mt-2">
                {feedbackModal.type === 'success' ? (
                  <>
                    <button
                      type="button"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow"
                      onClick={handleGoToLogin}
                    >
                      Go to Login
                    </button>
                    <button
                      type="button"
                      className="flex-1 border border-green-200 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-all duration-200"
                      onClick={handleCloseModal}
                    >
                      Stay and Review
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow"
                    onClick={handleCloseModal}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-100 px-4 py-6">
        <div className="w-full max-w-md md:max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Left side: Branding - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-green-500 to-green-600 items-center justify-center relative overflow-hidden">
            <div className="text-center text-white p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="inline-block w-5 h-5 bg-white rounded-full"></span>
                <span className="inline-block w-4 h-10 bg-green-300 rounded-sm"></span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Join KolekTrash</h1>
              <p className="text-green-100 text-lg mb-8">Smart Waste Management System</p>
              <div className="space-y-3 text-green-100">
                <div className="flex items-center justify-center gap-3">
                  <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                  <span>Easy Account Setup</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                  <span>Community Access</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                  <span>Waste Tracking</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile header - visible only on mobile */}
          <div className="md:hidden bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-6 px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-block w-3 h-3 bg-white rounded-full"></span>
              <span className="inline-block w-2 h-6 bg-green-300 rounded-sm"></span>
            </div>
            <h1 className="text-xl font-bold">Join KolekTrash</h1>
            <p className="text-green-100 text-sm mt-1">Create your account</p>
          </div>
          
          {/* Right side: SignUp form */}
          <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-center max-h-screen md:max-h-none overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
              <p className="text-gray-600 text-sm">Fill in your details to get started</p>
            </div>
            
            {/* Error Message */}
            {error && !feedbackModal.open && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-md mb-4 shadow-sm">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && !feedbackModal.open && (
              <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-r-md mb-4 shadow-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">First Name</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="firstname"
                    required
                    value={form.firstname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('firstname')}
                    placeholder="Enter your first name"
                    disabled={loading}
                  />
                  {getFieldStatus('firstname') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('firstname') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.firstname && errors.firstname && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.firstname}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="lastname"
                    required
                    value={form.lastname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('lastname')}
                    placeholder="Enter your last name"
                    disabled={loading}
                  />
                  {getFieldStatus('lastname') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('lastname') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.lastname && errors.lastname && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.lastname}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="contact_num"
                    required
                    value={form.contact_num}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('contact_num')}
                    placeholder="e.g., 09123456789"
                    disabled={loading}
                  />
                  {getFieldStatus('contact_num') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('contact_num') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.contact_num && errors.contact_num && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.contact_num}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiMail size={18} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('email')}
                    placeholder="example@example.com"
                    disabled={loading}
                  />
                  {getFieldStatus('email') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('email') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Username</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('username')}
                    placeholder="Choose a username"
                    disabled={loading}
                  />
                  {getFieldStatus('username') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('username') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.username && errors.username && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Barangay Dropdown */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Barangay</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10">
                    <FiMapPin size={18} />
                  </span>
                  <select
                    name="barangay_id"
                    value={form.barangay_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={getFieldClasses('barangay_id')}
                  >
                    <option value="">Select Barangay</option>
                    <option value="01-ALDZR">Aldezar</option>
                    <option value="02-ALTZ">Alteza</option>
                    <option value="03-ANB">Anib</option>
                    <option value="04-AWYN">Awayan</option>
                    <option value="05-AZCN">Azucena</option>
                    <option value="06-BGNGS">Bagong Sirang</option>
                    <option value="07-BNHN">Binahian</option>
                    <option value="08-BLNRT">Bolo Norte</option>
                    <option value="09-BLSR">Bolo Sur</option>
                    <option value="10-BLN">Bulan</option>
                    <option value="11-BLWN">Bulawan</option>
                    <option value="12-CBY">Cabuyao</option>
                    <option value="13-CM">Caima</option>
                    <option value="14-CLGBN">Calagbangan</option>
                    <option value="15-CLMPN">Calampinay</option>
                    <option value="16-CRYRY">Carayrayan</option>
                    <option value="17-CTM">Cotmo</option>
                    <option value="18-GB">Gabi</option>
                    <option value="19-GNGN">Gaongan</option>
                    <option value="20-IMPG">Impig</option>
                    <option value="21-LPLP">Lipilip</option>
                    <option value="22-LBGNJ">Lubigan Jr.</option>
                    <option value="23-LBGNS">Lubigan Sr.</option>
                    <option value="24-MLGC">Malaguico</option>
                    <option value="25-MLBG">Malubago</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiChevronDown size={16} />
                  </span>
                </div>
                {touched.barangay_id && errors.barangay_id && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.barangay_id}
                  </p>
                )}
              </div>

              {/* Password and Confirm Password - responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                      <FiLock size={18} />
                    </span>
                    <input
                      type="password"
                      name="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClasses('password')}
                      placeholder="Min. 6 characters"
                      disabled={loading}
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <FiX size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                      <FiLock size={18} />
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClasses('confirmPassword')}
                      placeholder="Confirm password"
                      disabled={loading}
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <FiX size={12} />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <FiMapPin size={18} />
                  </span>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your address"
                    required
                    className={getFieldClasses('address')}
                    disabled={loading}
                  />
                  {getFieldStatus('address') === 'success' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <FiCheck size={18} />
                    </span>
                  )}
                  {getFieldStatus('address') === 'error' && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <FiX size={18} />
                    </span>
                  )}
                </div>
                {touched.address && errors.address && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <FiX size={12} />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <FiUserPlus size={20} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Navigation Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a
                  href={window.location.pathname.startsWith('/koletrash') ? '/koletrash/login' : '/login'}
                  className="text-green-600 hover:text-green-700 font-medium transition-colors underline focus:outline-none focus:ring-0"
                >
                  Sign in here
                </a>
              </p>
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Terms and Privacy */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
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
