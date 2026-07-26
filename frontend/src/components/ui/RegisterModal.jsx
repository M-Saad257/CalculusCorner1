import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, GraduationCap, Eye, EyeOff, Loader2, Upload, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { RESOURCE_CATEGORIES } from '../../utils/categories';

const RegisterModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const navigate = useNavigate();
  const { connectSocket } = useSocket();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    class: '',
    otp: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setStep(1);
      setError('');
      setSuccessMessage('');
      setAvatarFile(null);
      setAvatarPreview(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        class: '',
        otp: ''
      });
    };
    window.addEventListener('open-register-modal', handleOpen);
    return () => window.removeEventListener('open-register-modal', handleOpen);
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0 && step === 2) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer, step]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Profile picture must be under 20 MB.');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Profile picture must be under 20 MB.');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.class) {
      setError('Please select your Class / Grade.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        class: formData.class
      });

      if (res.data.requireOTP) {
        setStep(2);
        setResendTimer(60);
        setSuccessMessage('Verification code sent to your email address.');
      } else if (res.data.token && res.data.user) {
        // Fallback login
        await handleLoginSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: formData.otp
      });

      if (res.data.token && res.data.user) {
        await handleLoginSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/resend-otp', { email: formData.email });
      setSuccessMessage(res.data.message || 'Verification code resent.');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (authData) => {
    const { token, user } = authData;

    // If there is an avatar file, upload it first before moving to dashboard
    if (avatarFile) {
      const uploadForm = new FormData();
      uploadForm.append('avatar', avatarFile);
      try {
        const uploadRes = await api.post('/student/profile/avatar', uploadForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        if (uploadRes.data && uploadRes.data.avatar_url) {
          user.avatar = uploadRes.data.avatar_url;
        }
      } catch (uploadErr) {
        console.error('Failed to upload profile picture avatar:', uploadErr);
      }
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    connectSocket(token);
    setIsOpen(false);
    navigate('/dashboard');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
      className="fixed inset-0 z-102 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(37, 99, 235, 0.25);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.45);
        }
      `}</style>
      <div className="relative z-100 w-full max-w-md bg-bg-color border border-border-color rounded-3xl shadow-2xl p-5 md:p-6 overflow-y-auto max-h-[92vh] custom-scrollbar cursor-default">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-border-color/30 w-8 h-8 rounded-full flex items-center justify-center transition-colors border-0 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <GraduationCap className="mx-auto text-primary mb-1" size={32} />
          <h2 className="font-display font-extrabold text-xl text-text-primary">
            {step === 1 ? 'Start Your Math Journey' : 'Verify Your Email'}
          </h2>
          <p className="text-text-secondary text-xs font-medium mt-1">
            {step === 1 
              ? 'Enroll now to access top video lessons, formula sheets, and expert math tools.' 
              : `Enter the 6-digit verification code sent to ${formData.email}.`}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs md:text-sm font-medium mb-4 text-left">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs md:text-sm font-medium mb-4 text-left">
            <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Multi-step Container */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="register-form"
              onSubmit={handleRegisterSubmit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-3 text-left"
            >
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center gap-1.5 mb-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest self-start pl-2">Profile Picture</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-border-color bg-bg-secondary flex flex-col items-center justify-center overflow-hidden cursor-pointer relative group hover:border-primary/50 transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-text-tertiary gap-1 text-center p-2">
                      <Upload size={18} className="group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-bold">Upload / Drop</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Class Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Class / Grade *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary z-10">
                    <GraduationCap size={18} />
                  </span>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-10 py-2.5 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="text-text-primary dark:bg-slate-900 bg-white">-- Select Your Class / Grade --</option>
                    {Object.keys(RESOURCE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat} className="text-text-primary dark:bg-slate-900 bg-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-tertiary">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-12 py-2.5 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-primary dark:text-white/70 dark:hover:text-white bg-transparent border-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-1.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed border-0 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <span>Submit Enrollment</span>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="otp-form"
              onSubmit={handleVerifyOTP}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-4 text-center"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center">
                  Verification Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={formData.otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setFormData(prev => ({ ...prev, otp: val }));
                    }}
                    required
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-transparent border border-border-color rounded-full font-sans text-lg text-center tracking-[0.5em] font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || formData.otp.length < 6}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-70 border-0 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Enter Dashboard</span>
                )}
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading || resendTimer > 0}
                className="py-2 text-sm font-medium text-text-secondary hover:text-primary bg-transparent border-0 cursor-pointer disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default RegisterModal;
