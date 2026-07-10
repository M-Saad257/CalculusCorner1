import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const STANDARD_CATEGORIES = ['Calculus', 'Trigonometry', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'General'];

const ManageVideos = () => {
  const [videos, setVideos] = useState([]);
  const { showToast } = useDialog();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    videoId: '',
    thumbnail: '',
    category: 'Calculus'
  });

  const [formError, setFormError] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/videos');
      if (res.data && Array.isArray(res.data.data)) {
        setVideos(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchVideos();
    socket.on('video:create', refreshData);
    socket.on('video:update', refreshData);
    socket.on('video:delete', refreshData);
    return () => {
      socket.off('video:create', refreshData);
      socket.off('video:update', refreshData);
      socket.off('video:delete', refreshData);
    };
  }, [socket]);

  const handleEdit = (video) => {
    setEditingId(video.id);
    const isStandard = STANDARD_CATEGORIES.includes(video.category);
    
    setFormData({
      title: video.title || '',
      url: video.url || '',
      videoId: video.videoId || '',
      thumbnail: video.thumbnail || '',
      category: isStandard ? video.category : 'Calculus'
    });

    if (!isStandard && video.category) {
      setShowCustomCategory(true);
      setCustomCategory(video.category);
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
    }

    setFormError('');
    setIsFetchingMetadata(false);
    setIsValidUrl(true);
  };

  const handleDelete = (video) => {
    setDeleteConfirmId(video.id);
    setDeleteConfirmName(video.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/videos/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        showToast('Video deleted successfully.', 'success');
        fetchVideos();
      }
    } catch (err) {
      showToast('Failed to delete video. Please try again.', 'error');
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const handleUrlChange = async (urlVal) => {
    setFormData(prev => ({ ...prev, url: urlVal }));
    setFormError('');
    setIsValidUrl(false);

    if (!urlVal) {
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      return;
    }

    // YouTube URL regex matching youtu.be, watch?v=, embed/, etc. and capturing 11 char ID
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})([#&?].*)?$/;
    const match = urlVal.match(regex);

    if (!match) {
      setFormError('Invalid YouTube URL format');
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      return;
    }

    const videoId = match[1];
    setIsValidUrl(true);

    // Duplicate check client-side
    const isDuplicate = videos.some(v => v.videoId === videoId && v.id !== editingId);
    if (isDuplicate) {
      setFormError('This video has already been added to the library.');
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      setIsValidUrl(false);
      return;
    }

    setFormData(prev => ({ ...prev, videoId }));

    // Fetch metadata
    try {
      setIsFetchingMetadata(true);
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(urlVal)}`);
      const data = await res.json();
      
      if (data.error) {
        const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        setFormData(prev => ({
          ...prev,
          thumbnail: fallbackThumbnail,
          title: prev.title || data.title || 'YouTube Video'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          title: prev.title || data.title || 'YouTube Video'
        }));
      }
    } catch (err) {
      const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      setFormData(prev => ({
        ...prev,
        thumbnail: fallbackThumbnail,
        title: prev.title || 'YouTube Video'
      }));
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleCategoryChange = (val) => {
    if (val === 'custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = showCustomCategory ? (customCategory.trim() || 'Calculus') : formData.category;
    const finalPayload = {
      ...formData,
      category: finalCategory
    };

    if (!finalPayload.title || !finalPayload.url || !finalPayload.videoId) {
      showToast('Please fill out all fields and ensure the YouTube URL is valid.', 'error');
      return;
    }

    try {
      if (editingId === 'new') {
        await api.post('/admin/videos', finalPayload);
        showToast('Video added successfully.', 'success');
      } else {
        await api.put(`/admin/videos/${editingId}`, finalPayload);
        showToast('Video updated successfully.', 'success');
      }
      setEditingId(null);
      fetchVideos();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      title: '',
      url: '',
      videoId: '',
      thumbnail: '',
      category: 'Calculus'
    });
    setFormError('');
    setShowCustomCategory(false);
    setCustomCategory('');
    setIsFetchingMetadata(false);
    setIsValidUrl(false);
  };

  // Form rendered directly inside modal dialog

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Manage Videos</h2>
          <p className="text-text-secondary text-xs md:text-sm">Manage embed video links for student lecture modules.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
        >
          <Plus size={18} /> Add Video
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
          Loading lecture videos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="p-4 rounded-2xl bg-white border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left overflow-hidden">
              <div className="flex flex-col gap-3">
                {/* Thumbnail Preview */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-bg-secondary border border-border-color/60 shadow-sm">
                  <img 
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                    alt={video.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xxs font-extrabold bg-primary/95 text-white shadow-sm uppercase tracking-wider">
                    {video.category || 'Calculus'}
                  </div>
                </div>
                <h3 className="font-display font-bold text-base text-text-primary m-0 line-clamp-2" title={video.title}>{video.title}</h3>
                <a 
                  href={video.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-primary break-all"
                >
                  <LinkIcon size={12} className="shrink-0" />
                  <span className="line-clamp-1">{video.url}</span>
                </a>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-border-color/60">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-secondary text-primary font-bold text-xs rounded-lg hover:bg-primary-light hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleEdit(video)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 font-bold text-xs rounded-lg hover:bg-red-500 hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleDelete(video)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Add/Edit Form */}
      {editingId !== null && (() => {
        const isSaveDisabled = !formData.title.trim() || !formData.url.trim() || !formData.videoId || isFetchingMetadata || !!formError;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">
              
              {/* Header: Sticky */}
              <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
                <h3 className="font-display font-bold text-xl text-text-primary m-0">
                  {editingId === 'new' ? 'Add New Video' : 'Edit Video'}
                </h3>
                <button 
                  onClick={() => setEditingId(null)}
                  className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form wrapper */}
              <form onSubmit={handleSubmit} className="grow flex flex-col overflow-hidden">
                {/* Form Body: Scrollable */}
                <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">
                  {/* URL Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">YouTube URL / Link</label>
                    <div className="relative">
                      <input 
                        type="url" 
                        placeholder="e.g. https://www.youtube.com/watch?v=..." 
                        value={formData.url} 
                        onChange={e => handleUrlChange(e.target.value)} 
                        required 
                        className={`w-full p-3 pr-16 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                          formError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                            : isValidUrl 
                              ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200' 
                              : 'border-border-color focus:border-primary focus:ring-primary/20'
                        }`}
                      />
                      {isFetchingMetadata && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary animate-pulse">
                          Fetching...
                        </span>
                      )}
                    </div>
                    {formError && <p className="text-red-500 text-xs mt-1 font-semibold">{formError}</p>}
                    {isValidUrl && !isFetchingMetadata && !formError && (
                      <p className="text-emerald-600 text-xs mt-1 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Valid YouTube Video</p>
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  {formData.thumbnail && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary uppercase">Thumbnail Preview</label>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-bg-secondary border border-border-color shadow-sm">
                        <img 
                          src={formData.thumbnail} 
                          alt="Video Thumbnail" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Title Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Video Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Limits & Derivatives" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      required 
                      className="w-full p-3 border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Category</label>
                    <select
                      value={showCustomCategory ? 'custom' : formData.category}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="w-full p-3 border border-border-color rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      {STANDARD_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">Other (Custom Category)</option>
                    </select>
                  </div>

                  {/* Custom Category Input */}
                  {showCustomCategory && (
                    <div className="flex flex-col gap-1 animate-fadeIn">
                      <label className="text-xs font-bold text-text-secondary uppercase">Custom Category Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Integration" 
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)} 
                        required 
                        maxLength={50}
                        className="w-full p-3 border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  )}
                </div>

                {/* Footer: Sticky */}
                <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                  <button 
                    type="submit" 
                    disabled={isSaveDisabled}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all ${
                      isSaveDisabled 
                        ? 'bg-slate-300 cursor-not-allowed opacity-60' 
                        : 'bg-primary hover:bg-primary-dark'
                    }`}
                  >
                    <Save size={16} /> {editingId === 'new' ? 'Save' : 'Update'}
                  </button>
                  <button 
                    type="button" 
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 border-0 grow cursor-pointer transition-all" 
                    onClick={() => setEditingId(null)}
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-border-color flex flex-col gap-4 text-left animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle size={24} />
            </div>
            
            <h3 className="font-display font-bold text-lg text-text-primary">
              Confirm Deletion
            </h3>
            
            <p className="text-text-secondary text-sm leading-relaxed">
              Are you sure you want to permanently delete the video <span className="font-semibold text-text-primary">"{deleteConfirmName}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleConfirmDelete} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
              >
                Delete Video
              </button>
              <button 
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary hover:bg-slate-200 text-text-secondary font-bold text-sm rounded-lg border-0 grow cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideos;
