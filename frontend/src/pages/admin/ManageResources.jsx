import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Upload, AlertCircle, Eye, Download,
         Image as ImageIcon, Book } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { RESOURCE_CATEGORIES } from '../../utils/categories';

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', category: '', subcategory: '', is_past_paper: 0 });
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'past_papers' | 'regular'

  const categoriesList = Array.from(
    new Set(['All', ...resources.map(v => v.category).filter(Boolean)])
  );

  const subcategoriesList = Array.from(
    new Set(['All', ...resources.filter(r => r.category === activeCategory && r.subcategory).map(r => r.subcategory)])
  );

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeCategory]);

  const filteredResources = resources.filter(res => {
    const matchesCat = activeCategory === 'All' || res.category === activeCategory;
    const matchesSub = activeSubcategory === 'All' || res.subcategory === activeSubcategory;
    const matchesType = filterType === 'all' 
      ? true 
      : filterType === 'past_papers' 
        ? res.is_past_paper === 1 
        : res.is_past_paper !== 1;
    return matchesCat && matchesSub && matchesType;
  });

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
      category: resource.category || '',
      subcategory: resource.subcategory || '',
      is_past_paper: resource.is_past_paper || 0
    });
    setCurrentFileUrl(resource.file_url || '');
    setFile(null);
    setThumbnail(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const handleDelete = (resource) => {
    setDeleteConfirmId(resource.id);
    setDeleteConfirmName(resource.title);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/resources/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
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
    data.append('is_past_paper', formData.is_past_paper ? 1 : 0);
    if (formData.subcategory) data.append('subcategory', formData.subcategory);
    if (file) data.append('file', file);
    if (thumbnail) data.append('thumbnail', thumbnail);

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

  const addNew = (isPastPaper = false) => {
    setEditingId('new');
    setFormData({ title: '', category: '', subcategory: '', is_past_paper: isPastPaper ? 1 : 0 });
    setCurrentFileUrl('');
    setFile(null);
    setThumbnail(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const availableSubcategories = formData.category ? (RESOURCE_CATEGORIES[formData.category] || []) : [];

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-color p-6 rounded-2xl shadow-sm border border-border-color gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Manage Resources</h2>
          <p className="text-text-secondary text-sm mt-1">Upload notes, sheets, and solved past papers.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => addNew(false)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
          >
            <Plus size={18} /> Add Resource
          </button>
          <button 
            onClick={() => addNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border-0 font-semibold text-sm rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm transition-all"
          >
            <Plus size={18} /> Add Past Paper PDF
          </button>
        </div>
      </div>

      {/* Dynamic Category Filters (Matches landing page style) */}
      {!loading && resources.length > 0 && (
        <div className="flex flex-col gap-4 bg-bg-color p-6 rounded-2xl border border-border-color shadow-sm">
          {/* Solved Past Papers vs Regular Notes Filter */}
          <div className="flex gap-2 pb-3 border-b border-border-color/60 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${filterType === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              All Resources
            </button>
            <button
              onClick={() => setFilterType('past_papers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${filterType === 'past_papers'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              Solved Past Papers Only
            </button>
            <button
              onClick={() => setFilterType('regular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${filterType === 'regular'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              Regular Notes Only
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border cursor-pointer ${activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                    : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeCategory !== 'All' && subcategoriesList.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-color/40">
              {subcategoriesList.map((subcat) => (
                <button
                  key={subcat}
                  onClick={() => setActiveSubcategory(subcat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${activeSubcategory === subcat
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-slate-200 hover:text-slate-800'
                    }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div 
              key={resource.id} 
              className="bg-bg-color border border-border-color rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-36 mb-3 rounded-xl overflow-hidden bg-bg-secondary border border-border-color/50">
                  {resource.thumbnail_url ? (
                    <img src={`${import.meta.env.VITE_BACKEND_URL || ''}${resource.thumbnail_url}`} alt={resource.title} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={32} className="text-text-tertiary opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {resource.is_past_paper ? (
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-500/90 text-white px-2 py-0.5 rounded-full shadow-sm">
                        Past Paper
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase bg-blue-500/90 text-white px-2 py-0.5 rounded-full shadow-sm">
                        Note / Cheat Sheet
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="font-display font-bold text-base text-text-primary m-0 line-clamp-2">{resource.title}</h3>
                <div className="flex gap-4 items-center mt-2">
                  <button 
                    onClick={() => setSelectedResource(resource)}
                    className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                  <a 
                    href={`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/resources/${resource.id}/download?token=${localStorage.getItem('token')}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-border-color/65">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-bg-secondary px-2 py-1 rounded-md">
                  {resource.category} {resource.subcategory ? `> ${resource.subcategory}` : ''}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(resource)} className="p-1.5 text-text-tertiary hover:text-primary hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(resource)} className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-secondary gap-3 border-2 border-dashed border-border-color rounded-2xl">
              <FileText size={48} className="text-text-tertiary" />
              <p>No resources found.</p>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto border border-border-color text-left">
            <div className="px-6 py-5 border-b border-border-color flex justify-between items-center bg-bg-secondary">
              <h3 className="font-display font-bold text-lg text-text-primary m-0">
                {editingId === 'new' 
                  ? (formData.is_past_paper ? 'Upload Solved Past Paper' : 'Upload New Resource') 
                  : 'Edit Resource'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-full hover:bg-bg-tertiary transition-all cursor-pointer border-0 bg-transparent shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 text-left">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. FBISE Class 12 Calculus Solved Past Paper 2023"
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                    className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary dark:bg-slate-900"
                    required
                  >
                    <option value="" className="bg-bg-color text-text-primary">Select Category</option>
                    {Object.keys(RESOURCE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat} className="bg-bg-color text-text-primary">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary disabled:opacity-50 dark:bg-slate-900"
                    disabled={!formData.category}
                  >
                    <option value="" className="bg-bg-color text-text-primary">Optional</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub} value={sub} className="bg-bg-color text-text-primary">{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Is Past Paper Flag */}
              <div className="flex items-center gap-3 p-3.5 bg-bg-secondary rounded-xl border border-border-color/60">
                <input
                  type="checkbox"
                  id="is_past_paper"
                  checked={!!formData.is_past_paper}
                  onChange={(e) => setFormData({ ...formData, is_past_paper: e.target.checked ? 1 : 0 })}
                  className="w-4.5 h-4.5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="is_past_paper" className="text-sm font-semibold text-text-primary cursor-pointer select-none">
                  Flag as solved past paper PDF
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary flex justify-between">
                  File Document
                  {editingId !== 'new' && <span className="font-normal text-text-tertiary text-xs">Optional: Select to replace</span>}
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2.5 pl-11 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-secondary file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,.png,.jpg,.jpeg"
                  />
                  <Upload className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-hover:text-primary transition-colors" size={18} />
                </div>
                {file && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1 pl-1">
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                {!file && currentFileUrl && (
                  <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1 pl-1">
                    Current file preserved
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary flex justify-between">
                  Thumbnail Image
                  {editingId !== 'new' && <span className="font-normal text-text-tertiary text-xs">Optional: Select to replace</span>}
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleThumbnailChange}
                    className="w-full px-4 py-2.5 pl-11 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-secondary file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    accept="image/*"
                  />
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-hover:text-primary transition-colors" size={18} />
                </div>
              </div>

              {uploading && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-text-secondary">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button 
                  type="button" 
                  onClick={() => setEditingId(null)}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !formData.title || !formData.category}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white border-0 font-semibold text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                  <Save size={16} /> {editingId === 'new' ? 'Upload' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-color rounded-2xl w-full max-w-md shadow-2xl p-6 border border-border-color text-left">
            <h3 className="font-display font-bold text-lg text-text-primary mt-0 mb-2">Delete Resource</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-text-primary">"{deleteConfirmName}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer border-0 shadow-sm shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedResource(null)}>
          <div className="bg-bg-color rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <h3 className="font-display font-bold text-base text-text-primary line-clamp-1 pr-6">{selectedResource.title}</h3>
              </div>
              <button onClick={() => setSelectedResource(null)} className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-red-500/10 cursor-pointer border-0 bg-transparent flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="flex-grow bg-bg-secondary relative">
              <iframe src={`/api/resources/${selectedResource.id}/view`} title={selectedResource.title} className="w-full h-full border-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageResources;
