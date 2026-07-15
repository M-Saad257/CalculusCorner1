import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, User, FileText, Play, LogOut, Lock, Settings, Menu, X, CheckCircle, Library, Star, Save, Loader2 } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import NotificationBell from '../../components/ui/NotificationBell';

const ConnectionIndicator = ({ status }) => {
  const statusConfig = {
    connected: { label: 'Connected', dotColor: 'bg-emerald-500 shadow-emerald-500/50', textColor: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    reconnecting: { label: 'Reconnecting', dotColor: 'bg-amber-500 shadow-amber-500/50', textColor: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/20 animate-pulse' },
    offline: { label: 'Offline', dotColor: 'bg-rose-500 shadow-rose-500/50', textColor: 'text-rose-600', bgColor: 'bg-rose-500/10 border-rose-500/20' },
  };

  const current = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm transition-all duration-300 select-none ${current.bgColor} ${current.textColor}`}>
      <span className="relative flex h-1.5 w-1.5">
        {status === 'reconnecting' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotColor}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${current.dotColor}`}></span>
      </span>
      <span>{current.label}</span>
    </div>
  );
};

import ManageCourses from './ManageCourses';
import ManageStudents from './ManageStudents';
import ManageEnrollments from './ManageEnrollments';
import CourseQuizBuilder from './CourseQuizBuilder';
import ManageResources from './ManageResources';
import ManageVideos from './ManageVideos';
import ManageSiteContent from './ManageSiteContent';
import AnalyticsDashboard from './AnalyticsDashboard';
import ManageBooks from './ManageBooks';
import ManageTestimonials from './ManageTestimonials';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' });
  const containerRef = useRef(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ loading: false, error: 'New passwords do not match', success: '' });
      return;
    }
    setPasswordStatus({ loading: true, error: '', success: '' });
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordStatus({ loading: false, error: '', success: res.data.message || 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordStatus({ loading: false, error: err.response?.data?.message || 'Failed to change password', success: '' });
    }
  };

  const { status, emitActivity, disconnectSocket } = useSocket();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Track admin activity
  useEffect(() => {
    emitActivity(location.pathname, 'admin');
  }, [location.pathname, emitActivity]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    navigate('/');
  };

  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full max-w-full bg-bg-secondary overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-bg-color border-r border-border-color flex flex-col shadow-lg z-10 transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-sm shrink-0 text-left ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-border-color">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center shadow-md">
              <Lock className="text-white animate-pulse" size={16} />
            </div>
            <h2 className="font-display font-black text-base text-primary-dark">Admin CMS</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg border-0 bg-transparent cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="grow flex flex-col gap-1">
          <Link
            to="/admin"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${location.pathname === '/admin' || location.pathname === '/admin/analytics'
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/courses"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/courses')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <BookOpen size={18} />
            <span>Manage Courses</span>
          </Link>
          <Link
            to="/admin/books"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/books')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <Library size={18} />
            <span>Manage Books</span>
          </Link>
          <Link
            to="/admin/students"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/students')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <User size={18} />
            <span>Manage Students</span>
          </Link>
          <Link
            to="/admin/enrollments"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/enrollments')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <CheckCircle size={18} />
            <span>Enrollment Requests</span>
          </Link>
          <Link
            to="/admin/resources"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/resources')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <FileText size={18} />
            <span>Manage Resources</span>
          </Link>
          <Link
            to="/admin/videos"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/videos')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <Play size={18} />
            <span>Manage Videos</span>
          </Link>
          <Link
            to="/admin/testimonials"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/testimonials')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <Star size={18} />
            <span>Manage Testimonials</span>
          </Link>
          <Link
            to="/admin/site-content"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 font-semibold transition-all duration-150 ${isLinkActive('/admin/site-content')
              ? 'bg-primary !text-white border-r-4 border-primary-dark'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-primary'
              }`}
          >
            <Settings size={18} />
            <span>Site Settings</span>
          </Link>
        </nav>

        <div className="p-4 px-6 border-t border-border-color">
          <button
            className="flex items-center gap-2 w-full p-2 bg-transparent border-0 text-red-500 font-bold cursor-pointer hover:opacity-85 transition-opacity"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Exit to Site</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="grow flex flex-col overflow-hidden text-left">
        <header className="relative h-20 bg-bg-color border-b border-border-color flex items-center justify-between px-8 py-8 shadow-sm z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-primary hover:bg-bg-tertiary rounded-xl cursor-pointer border-0 bg-transparent"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-sans font-bold text-lg text-text-primary">Admin CMS</h1>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionIndicator status={status} />
            <NotificationBell />
            <div className="flex items-center gap-3 relative">
              <div 
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowAdminMenu(!showAdminMenu)}
              >
                A
              </div>

              {showAdminMenu && (
                <div className="absolute top-12 right-0 w-80 bg-bg-color rounded-2xl shadow-2xl border border-border-color p-5 z-50">
                  <h3 className="font-display font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-primary" /> Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                    <div>
                      <input
                        type="password"
                        required
                        placeholder="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full p-2 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        placeholder="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full p-2 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        placeholder="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full p-2 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                      />
                    </div>

                    {passwordStatus.error && <p className="text-xs text-red-500 font-semibold">{passwordStatus.error}</p>}
                    {passwordStatus.success && <p className="text-xs text-emerald-500 font-semibold">{passwordStatus.success}</p>}

                    <button 
                      type="submit" 
                      disabled={passwordStatus.loading} 
                      className="w-full mt-2 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm border-0 cursor-pointer flex justify-center items-center gap-1.5 transition-colors"
                    >
                      {passwordStatus.loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Change Password
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        <div ref={containerRef} className="grow p-8 overflow-y-scroll overflow-x-clip relative bg-bg-secondary cc-scroll">
          {/* Decorative gradient blur blobs */}
          <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-radial from-primary/5 to-transparent z-0 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] bg-radial from-primary-light/5 to-transparent z-0 pointer-events-none" />

          {/* SVG Math background in layout */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-[10%] left-[8%] w-[150px] h-[150px] opacity-[0.03]">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="100" cy="100" r="80" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5 5" />
                <path d="M100 20 L180 140 L20 140 Z" stroke="var(--color-primary)" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute bottom-[10%] right-[10%] w-[180px] h-[180px] opacity-[0.03]">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect x="40" y="40" width="120" height="120" stroke="var(--color-accent)" strokeWidth="2" transform="rotate(45 100 100)" />
                <ellipse cx="100" cy="100" rx="90" ry="30" stroke="var(--color-accent)" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute top-[25%] right-[12%] text-6xl text-primary-dark opacity-[0.03] font-bold select-none">
              ∫<sub className="text-[0.4em] -ml-2">a</sub><sup className="text-[0.4em]">b</sup> f(x)dx
            </div>
            <div className="absolute bottom-[20%] left-[12%] text-7xl text-primary-dark opacity-[0.03] font-bold select-none">
              ∑ x<sub>i</sub>
            </div>
          </div>

          <div className="relative">
            <Routes>
              <Route path="/" element={<AnalyticsDashboard />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/courses" element={<ManageCourses />} />
              <Route path="/courses/:id/quiz" element={<CourseQuizBuilder />} />
              <Route path="/books" element={<ManageBooks />} />
              <Route path="/students" element={<ManageStudents />} />
              <Route path="/enrollments" element={<ManageEnrollments />} />
              <Route path="/resources" element={<ManageResources />} />
              <Route path="/videos" element={<ManageVideos />} />
              <Route path="/site-content" element={<ManageSiteContent />} />
              <Route path="/testimonials" element={<ManageTestimonials />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

