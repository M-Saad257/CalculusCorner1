import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Upload, AlertCircle, Loader2, Eye, Download,
         FileCode2, FileSpreadsheet, FileArchive, Image, Film, Music, FileJson, File } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', category: '' });
  const [file, setFile] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/resources');
      if (res.data && Array.isArray(res.data.data)) {
        setResources(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchResources();
    socket.on('resource:create', refreshData);
    socket.on('resource:update', refreshData);
    socket.on('resource:delete', refreshData);
    return () => {
      socket.off('resource:create', refreshData);
      socket.off('resource:update', refreshData);
      socket.off('resource:delete', refreshData);
    };
  }, [socket]);

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setFormData({
      title: resource.title || '',
      category: resource.category || 'General'
    });
    setCurrentFileUrl(resource.file_url || '');
    setFile(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const handleDelete = (resource) => {
    setDeleteConfirmId(resource.id);
    setDeleteConfirmName(resource.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/resources/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        fetchResources();
      }
    } catch (err) {
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit. Please use a smaller file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  /**
   * Returns { Icon, colorClass } for a file extension so resource cards
   * can render a proper Lucide icon instead of an emoji.
   */
  const getFileTypeMeta = (filename) => {
    if (!filename) return { Icon: File, colorClass: 'text-slate-500 bg-slate-50' };
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      pdf:  { Icon: FileText,        colorClass: 'text-rose-600 bg-rose-50' },
      doc:  { Icon: FileText,        colorClass: 'text-blue-600 bg-blue-50' },
      docx: { Icon: FileText,        colorClass: 'text-blue-600 bg-blue-50' },
      ppt:  { Icon: FileText,        colorClass: 'text-orange-600 bg-orange-50' },
      pptx: { Icon: FileText,        colorClass: 'text-orange-600 bg-orange-50' },
      xls:  { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      xlsx: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      csv:  { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      txt:  { Icon: FileText,        colorClass: 'text-slate-600 bg-slate-50' },
      json: { Icon: FileJson,        colorClass: 'text-violet-600 bg-violet-50' },
      zip:  { Icon: FileArchive,     colorClass: 'text-amber-600 bg-amber-50' },
      rar:  { Icon: FileArchive,     colorClass: 'text-amber-600 bg-amber-50' },
      png:  { Icon: Image,           colorClass: 'text-indigo-600 bg-indigo-50' },
      jpg:  { Icon: Image,           colorClass: 'text-indigo-600 bg-indigo-50' },
      jpeg: { Icon: Image,           colorClass: 'text-indigo-600 bg-indigo-50' },
      gif:  { Icon: Image,           colorClass: 'text-indigo-600 bg-indigo-50' },
      svg:  { Icon: Image,           colorClass: 'text-indigo-600 bg-indigo-50' },
      mp4:  { Icon: Film,            colorClass: 'text-pink-600 bg-pink-50' },
      mp3:  { Icon: Music,           colorClass: 'text-teal-600 bg-teal-50' },
      js:   { Icon: FileCode2,       colorClass: 'text-yellow-600 bg-yellow-50' },
      ts:   { Icon: FileCode2,       colorClass: 'text-blue-600 bg-blue-50' },
    };
    return map[ext] || { Icon: File, colorClass: 'text-slate-500 bg-slate-50' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Title is required');
      return;
    }
    if (editingId === 'new' && !file) {
      setError('Please select a file to upload');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    if (file) {
      data.append('file', file);
    }

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };

      if (editingId === 'new') {
        await api.post('/admin/resources', data, config);
      } else {
        await api.put(`/admin/resources/${editingId}`, data, config);
      }
      setEditingId(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addNew = () => {
    setEditingId('new');
    setFormData({ title: '', category: '' });
    setCurrentFileUrl('');
    setFile(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5173${url}`;
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Manage Resources</h2>
          <p className="text-text-secondary text-xs md:text-sm">Upload formula sheets, reference charts, or practice guides dynamically.</p>
        </div>
        <button 
          onClick={addNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
        >
          <Plus size={18} /> Add Resource
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
          Loading resources...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <div key={resource.id} className="p-6 rounded-2xl bg-white border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left">
              <div className="flex flex-col gap-3">
                {(() => {
                  const { Icon, colorClass } = getFileTypeMeta(resource.original_filename || resource.file_url);
                  return (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                  );
                })()}
                <h3 className="font-display font-bold text-base text-text-primary m-0 line-clamp-2">{resource.title}</h3>
                <div className="flex gap-4 items-center mt-1">
                  <a 
                    href={`http://localhost:5173/api/resources/${resource.id}/view`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </a>
                  <a 
                    href={`http://localhost:5173/api/admin/resources/${resource.id}/download?token=${localStorage.getItem('token')}`}
                    className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-border-color/60">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-secondary text-primary font-bold text-xs rounded-lg hover:bg-primary-light hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleEdit(resource)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 font-bold text-xs rounded-lg hover:bg-red-500 hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleDelete(resource)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Add/Edit Form */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">
            
            {/* Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary m-0">
                {editingId === 'new' ? 'Add New Resource' : 'Edit Resource'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                disabled={uploading}
                className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Form Body */}
            <form onSubmit={handleSubmit} className="grow flex flex-col overflow-hidden">
              <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">
                
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Resource Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Limits Reference Sheet" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    required 
                    disabled={uploading}
                    className="w-full p-3 border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-bg-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Calculus, Grade 9, Trigonometry" 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    required 
                    disabled={uploading}
                    className="w-full p-3 border border-border-color rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-bg-secondary"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    <option value="Calculus" />
                    <option value="Trigonometry" />
                    <option value="Grade 9" />
                    <option value="Grade 10" />
                    <option value="Grade 11" />
                    <option value="Grade 12" />
                    <option value="General" />
                  </datalist>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Upload Document</label>
                  <div className="border-2 border-dashed border-border-color hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors bg-bg-secondary/40 relative">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      accept="*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={uploading}
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-primary flex items-center justify-center">
                      <Upload size={22} className={uploading ? 'animate-bounce' : ''} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-text-primary">
                        {file ? file.name : 'Click to select or drag any educational file'}
                      </p>
                      <p className="text-xxs text-text-tertiary mt-1">
                        {file
                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                          : 'PDF, DOCX, PPT, PPTX, XLSX, TXT, CSV, JSON, ZIP, Images and more — up to 50 MB'}
                      </p>
                    </div>
                  </div>
                </div>

                {editingId !== 'new' && !file && currentFileUrl && (
                  <div className="flex items-center gap-2.5 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <FileText className="text-primary shrink-0" size={16} />
                    <div className="text-xxs text-text-secondary truncate grow">
                      <span className="font-bold text-text-primary block">Current File:</span>
                      {currentFileUrl}
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
                      <span>Uploading document...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-bg-tertiary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Uploading...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  disabled={uploading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 border-0 grow cursor-pointer disabled:opacity-50" 
                  onClick={() => setEditingId(null)}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              Are you sure you want to permanently delete the resource <span className="font-semibold text-text-primary">"{deleteConfirmName}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleConfirmDelete} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
              >
                Delete Resource
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

export default ManageResources;
