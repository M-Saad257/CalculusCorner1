import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Link as LinkIcon, AlertCircle, CheckCircle, Film } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { RESOURCE_CATEGORIES } from '../../utils/categories';

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
    category: '',
    subcategory: ''
  });

  const [formError, setFormError] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
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
    setFormData({
      title: video.title || '',
      url: video.url || '',
      videoId: video.videoId || '',
      thumbnail: video.thumbnail || '',
      category: video.category || '',
      subcategory: video.subcategory || ''
    });

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

    // YouTube URL regex
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})([#&?].*)?$/;
    const match = urlVal.match(regex);

    if (!match) {
      setFormError('Invalid YouTube URL format');
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      return;
    }

    const videoId = match[1];
    setIsValidUrl(true);

    // Duplicate check
    const isDuplicate = videos.some(v => v.videoId === videoId && v.id !== editingId);
    if (isDuplicate) {
      setFormError('This video has already been added to the library.');
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      setIsValidUrl(false);
      return;
    }

    setFormData(prev => ({ ...prev, videoId }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url || !formData.videoId || !formData.category) {
      showToast('Please fill out all fields and ensure the YouTube URL is valid.', 'error');
      return;
    }

    try {
      if (editingId === 'new') {
        await api.post('/admin/videos', formData);
        showToast('Video added successfully.', 'success');
      } else {
        await api.put(`/admin/videos/${editingId}`, formData);
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
      category: '',
      subcategory: ''
    });
    setFormError('');
    setIsFetchingMetadata(false);
    setIsValidUrl(false);
  };

  const availableSubcategories = formData.category ? (RESOURCE_CATEGORIES[formData.category] || []) : [];

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Videos</h2>
          <p className="text-slate-500 text-sm mt-1">Manage embed video links for student lecture modules.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map(video => (
            <div key={video.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left">
              <div className="flex flex-col gap-3">
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 group">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-400">
                      <Film size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                     <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full text-sm font-semibold transition-all backdrop-blur-md"
                     >
                       Watch on YouTube
                     </a>
                  </div>
                </div>
                
                <h3 className="font-display font-bold text-base text-slate-800 m-0 line-clamp-2" title={video.title}>{video.title}</h3>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {video.category} {video.subcategory ? `> ${video.subcategory}` : ''}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(video)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(video)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
              <Film size={48} className="text-slate-300" />
              <p>No videos added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100/50">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-800 m-0">
                {editingId === 'new' ? 'Add New Video' : 'Edit Video Details'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-white transition-all cursor-pointer border-0 bg-transparent shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">YouTube URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-4 py-2.5 pl-11 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700 ${formError ? 'border-red-300 focus:border-red-500 bg-red-50/30' : isValidUrl ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:border-primary'}`}
                    required
                  />
                  <LinkIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isValidUrl ? 'text-emerald-500' : 'text-slate-400'}`} size={18} />
                  {isFetchingMetadata && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}
                  {isValidUrl && !isFetchingMetadata && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  )}
                </div>
                {formError && <p className="text-xs text-red-600 font-medium pl-1 mt-1">{formError}</p>}
                {!formError && isValidUrl && formData.videoId && (
                  <p className="text-xs text-emerald-600 font-medium pl-1 mt-1">Valid video ID: {formData.videoId}</p>
                )}
              </div>

              {formData.thumbnail && (
                <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video w-full flex-shrink-0 relative">
                  <img src={formData.thumbnail} alt="Video preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">PREVIEW</div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Video title"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(RESOURCE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 disabled:opacity-50"
                    disabled={!formData.category}
                  >
                    <option value="">Optional</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingId(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!isValidUrl || !!formError || !formData.title || !formData.category}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white border-0 font-semibold text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                  <Save size={16} /> {editingId === 'new' ? 'Add Video' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-slate-100/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg m-0">Remove Video</h3>
                <p className="text-slate-500 text-sm mt-1 mb-0 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-slate-700">"{deleteConfirmName}"</span> from the lecture library?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white border-0 font-semibold text-sm hover:bg-red-700 transition-colors cursor-pointer shadow-sm shadow-red-600/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideos;
