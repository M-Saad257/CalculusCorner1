import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useContent } from '../context/ContentContext';


const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectSocket } = useSocket();
  const { content } = useContent();

  // Auth mode state
  const [authMode, setAuthMode] = useState('login');

  // Form fields state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bannedInfo, setBannedInfo] = useState(null); // { token, email }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setBannedInfo(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.token && res.data.user) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          connectSocket(res.data.token);
          if (res.data.user.role === 'admin') {
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
        } else {
          throw new Error('Authentication payload missing token or user data');
        }
      } else {
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        // Success flow:
        // 1. Set success message
        setSuccessMessage('Account created successfully!');

        // 2. Switch to login tab
        setAuthMode('login');

        // 3. Keep email and password populated in formData, clear name
        setFormData((prev) => ({
          ...prev,
          name: ''
        }));
      }
    } catch (err) {
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
      if (content.logo.logo_url.startsWith('http')) {
        return content.logo.logo_url;
      }
      return `https://localhost:5173${content.logo.logo_url}`;
    }
    return "/CClogo.png";
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-bg-color overflow-hidden font-sans text-text-primary">
      {/* Decorative gradient blur blobs matching Hero.jsx */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-radial from-primary/10 to-transparent z-0 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-radial from-primary-light/10 to-transparent z-0 pointer-events-none" />

      {/* Subtle Math Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none opacity-20">
        <motion.div
          className="absolute top-[15%] left-[8%] text-6xl md:text-8xl text-primary font-bold opacity-30"
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          ∫
        </motion.div>
        <motion.div
          className="absolute bottom-[15%] right-[8%] text-7xl md:text-9xl text-primary font-bold opacity-30"
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          ∑
        </motion.div>
      </div>

      {/* Back to Home Link */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold z-20"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Main card panel */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8">
        <div className="p-8 md:p-10 rounded-3xl glass flex flex-col gap-6 text-left border border-white/40 shadow-xl bg-white/70 backdrop-blur-xl">

          {/* Logo / Header */}
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="w-auto h-20 flex items-center justify-center mb-2">
              <img
                src={getLogoSrc()}
                alt="Calculus Corner Logo"
                className="h-20 w-auto object-contain mix-blend-multiply"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + "/CClogo.png") {
                    e.target.src = "/CClogo.png";
                  }
                }}
              />
            </div>

            <h2 className="font-display font-black text-2.5xl text-text-primary rounded-full px-4 py-0.5">
              Calculus Corner
            </h2>

            <p className="text-text-secondary text-sm font-sans">
              Empower your mathematical understanding today
            </p>
          </div>

          {/* Premium Tab Toggles */}
          <div className="flex bg-bg-tertiary/75 p-1 rounded-xl border border-border-color">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 border-0 cursor-pointer ${authMode === 'login'
                ? 'bg-white text-text-primary shadow-sm'
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
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 border-0 cursor-pointer ${authMode === 'register'
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-transparent'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Full Name field (Register only) - Animated Transition */}
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
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Full Name</label>
                  <div className="relative mb-0.5">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={authMode === 'register'}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-border-color rounded-xl font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {authMode === 'login' ? 'Email' : 'Email Address'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                  <Mail size={18} />
                </span>
                <input
                  type={authMode === 'login' ? 'text' : 'email'}
                  name="email"
                  placeholder={authMode === 'login' ? 'Enter email' : 'name@example.com'}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/60 border border-border-color rounded-xl font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-11 pr-10 py-3 bg-white/60 border border-border-color rounded-xl font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs md:text-sm font-medium animate-fadeIn">
                <CheckCircle2 className="shrink-0 text-emerald-500" size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs md:text-sm font-medium animate-fadeIn">
                <AlertCircle className="shrink-0 text-red-500" size={18} />
                <span>{error}</span>
              </div>
            )}

            {bannedInfo && (
              <button
                type="button"
                onClick={handleRequestUnban}
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2 text-sm"
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
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
