import React, { useState, useRef } from 'react';
import { Edit3, Save, Medal, Sparkles, Clock, CheckCircle, GraduationCap, X, Loader2, Camera, Upload, Flame, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useContent } from '../../context/ContentContext';

const SimpleCropper = ({ imageSrc, onCrop, onCancel }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // Load actual image dimensions once
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.width, h: img.height });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute scaled size to explicitly size the img tag
  const scaleToCover = imgSize.w ? Math.max(256 / imgSize.w, 256 / imgSize.h) : 1;
  const scaledWidth = imgSize.w * scaleToCover;
  const scaledHeight = imgSize.h * scaleToCover;

  // Enforce boundary limits so the image cannot be dragged out of the view
  React.useEffect(() => {
    if (imgSize.w > 0) {
      const minX = 128 - scaledWidth / 2;
      const maxX = scaledWidth / 2 - 128;
      const minY = 128 - scaledHeight / 2;
      const maxY = scaledHeight / 2 - 128;
      
      setOffset(prev => ({
        x: Math.max(minX, Math.min(maxX, prev.x)),
        y: Math.max(minY, Math.min(maxY, prev.y))
      }));
    }
  }, [scaledWidth, scaledHeight, imgSize.w]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    let newX = e.clientX - startPos.x;
    let newY = e.clientY - startPos.y;
    
    if (imgSize.w > 0) {
      const minX = 128 - scaledWidth / 2;
      const maxX = scaledWidth / 2 - 128;
      const minY = 128 - scaledHeight / 2;
      const maxY = scaledHeight / 2 - 128;
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }
    
    setOffset({ x: newX, y: newY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleCrop = () => {
    if (!imgSize.w) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cx = (256 - scaledWidth) / 2 + offset.x;
      const cy = (256 - scaledHeight) / 2 + offset.y;
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, cx, cy, scaledWidth, scaledHeight);
      
      canvas.toBlob((blob) => {
        onCrop(blob);
      }, 'image/jpeg', 0.9);
    };
    img.src = imageSrc;
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-sm flex flex-col items-center shadow-2xl">
        <h3 className="font-display font-bold text-lg mb-2 text-text-primary">Crop Profile Photo</h3>
        <p className="text-xs text-text-secondary mb-6 text-center">Drag to position the image.</p>
        
        <div 
          className="w-64 h-64 border-4 border-primary/20 border-dashed rounded-full overflow-hidden relative cursor-move shadow-inner bg-slate-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })}
          onTouchMove={(e) => handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })}
          onTouchEnd={handleMouseUp}
        >
          {imgSize.w > 0 && (
            <img 
              src={imageSrc} 
              alt="Crop" 
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
        
        <div className="flex gap-3 w-full mt-8">
          <Button variant="secondary" onClick={onCancel} className="flex-1 py-2.5 text-xs font-bold border border-border-color shadow-sm">Cancel</Button>
          <Button variant="primary" onClick={handleCrop} className="flex-1 py-2.5 text-xs font-bold shadow-sm">Save Photo</Button>
        </div>
      </div>
    </div>
  );
};

const ProfileTab = ({
  student,
  setStudent,
  isEditingProfile,
  setIsEditingProfile,
  avatar,
  setAvatar,
  bio,
  setBio,
  handleUpdateProfile,
  studentBanned,
  hasPendingRequest,
  unbanRequest,
  unbanSubmitting,
  unbanError,
  unbanSuccess,
  submitUnbanRequest,
  courses,
  enrolledCourses,
  videos,
  resources,
  stats,
  timeline
}) => {
  const { content } = useContent();
  const visibility = content?.visibility || {};
  const showCourses = visibility.courses !== false;
  const showLectures = visibility.lectures !== false;
  const showNotes = visibility.notes !== false;

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const avatarInputRef = useRef(null);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const togglePass = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    setAvatarError('');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 20 MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImageSrc(ev.target.result);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob) => {
    setCropImageSrc(null);
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    
    const previewUrl = URL.createObjectURL(blob);
    setAvatarPreview(previewUrl);

    setAvatarUploading(true);
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/student/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setAvatar(`${res.data.avatar_url}`);
        if (res.data.data) {
          setStudent(res.data.data);
        } else {
          setStudent(prev => ({ ...prev, avatar: res.data.avatar_url }));
        }
      }
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn text-left">
      {/* Left Section - Profile Card */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border-color p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
          {/* Decorative background gradient */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-primary/10 via-primary-light/5 to-transparent"></div>

          <div className="relative mt-8">
            <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-3xl text-primary overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : student?.avatar ? (
                <img src={student.avatar.startsWith('http') ? student.avatar : `${student.avatar}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                student?.name ? student.name.charAt(0).toUpperCase() : 'S'
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <h3 className="font-display font-bold text-xl text-text-primary mt-4">{student?.name || 'Student'}</h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-primary border border-indigo-100 rounded-full mt-1.5">
            {student?.role ? student.role.charAt(0).toUpperCase() + student.role.slice(1) : 'Student Member'}
          </span>

          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="w-full flex flex-col gap-4 mt-6">
              {/* Avatar Upload */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Profile Photo</label>
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-primary/40 hover:border-primary bg-bg-secondary flex items-center justify-center cursor-pointer overflow-hidden transition-colors group relative"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : student?.avatar ? (
                      <img src={student.avatar.startsWith('http') ? student.avatar : `${student.avatar}`} alt="Current" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <Camera size={20} className="text-text-tertiary group-hover:text-primary transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  {avatarUploading && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary text-text-secondary text-xs font-bold rounded-lg transition-all">
                      <Loader2 size={12} className="animate-spin text-primary" />
                      Uploading...
                    </div>
                  )}
                  {avatarError && <p className="text-xs text-red-500 font-semibold">{avatarError}</p>}
                  <p className="text-xxs text-text-tertiary">JPG, PNG, WEBP up to 20 MB</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Student Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                  rows={4}
                  placeholder="Share your learning goals..."
                />
              </div>
              <div className="flex gap-2 w-full mt-2">
                <Button type="submit" className="grow py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer">
                  <Save size={14} className="mr-1 inline" /> Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditingProfile(false)}
                  className="py-2.5 text-xs font-bold shadow-sm cursor-pointer border border-border-color bg-transparent hover:bg-bg-secondary grow"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="w-full flex flex-col items-center mt-6">
              <p className="text-text-secondary text-sm text-center italic leading-relaxed px-2">
                "{student?.bio || 'No bio set yet. Click Edit Profile to tell us about your calculus learning goals!'}"
              </p>

              <div className="w-full border-t border-border-color/60 my-5 pt-5 flex flex-col gap-3.5 text-xs font-semibold text-text-secondary text-left">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Email:</span>
                  <span className="text-text-primary font-medium">{student?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Join Date:</span>
                  <span className="text-text-primary font-medium">{student?.createdAt ? new Date(student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'June 2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Status:</span>
                  <span className={`${studentBanned ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-500 bg-emerald-50'} inline-flex px-2.5 py-1 rounded-full text-xxs font-extrabold uppercase`}>{studentBanned ? 'Banned Account' : 'Active Account'}</span>
                </div>
              </div>

              {studentBanned && (
                <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                  <p className="text-sm font-semibold">Your account is currently banned.</p>
                  <p className="text-sm text-red-700/80 mt-2">If you believe this was a mistake, submit an unban request for review.</p>
                  <div className="mt-4 space-y-3 text-xs text-text-secondary">
                    <div>
                      <span className="font-semibold">Reason:</span> {student?.banReason || 'No reason provided.'}
                    </div>
                    {hasPendingRequest ? (
                      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 p-4 text-sm text-text-secondary">
                        <p className="font-semibold text-amber-700">Appeal Status: Pending Review</p>
                        {unbanRequest && (
                          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mt-2">Submitted: {new Date(unbanRequest.created_at || unbanRequest.createdAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 text-left">
                        {unbanRequest && unbanRequest.status === 'rejected' && (
                          <div className="rounded-2xl bg-red-100 border border-red-200 p-4 text-sm text-red-800">
                            <p className="font-semibold text-red-700">Previous Appeal Rejected</p>
                          </div>
                        )}

                        <button
                          onClick={() => submitUnbanRequest()}
                          disabled={unbanSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer border-0 disabled:opacity-50"
                        >
                          {unbanSubmitting ? 'Submitting Request...' : 'Request Unban'}
                        </button>

                        {unbanError && <div className="text-xs text-red-600 font-semibold mt-2">{unbanError}</div>}
                        {unbanSuccess && <div className="text-xs text-emerald-600 font-semibold mt-2">{unbanSuccess}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditingProfile(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border-color bg-transparent hover:bg-bg-secondary text-text-secondary font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Security / Password Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border-color p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Security
          </h3>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full p-2.5 pr-10 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                />
                <button
                  type="button"
                  onClick={() => togglePass('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                  tabIndex={-1}
                >
                  {showPasswords.current ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full p-2.5 pr-10 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                />
                <button
                  type="button"
                  onClick={() => togglePass('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                  tabIndex={-1}
                >
                  {showPasswords.new ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full p-2.5 pr-10 text-sm border border-border-color rounded-xl focus:outline-none focus:border-primary bg-bg-secondary/30"
                />
                <button
                  type="button"
                  onClick={() => togglePass('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {passwordStatus.error && <p className="text-xs text-red-500 font-semibold">{passwordStatus.error}</p>}
            {passwordStatus.success && <p className="text-xs text-emerald-500 font-semibold">{passwordStatus.success}</p>}

            <Button type="submit" disabled={passwordStatus.loading} className="w-full mt-2 py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer flex justify-center items-center gap-1.5">
              {passwordStatus.loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Change Password
            </Button>
          </form>
        </div>

      </div>

      {/* Right Section - Statistics and Activity */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Learning Statistics Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border-color p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg text-text-primary mb-5">Learning Progress & Overview</h3>

          {(() => {
            const visibleCount = [showCourses, showLectures, showNotes].filter(Boolean).length;
            const gridClass =
              visibleCount === 1 ? 'grid-cols-1' :
              visibleCount === 2 ? 'grid-cols-2' :
              'grid-cols-3';
            return (
              <div className={`grid grid-cols-1 sm:${gridClass} gap-4`}>
                {showCourses && (
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-left">
                    <span className="text-xxs font-extrabold uppercase text-primary">Enrolled Courses</span>
                    <p className="font-display font-black text-2xl text-text-primary mt-1">{enrolledCourses?.length || 0}</p>
                  </div>
                )}

                {showLectures && (
                  <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-left">
                    <span className="text-xxs font-extrabold uppercase text-violet-400">Videos Available</span>
                    <p className="font-display font-black text-2xl text-text-primary mt-1">{videos.length}</p>
                  </div>
                )}

                {showNotes && (
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-left">
                    <span className="text-xxs font-extrabold uppercase text-emerald-400">Formula Sheets</span>
                    <p className="font-display font-black text-2xl text-text-primary mt-1">{resources.length}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {showCourses && (
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 p-4 bg-bg-secondary/40 rounded-2xl border border-border-color/60">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-bg-tertiary"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeWidth="3.5"
                    strokeDasharray={`${stats.completion}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display font-black text-base text-text-primary">{stats.completion}%</span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-bold text-text-primary text-sm">Overall Course Progress</h4>
                <p className="text-xs text-text-tertiary mt-1">
                  You've completed <strong className="text-primary">{stats.completion}%</strong> of your active courses. Keep it up!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log & Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border-color p-6 shadow-sm flex-1">
          <h3 className="font-display font-bold text-lg text-text-primary mb-4">Activity Timeline</h3>

          <div className="flex flex-col gap-4">
            {timeline.length === 0 ? (
              <div className="p-6 text-sm text-text-secondary bg-bg-secondary rounded-2xl">No recent activity yet. Start a quiz or watch a lesson to populate your timeline.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {timeline.map((ev, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-1.5 bg-primary/20 rounded-full relative my-1 shrink-0">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold text-text-tertiary">
                        <span>{ev.title}</span>
                        <span>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-text-secondary text-xs mt-0.5 font-medium">{ev.description}</p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-border-color/60 flex items-center justify-between text-xs font-bold text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span>Last Login: {student?.last_login ? new Date(student.last_login).toLocaleString() : 'Now'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {cropImageSrc && (
        <SimpleCropper 
          imageSrc={cropImageSrc} 
          onCrop={handleCropComplete} 
          onCancel={() => setCropImageSrc(null)} 
        />
      )}
    </div>
  );
};

export default ProfileTab;
