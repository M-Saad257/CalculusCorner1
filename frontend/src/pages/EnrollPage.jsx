import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, Sparkles, CheckCircle2, KeyRound, GraduationCap, Upload } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useContent } from '../context/ContentContext';
import { RESOURCE_CATEGORIES } from '../utils/categories';

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

const EnrollPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectSocket } = useSocket();
  const { content } = useContent();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP
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
    // If already logged in, redirect
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0 && step === 2) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer, step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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

    // Upload profile photo if present
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
    navigate('/dashboard');
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
      return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }
    return "/official.webp";
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-bg-color overflow-hidden font-sans text-text-primary">
      <MathNodesBackground />

      {/* Back to Home Link */}
      <button
        onClick={() => {
          if (step === 2) {
            setStep(1);
            setError('');
            setSuccessMessage('');
          } else {
            navigate('/');
          }
        }}
        className="absolute top-4 left-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold z-20"
      >
        <ArrowLeft size={16} />
        {step === 2 ? 'Back to Form' : 'Back to Home'}
      </button>

      {/* Main card panel */}
      <div className="relative z-10 w-full max-w-3xl mx-4 my-auto max-h-[94vh] overflow-y-auto rounded-3xl border border-border-color shadow-xl bg-bg-color/90 backdrop-blur-xl">
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          {/* LEFT COLUMN: Logo & Avatar Drop Zone */}
          <div className="md:col-span-5 flex flex-col gap-4 items-center text-center border-b md:border-b-0 md:border-r border-border-color/60 pb-5 md:pb-0 md:pr-6">
            <div className="w-auto h-14 flex items-center justify-center">
              <img
                src={getLogoSrc()}
                alt="Calculus Corner Logo"
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + "/official.webp") {
                    e.target.src = "/official.webp";
                  }
                }}
              />
            </div>

            <div>
              <h2 className="font-display font-black text-2xl tracking-tight text-text-primary">
                Calculus Corner
              </h2>
              <p className="text-text-secondary text-xs font-semibold mt-1">
                {step === 2 ? 'Verify your email address' : 'Create student workspace'}
              </p>
            </div>

            {/* Profile Photo (only in Step 1) */}
            {step === 1 && (
              <div className="flex flex-col gap-1 w-full max-w-[150px]">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Profile Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="group border border-dashed border-border-color hover:border-primary bg-bg-secondary/15 hover:bg-primary/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 relative overflow-hidden aspect-square w-full"
                >
                  {avatarPreview ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden border border-border-color shadow-sm">
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <>
                      <Upload size={16} className="text-text-tertiary group-hover:text-primary transition-colors animate-pulse" />
                      <span className="text-[9px] font-semibold text-text-secondary group-hover:text-primary transition-colors text-center">Upload Photo</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Form Inputs */}
          <div className="md:col-span-7 flex flex-col gap-3.5">
            {/* Validation Alerts */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold animate-fadeIn">
                <AlertCircle size={15} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 size={15} className="shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-3">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-transparent border border-border-color rounded-full font-sans text-xs text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Class Select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-3">Class / Grade *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary z-10">
                        <GraduationCap size={15} />
                      </span>
                      <select
                        name="class"
                        value={formData.class}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-8 py-2 bg-transparent border border-border-color rounded-full font-sans text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-text-primary dark:bg-slate-900 bg-white">-- Select Class --</option>
                        {Object.keys(RESOURCE_CATEGORIES).map(cat => (
                          <option key={cat} value={cat} className="text-text-primary dark:bg-slate-900 bg-white">
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-text-tertiary">
                        <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-3">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-3 py-2 bg-transparent border border-border-color rounded-full font-sans text-xs text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-3">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Choose password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-8 py-2 bg-transparent border border-border-color rounded-full font-sans text-xs text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-xs rounded-full transition-all duration-300 shadow-md shadow-primary/20 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Enroll Now</span>
                </button>

                <div className="mt-2 text-center">
                  <span className="text-[11px] text-text-secondary font-medium">Already have an account? </span>
                  <Link to="/auth" className="text-[11px] text-primary hover:underline font-bold transition-all">Sign In</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-3">Verification Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-tertiary">
                      <KeyRound size={15} />
                    </span>
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter 6-digit OTP code"
                      value={formData.otp}
                      onChange={handleInputChange}
                      required
                      maxLength={6}
                      className="w-full pl-10 pr-3 py-2.5 bg-transparent border border-border-color rounded-full font-sans text-xs text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-xs rounded-full transition-all duration-300 shadow-md shadow-primary/20 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Verify & Complete Registration</span>
                </button>

                <div className="flex justify-between items-center mt-2 px-1">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || isLoading}
                    className="text-[11px] font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer disabled:opacity-50"
                  >
                    Resend Verification Code
                  </button>
                  {resendTimer > 0 && (
                    <span className="text-[11px] text-text-secondary font-semibold">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EnrollPage;
