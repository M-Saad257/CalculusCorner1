import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Upload, AlertCircle, Loader2, Eye, Download,
         FileCode2, FileSpreadsheet, FileArchive, Image as ImageIcon, Film, Music, FileJson, File, Book } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { Book_CATEGORIES } from '../../utils/categories';

const ManageBooks = () => {
  const [Books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', category: '', subcategory: '', show_on_home: false });
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/Books');
      if (res.data && Array.isArray(res.data.data)) {
        setBooks(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchBooks();
    socket.on('Book:create', refreshData);
    socket.on('Book:update', refreshData);
    socket.on('Book:delete', refreshData);
    return () => {
      socket.off('Book:create', refreshData);
      socket.off('Book:update', refreshData);
      socket.off('Book:delete', refreshData);
    };
  }, [socket]);

  const handleEdit = (Book) => {
    setEditingId(Book.id);
    setFormData({
      title: Book.title || '',
      category: Book.category || '',
      subcategory: Book.subcategory || '',
      show_on_home: Book.metadata?.show_on_home || false
    });
    setCurrentFileUrl(Book.file_url || '');
    setFile(null);
    setThumbnail(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const handleDelete = (Book) => {
    setDeleteConfirmId(Book.id);
    setDeleteConfirmName(Book.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/Books/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        fetchBooks();
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

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit. Please use a smaller file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setThumbnail(selectedFile);
    } else {
      setThumbnail(null);
    }
  };

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
      png:  { Icon: ImageIcon,           colorClass: 'text-indigo-600 bg-indigo-50' },
      jpg:  { Icon: ImageIcon,           colorClass: 'text-indigo-600 bg-indigo-50' },
      jpeg: { Icon: ImageIcon,           colorClass: 'text-indigo-600 bg-indigo-50' },
      gif:  { Icon: ImageIcon,           colorClass: 'text-indigo-600 bg-indigo-50' },
      svg:  { Icon: ImageIcon,           colorClass: 'text-indigo-600 bg-indigo-50' },
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
    data.append('show_on_home', formData.show_on_home);
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
        await api.post('/admin/Books', data, config);
      } else {
        await api.put(`/admin/Books/${editingId}`, data, config);
      }
      setEditingId(null);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addNew = () => {
    setEditingId('new');
    setFormData({ title: '', category: '', subcategory: '', show_on_home: false });
    setCurrentFileUrl('');
    setFile(null);
    setThumbnail(null);
    setUploadProgress(0);
    setUploading(false);
    setError('');
  };

  const availableSubcategories = formData.category ? (Book_CATEGORIES[formData.category] || []) : [];

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Books</h2>
          <p className="text-slate-500 text-sm mt-1">Upload notes, sheets, and assignments.</p>
        </div>
        <button 
          onClick={addNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
        >
          <Plus size={18} /> Add Book
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
          Loading Books...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Books.map(Book => (
            <div key={Book.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left">
              <div className="flex flex-col gap-3">
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {Book.thumbnail_url ? (
                    <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${Book.thumbnail_url}`} alt={Book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                       <Book size={32} />
                       <span className="text-xs font-medium">No Thumbnail</span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-display font-bold text-base text-slate-800 m-0 line-clamp-2">{Book.title}</h3>
                <div className="flex gap-4 items-center mt-1">
                  <a 
                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/Books/${Book.id}/view`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </a>
                  <a 
                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/Books/${Book.id}/download?token=${localStorage.getItem('token')}`}
                    className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {Book.category} {Book.subcategory ? `> ${Book.subcategory}` : ''}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(Book)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(Book)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {Books.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
              <FileText size={48} className="text-slate-300" />
              <p>No Books uploaded yet.</p>
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
                {editingId === 'new' ? 'Upload New Book' : 'Edit Book'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-white transition-all cursor-pointer border-0 bg-transparent shadow-sm"
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
                <label className="text-sm font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Differentiation Rules Cheat Sheet"
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
                    {Object.keys(Book_CATEGORIES).map(cat => (
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
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="show_on_home"
                  checked={formData.show_on_home}
                  onChange={(e) => setFormData({ ...formData, show_on_home: e.target.checked })}
                  className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                />
                <label htmlFor="show_on_home" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Show on Landing Page
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  File Document
                  {editingId !== 'new' && <span className="font-normal text-slate-400 text-xs">Optional: Select to replace</span>}
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,.png,.jpg,.jpeg"
                  />
                  <Upload className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                </div>
                {file && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1 pl-1">
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                {!file && currentFileUrl && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 pl-1">
                    Current file preserved
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  Thumbnail Image
                  {editingId !== 'new' && <span className="font-normal text-slate-400 text-xs">Optional: Select to replace</span>}
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleThumbnailChange}
                    className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    accept="image/*"
                  />
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                </div>
              </div>

              {uploading && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingId(null)}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white border-0 font-semibold text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-primary/20"
                >
                  {uploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Save size={16} /> Save Book</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-slate-100/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg m-0">Delete Book</h3>
                <p className="text-slate-500 text-sm mt-1 mb-0 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteConfirmName}"</span>? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;
