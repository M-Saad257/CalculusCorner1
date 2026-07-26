import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, FileText, Upload, AlertCircle, Loader2, Eye, Download,
  FileCode2, FileSpreadsheet, FileArchive, Image as ImageIcon, Film, Music, FileJson, File, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { Book_CATEGORIES } from '../../utils/categories';
import Loader from '../../components/ui/Loader';

const ManageBooks = () => {
  const [allBooksList, setAllBooksList] = useState([]);
  const [Books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handleViewBook = (book) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
      window.open(`${import.meta.env.VITE_BACKEND_URL || ''}/api/books/${book.id}/view`, '_blank');
    } else {
      setSelectedBook(book);
    }
  };

  const [formData, setFormData] = useState({ title: '', category: '', subcategory: '', show_on_home: false });
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

  const categoriesList = Array.from(
    new Set(['All', ...allBooksList.map(v => v.category).filter(Boolean)])
  );

  const subcategoriesList = Array.from(
    new Set(['All', ...allBooksList.filter(r => r.category === activeCategory && r.subcategory).map(r => r.subcategory)])
  );

  useEffect(() => {
    setActiveSubcategory('All');
    setCurrentPage(1);
  }, [activeCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubcategory]);

  const fetchBooksMetadata = async () => {
    try {
      const res = await api.get('/admin/books');
      if (res.data && Array.isArray(res.data.data)) {
        setAllBooksList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load books metadata:', err);
    }
  };

  const fetchPaginatedBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/books', {
        params: {
          page: currentPage,
          limit: 6,
          category: activeCategory,
          subcategory: activeSubcategory
        }
      });
      if (res.data && Array.isArray(res.data.data)) {
        setBooks(res.data.data);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to load paginated books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksMetadata();
  }, []);

  useEffect(() => {
    fetchPaginatedBooks();
  }, [activeCategory, activeSubcategory, currentPage]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => {
      fetchBooksMetadata();
      fetchPaginatedBooks();
    };
    socket.on('book:create', refreshData);
    socket.on('book:update', refreshData);
    socket.on('book:delete', refreshData);
    return () => {
      socket.off('book:create', refreshData);
      socket.off('book:update', refreshData);
      socket.off('book:delete', refreshData);
    };
  }, [socket, activeCategory, activeSubcategory, currentPage]);

  const handleEdit = (Book) => {
    setEditingId(Book.id);
    setFormData({
      title: Book.title || '',
      category: Book.category || '',
      subcategory: Book.subcategory || '',
      show_on_home: Book.show_on_homepage === 1 || Book.showOnHomepage === 1 || Book.metadata?.show_on_home || false
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
      const res = await api.delete(`/admin/books/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        fetchBooksMetadata();
        fetchPaginatedBooks();
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

    if (selectedFile.size > 1024 * 1024 * 1024) {
      setError('File size exceeds the 1GB limit. Please use a smaller file.');
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
      pdf: { Icon: FileText, colorClass: 'text-rose-600 bg-rose-50' },
      doc: { Icon: FileText, colorClass: 'text-blue-600 bg-blue-50' },
      docx: { Icon: FileText, colorClass: 'text-blue-600 bg-blue-50' },
      ppt: { Icon: FileText, colorClass: 'text-orange-600 bg-orange-50' },
      pptx: { Icon: FileText, colorClass: 'text-orange-600 bg-orange-50' },
      xls: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      xlsx: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      csv: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600 bg-emerald-50' },
      txt: { Icon: FileText, colorClass: 'text-slate-600 bg-slate-50' },
      json: { Icon: FileJson, colorClass: 'text-violet-600 bg-violet-50' },
      zip: { Icon: FileArchive, colorClass: 'text-amber-600 bg-amber-50' },
      rar: { Icon: FileArchive, colorClass: 'text-amber-600 bg-amber-50' },
      png: { Icon: ImageIcon, colorClass: 'text-indigo-600 bg-indigo-50' },
      jpg: { Icon: ImageIcon, colorClass: 'text-indigo-600 bg-indigo-50' },
      jpeg: { Icon: ImageIcon, colorClass: 'text-indigo-600 bg-indigo-50' },
      gif: { Icon: ImageIcon, colorClass: 'text-indigo-600 bg-indigo-50' },
      svg: { Icon: ImageIcon, colorClass: 'text-indigo-600 bg-indigo-50' },
      mp4: { Icon: Film, colorClass: 'text-pink-600 bg-pink-50' },
      mp3: { Icon: Music, colorClass: 'text-teal-600 bg-teal-50' },
      js: { Icon: FileCode2, colorClass: 'text-yellow-600 bg-yellow-50' },
      ts: { Icon: FileCode2, colorClass: 'text-blue-600 bg-blue-50' },
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
    data.append('show_on_homepage', formData.show_on_home ? 1 : 0);
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
        await api.post('/admin/books', data, config);
      } else {
        await api.put(`/admin/books/${editingId}`, data, config);
      }
      setEditingId(null);
      fetchBooksMetadata();
      fetchPaginatedBooks();
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

  const isPinnedLimitReached = false; // No limit — show all pinned on landing page
  const disablePinCheckbox = false;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center bg-bg-color p-6 rounded-2xl shadow-sm border border-border-color">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Manage Books</h2>
          <p className="text-text-secondary text-sm mt-1">Upload reference books, notes, sheets, and syllabus guides.</p>
        </div>
        <button
          onClick={addNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
        >
          <Plus size={18} /> Add Book
        </button>
      </div>

      {/* Dynamic Category Filters (Matches landing page style) */}
      {!loading && Books.length > 0 && (
        <div className="flex flex-col gap-4 bg-bg-color p-6 rounded-2xl border border-border-color shadow-sm">
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
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border-color/60">
              {subcategoriesList.map((subcat) => (
                <button
                  key={subcat}
                  onClick={() => setActiveSubcategory(subcat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${activeSubcategory === subcat
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-sm'
                    : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
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
        <div className="col-span-full">
          <Loader text="Loading premium books..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {Books.map(Book => (
              <div key={Book.id} className="p-4 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left">
                <div className="flex flex-col gap-3">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-bg-secondary flex items-center justify-center">
                    {Book.thumbnail_url ? (
                      <img src={`${import.meta.env.VITE_BACKEND_URL || ''}${Book.thumbnail_url}`} alt={Book.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-text-tertiary gap-2">
                        <Book size={32} />
                        <span className="text-xs font-medium">No Thumbnail</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base text-text-primary m-0 line-clamp-2">{Book.title}</h3>
                  <div className="flex gap-4 items-center mt-1">
                    <button
                      onClick={() => handleViewBook(Book)}
                      className="text-xs text-primary hover:text-primary-dark hover:underline font-semibold flex items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                    <a
                      href={`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/books/${Book.id}/download?token=${localStorage.getItem('token')}`}
                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-border-color/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-bg-secondary px-2 py-1 rounded-md">
                    {Book.category} {Book.subcategory ? `> ${Book.subcategory}` : ''}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(Book)} className="p-1.5 text-text-tertiary hover:text-primary hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(Book)} className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {Books.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-secondary gap-3 border-2 border-dashed border-border-color rounded-2xl">
                <FileText size={48} className="text-text-tertiary" />
                <p>No Books found.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 bg-bg-color p-3 rounded-2xl border border-border-color shadow-sm w-fit mx-auto flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-105'
                      : 'bg-bg-color text-text-secondary border-border-color hover:bg-bg-secondary hover:text-text-primary'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Editor Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto border border-border-color text-left">
            <div className="px-6 py-5 border-b border-border-color flex justify-between items-center bg-bg-secondary">
              <h3 className="font-display font-bold text-lg text-text-primary m-0">
                {editingId === 'new' ? 'Upload New Book' : 'Edit Book'}
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
                  placeholder="e.g. Differentiation Rules Cheat Sheet"
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
                    {Object.keys(Book_CATEGORIES).map(cat => (
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

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="show_on_home"
                  checked={formData.show_on_home}
                  disabled={disablePinCheckbox}
                  onChange={(e) => setFormData({ ...formData, show_on_home: e.target.checked })}
                  className="w-4 h-4 text-primary bg-bg-secondary border-border-color rounded focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="show_on_home" className={`text-sm font-semibold select-none cursor-pointer ${disablePinCheckbox ? 'text-text-tertiary cursor-not-allowed' : 'text-text-primary'}`}>
                  Show on Landing Page
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,.png,.jpg,.jpeg,.webp"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-bg-color rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-border-color text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg m-0">Delete Book</h3>
                <p className="text-text-secondary text-sm mt-1 mb-0 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary">"{deleteConfirmName}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
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
      {createPortal(
        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setSelectedBook(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-bg-color rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 md:p-6 border-b border-border-color flex justify-between items-center bg-bg-secondary">
                  <h3 className="font-display font-bold text-lg md:text-xl text-text-primary line-clamp-1 pr-6">
                    {selectedBook.title}
                  </h3>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-grow bg-bg-secondary flex items-center justify-center relative">
                  <iframe
                    src={`/api/books/${selectedBook.id}/view`}
                    title={selectedBook.title}
                    className="w-full h-full border-0"
                  ></iframe>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ManageBooks;
