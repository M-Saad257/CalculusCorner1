import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useContent } from '../context/ContentContext';

const MathNodesBackground = () => {
  const nodes = [
    { id: 1, x: 15, y: 20, symbol: '∫' },
    { id: 2, x: 80, y: 15, symbol: '∑' },
    { id: 3, x: 50, y: 50, symbol: 'π' },
    { id: 4, x: 20, y: 70, symbol: '∞' },
    { id: 5, x: 85, y: 80, symbol: '√' },
    { id: 6, x: 35, y: 85, symbol: '∂' },
    { id: 7, x: 65, y: 30, symbol: 'θ' },
  ];

  const connections = [
    [1, 3], [3, 2], [3, 4], [4, 6], [3, 7], [7, 2], [3, 5], [5, 7]
  ];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.12] dark:opacity-10">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {connections.map(([n1, n2], i) => {
          const p1 = nodes.find(n => n.id === n1);
          const p2 = nodes.find(n => n.id === n2);
          return (
            <motion.line
              key={i}
              x1={`${p1.x}%`} y1={`${p1.y}%`}
              x2={`${p2.x}%`} y2={`${p2.y}%`}
              stroke="var(--color-primary)" strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute text-5xl md:text-7xl text-text-primary font-serif font-bold transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{
            y: [-5, 5, -5],
          }}
          transition={{
            duration: 6 + (node.id % 4),
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative flex items-center justify-center">
             <span className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-[40px] opacity-30"></span>
             <span className="absolute bg-[var(--color-primary)] w-3 h-3 rounded-full shadow-[0_0_10px_var(--color-primary)] z-10" style={{ right: '-15px', top: '-5px' }}></span>
             {node.symbol}
          </div>
        </motion.div>
      ))}
      
      {/* Decorative Mountains/Polygons at bottom */}
      <svg className="absolute bottom-0 left-0 w-full h-auto text-primary/5" viewBox="0 0 1440 320" fill="currentColor" preserveAspectRatio="none">
        <path d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,213.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectSocket } = useSocket();
  const { content } = useContent();

  // Auth mode state: 'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password'
  const [authMode, setAuthMode] = useState('login');

  // Form fields state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bannedInfo, setBannedInfo] = useState(null); // { token, email }
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // If already logged in, send to correct dashboard directly
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          const fromState = location.state?.redirectTo;
          const fromQuery = new URLSearchParams(location.search).get("redirect");
          let target = fromState || fromQuery || '/dashboard';
          if (target.startsWith('http://') || target.startsWith('https://')) {
            try {
              const url = new URL(target);
              target = url.pathname + url.search + url.hash;
            } catch (e) {
              target = '/dashboard';
            }
          }
          if (target === '/auth' || target === '/login') {
            target = '/dashboard';
          }
          navigate(target);
        }
      } catch (err) {
        navigate('/dashboard');
      }
    }
  }, [navigate, location]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0 && (authMode === 'otp' || authMode === 'reset_password')) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer, authMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (bannedInfo) {
      setBannedInfo(null);
    }
  };

  const executeLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    connectSocket(data.token);
    if (data.user.role === 'admin') {
      navigate('/admin');
    } else {
      const fromState = location.state?.redirectTo;
      const fromQuery = new URLSearchParams(location.search).get("redirect");
      let target = fromState || fromQuery || '/dashboard';
      if (target.startsWith('http://') || target.startsWith('https://')) {
        try {
          const url = new URL(target);
          target = url.pathname + url.search + url.hash;
        } catch (e) {
          target = '/dashboard';
        }
      }
      if (target === '/auth' || target === '/login') {
        target = '/dashboard';
      }
      navigate(target);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setBannedInfo(null);

    // Frontend validations
    if (authMode === 'reset_password') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.token && res.data.user) {
          executeLoginSuccess(res.data);
        } else {
          throw new Error('Authentication payload missing token or user data');
        }
      } else if (authMode === 'register') {
        const res = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (res.data.requireOTP) {
          setAuthMode('otp');
          setResendTimer(60);
          setSuccessMessage('Account created! A verification code has been sent to your email.');
        } else if (res.data.token && res.data.user) {
          // Fallback if OTP is disabled backend
          executeLoginSuccess(res.data);
        }
      } else if (authMode === 'otp') {
        const res = await api.post('/auth/verify-otp', {
          email: formData.email,
          otp: formData.otp
        });

        if (res.data.token && res.data.user) {
          executeLoginSuccess(res.data);
        }
      } else if (authMode === 'forgot_password') {
        const res = await api.post('/auth/forgot-password', {
          email: formData.email
        });
        setAuthMode('reset_password');
        setResendTimer(60);
        setSuccessMessage(res.data.message || 'If that email exists, a reset code has been sent.');
      } else if (authMode === 'reset_password') {
        const res = await api.post('/auth/reset-password', {
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.password
        });
        setAuthMode('login');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
        setSuccessMessage(res.data.message || 'Password reset successfully. You can now log in.');
      }
    } catch (err) {
      // Handle the 403 requireOTP response from login
      if (err.response?.status === 403 && err.response?.data?.requireOTP) {
        setAuthMode('otp');
        setResendTimer(60); 
        setError('');
        setSuccessMessage(err.response.data.message || 'Please verify your email to continue.');
        return;
      }

      setError(err.response?.data?.message || err.message || 'Authentication operation failed');
      if (err.response?.status === 403 && err.response?.data?.isBanned) {
        setBannedInfo({
          token: err.response.data.token,
          email: formData.email
        });
      }
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
      setSuccessMessage(res.data.message || 'Verification code resent successfully.');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestUnban = async () => {
    if (!bannedInfo) return;
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.post('/student/unban-request', {
        message: 'Automatic appeal submitted via login page ban warning.',
        reason: 'other',
        additionalExplanation: 'The user clicked "Request Unban" on the login page.'
      }, {
        headers: {
          Authorization: `Bearer ${bannedInfo.token}`
        }
      });
      setSuccessMessage('Unban request submitted successfully. The admin team will review it shortly.');
      setBannedInfo(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit unban request');
    } finally {
      setIsLoading(false);
    }
  };

  const getLogoSrc = () => {
    if (content?.logo?.logo_url) {
      let url = content.logo.logo_url;
      url = url.replace('localost', 'localhost');
      if (url.startsWith('http')) {
        return url;
      }
      if (!url.startsWith('/')) {
        url = `/uploads/logo/${url}`;
      }
      return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${url}`;
    }
    return "/CClogo.png";
  };

  const getHeaderSubtext = () => {
    if (authMode === 'otp') return 'Secure Verification';
    if (authMode === 'forgot_password') return 'Reset your password';
    if (authMode === 'reset_password') return 'Enter new password';
    return 'Empower your mathematical understanding today';
  };

  const getSubmitButtonText = () => {
    if (authMode === 'login') return 'Sign In';
    if (authMode === 'register') return 'Create Account';
    if (authMode === 'otp') return 'Verify & Continue';
    if (authMode === 'forgot_password') return 'Send Reset Code';
    if (authMode === 'reset_password') return 'Reset Password';
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-bg-color overflow-hidden font-sans text-text-primary">
      
      <MathNodesBackground />

      {/* Back to Home Link */}
      <button
        onClick={() => {
          if (authMode === 'otp' || authMode === 'forgot_password' || authMode === 'reset_password') {
            setAuthMode('login');
            setError('');
            setSuccessMessage('');
          } else {
            navigate('/');
          }
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold z-20"
      >
        <ArrowLeft size={16} />
        {authMode === 'otp' || authMode === 'forgot_password' || authMode === 'reset_password' ? 'Back to Login' : 'Back to Home'}
      </button>

      {/* Main card panel */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8">
        <div className="p-8 md:p-10 rounded-3xl flex flex-col gap-6 text-left border border-border-color shadow-xl bg-bg-color/90 backdrop-blur-xl">

          {/* Logo / Header */}
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="w-auto h-20 flex items-center justify-center mb-2">
              <img
                src={getLogoSrc()}
                alt="Calculus Corner Logo"
                className="h-20 w-auto object-contain dark:invert"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + "/CClogo.png") {
                    e.target.src = "/CClogo.png";
                  }
                }}
              />
            </div>

            <h2 className="font-display font-black text-3xl tracking-tight text-text-primary">
              Calculus Corner
            </h2>

            <p className="text-text-secondary text-sm font-medium">
              {getHeaderSubtext()}
            </p>
          </div>

          {/* Premium Tab Toggles (hidden in OTP/Forgot/Reset modes) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex bg-bg-tertiary p-1.5 rounded-full border border-border-color">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 border-0 cursor-pointer ${authMode === 'login'
                  ? 'bg-bg-color text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary bg-transparent'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 border-0 cursor-pointer ${authMode === 'register'
                  ? 'bg-bg-color text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary bg-transparent'
                  }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Registration & Login Fields */}
            {(authMode === 'login' || authMode === 'register' || authMode === 'forgot_password') && (
              <>
                <AnimatePresence mode="wait">
                  {authMode === 'register' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col gap-1.5 overflow-hidden"
                    >
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Full Name</label>
                      <div className="relative mb-0.5">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                          <User size={18} />
                        </span>
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required={authMode === 'register'}
                          className="w-full pl-12 pr-4 py-3 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">
                    {authMode === 'login' ? 'Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                      <Mail size={18} />
                    </span>
                    <input
                      type={(authMode === 'login' || authMode === 'forgot_password') ? 'text' : 'email'}
                      name="email"
                      placeholder={(authMode === 'login' || authMode === 'forgot_password') ? 'Enter email' : 'name@example.com'}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {(authMode === 'login' || authMode === 'register') && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pl-4 pr-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Password</label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot_password');
                            setError('');
                            setSuccessMessage('');
                          }}
                          className="text-[11px] font-bold text-[var(--color-primary)] hover:text-primary-dark transition-colors bg-transparent border-0 cursor-pointer p-0"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-12 py-3 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0B132B]/40 hover:text-text-primary/40 dark:hover:text-[#FDFBF7] bg-transparent border-0 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* OTP Verification / Reset Password Fields */}
            {(authMode === 'otp' || authMode === 'reset_password') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
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
                        setFormData((prev) => ({ ...prev, otp: val }));
                      }}
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-transparent border border-border-color rounded-full font-sans text-lg text-center tracking-[0.5em] font-bold text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                    />
                  </div>
                  <p className="text-xs text-text-secondary text-center mt-1">
                    We sent a code to <span className="font-semibold text-text-primary">{formData.email}</span>
                  </p>
                </div>

                {authMode === 'reset_password' && (
                  <>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">New Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                          <Lock size={18} />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Enter new password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-12 py-3 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0B132B]/40 hover:text-text-primary/40 dark:hover:text-[#FDFBF7] bg-transparent border-0 cursor-pointer transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-4">Confirm New Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary">
                          <Lock size={18} />
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirm new password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-12 py-3 bg-transparent border border-border-color rounded-full font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0B132B]/40 hover:text-text-primary/40 dark:hover:text-[#FDFBF7] bg-transparent border-0 cursor-pointer transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs md:text-sm font-medium animate-fadeIn text-left mt-2">
                <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs md:text-sm font-medium animate-fadeIn text-left mt-2">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            {bannedInfo && (
              <button
                type="button"
                onClick={handleRequestUnban}
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full transition-all duration-300 shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Submitting Appeal...</span>
                  </>
                ) : (
                  <span>Request Unban</span>
                )}
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || ((authMode === 'otp' || authMode === 'reset_password') && formData.otp.length < 6)}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-0 cursor-pointer flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Please wait...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {getSubmitButtonText()}
                  {(authMode === 'login' || authMode === 'register') && (
                    <motion.span 
                      className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </motion.span>
                  )}
                </span>
              )}
            </button>

            {/* Resend OTP Button */}
            {(authMode === 'otp' || authMode === 'reset_password') && (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading || resendTimer > 0}
                className="mt-2 py-2 text-sm font-medium text-text-secondary hover:text-[var(--color-primary)] transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
              </button>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
