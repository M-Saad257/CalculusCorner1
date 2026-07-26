import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Link as LinkIcon, AlertCircle, CheckCircle, Film, Play, ExternalLink, Search, ArrowUpDown } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { RESOURCE_CATEGORIES } from '../../utils/categories';
import Loader from '../../components/ui/Loader';
import { sortLecturesNaturally } from '../../utils/sortUtils';

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
    subcategory: '',
    is_past_paper: 0,
    duration: ''
  });

  const [formError, setFormError] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    let videoId = null;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) videoId = watchMatch[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
    return null;
  };

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'past_papers' | 'regular'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lecture_asc');

  const [allVideosList, setAllVideosList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const categoriesList = Array.from(
    new Set(['All', ...allVideosList.map(v => v.category).filter(Boolean)])
  );

  const subcategoriesList = Array.from(
    new Set(['All', ...allVideosList.filter(r => r.category === activeCategory && r.subcategory).map(r => r.subcategory)])
  );

  useEffect(() => {
    setActiveSubcategory('All');
    setCurrentPage(1);
  }, [activeCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, activeSubcategory, searchQuery, sortBy]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const isPastPaperParam = filterType === 'past_papers' ? 1 : filterType === 'regular' ? 0 : 'all';
      const res = await api.get('/admin/videos', {
        params: {
          page: currentPage,
          limit: 6,
          category: activeCategory,
          subcategory: activeSubcategory,
          is_past_paper: isPastPaperParam,
          search: searchQuery.trim() || undefined,
          sortBy: sortBy
        }
      });
      if (res.data && Array.isArray(res.data.data)) {
        setVideos(res.data.data);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/admin/videos');
      if (res.data && Array.isArray(res.data.data)) {
        setAllVideosList(res.data.data);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [activeCategory, activeSubcategory, filterType, currentPage, searchQuery, sortBy]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => {
      fetchMetadata();
      fetchVideos();
    };
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
      subcategory: video.subcategory || '',
      is_past_paper: video.is_past_paper || 0,
      duration: video.duration || '',
      show_on_homepage: video.show_on_homepage || 0
    });
    setFormError('');
    setIsValidUrl(true);
  };

  const handleUrlChange = async (urlVal) => {
    setFormData(prev => ({ ...prev, url: urlVal }));
    setFormError('');
    setIsValidUrl(false);

    if (!urlVal) {
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      return;
    }

    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})([#&?].*)?$/;
    const match = urlVal.match(regex);

    if (!match) {
      setFormError('Invalid YouTube URL format');
      setFormData(prev => ({ ...prev, videoId: '', thumbnail: '' }));
      return;
    }

    const videoId = match[1];
    setIsValidUrl(true);

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

  const handleAddNew = (isPastPaper = false) => {
    setEditingId('new');
    setFormData({
      title: '',
      url: '',
      videoId: '',
      thumbnail: '',
      category: '',
      subcategory: '',
      is_past_paper: isPastPaper ? 1 : 0,
      duration: '',
      show_on_homepage: 0
    });
    setFormError('');
    setIsValidUrl(false);
  };

  const handleDelete = (video) => {
    setDeleteConfirmId(video.id);
    setDeleteConfirmName(video.title);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/videos/${deleteConfirmId}`);
      showToast('Video removed successfully.', 'success');
      setDeleteConfirmId(null);
      fetchVideos();
    } catch (err) {
      showToast('Delete failed.', 'error');
    }
  };
  const availableSubcategories = formData.category ? (RESOURCE_CATEGORIES[formData.category] || []) : [];

  const pinnedVideosCount = allVideosList.filter(v => v.show_on_homepage === 1 || v.showOnHomepage === 1).length;
  const isPinnedLimitReached = false; // No limit — show all pinned items on landing page
  const disablePinCheckbox = false;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-color p-6 rounded-2xl shadow-sm border border-border-color gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Manage Lectures</h2>
          <p className="text-text-secondary text-sm mt-1">Add and catalog video lessons and solved past paper video walkthroughs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAddNew(false)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all"
          >
            <Plus size={18} /> Add Video Lecture
          </button>
          <button
            onClick={() => handleAddNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border-0 font-semibold text-sm rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm transition-all"
          >
            <Plus size={18} /> Add Past Paper Lecture
          </button>
        </div>
      </div>

      {/* Search Bar, Sorting & Dynamic Category Filters */}
      <div className="flex flex-col gap-4 bg-bg-color p-6 rounded-2xl border border-border-color shadow-sm">
        {/* Search Bar & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pb-4 border-b border-border-color/60">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search lectures by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-bg-secondary border border-border-color rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 min-w-[210px]">
            <div className="relative w-full">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-bg-secondary border border-border-color rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="lecture_asc">Sort: Lecture Order (1.1, 1.2, 1.3...)</option>
                <option value="default">Sort: Default (Pinned first)</option>
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="title_asc">Sort: Title (A-Z)</option>
                <option value="title_desc">Sort: Title (Z-A)</option>
                <option value="category_asc">Sort: Category (A-Z)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Solved Past Papers vs Regular Lectures Filter + Count */}
        <div className="flex items-center justify-between gap-2 pb-1 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${filterType === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
                }`}
            >
              All Lectures
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
              Regular Lectures Only
            </button>
          </div>

          <div className="text-xs font-semibold text-text-tertiary">
            {totalItems} {totalItems === 1 ? 'lecture' : 'lectures'} found
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-color/40">
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
                  : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white hover:text-slate-800'
                  }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="col-span-full">
          <Loader text="Loading Lectures..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-bg-color border border-border-color rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3 group border border-border-color/60">
                    <img src={video.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'} alt={video.title} className="w-full h-full object-cover" />

                    {/* Solved Past Paper Badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                      {video.is_past_paper ? (
                        <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded shadow-sm">
                          Past Paper
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase bg-primary text-white px-2 py-0.5 rounded shadow-sm">
                          Lecture
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="p-3 bg-white text-primary rounded-full hover:scale-105 transition-transform border-0 cursor-pointer shadow-lg flex items-center justify-center"
                      >
                        <Play size={18} className="fill-current ml-0.5" />
                      </button>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2.5 right-2.5 text-[10px] text-white bg-black/60 hover:bg-black px-2.5 py-1 rounded-md font-bold flex items-center gap-1 hover:no-underline"
                      >
                        <ExternalLink size={10} /> YouTube
                      </a>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base text-text-primary m-0 line-clamp-2" title={video.title}>{video.title}</h3>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-color/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-bg-secondary px-2 py-1 rounded-md">
                    {video.category} {video.subcategory ? `> ${video.subcategory}` : ''}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(video)} className="p-1.5 text-text-tertiary hover:text-primary hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(video)} className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-bg-tertiary rounded-md transition-colors cursor-pointer border-0 bg-transparent">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-secondary gap-3 border-2 border-dashed border-border-color rounded-2xl">
                <Film size={48} className="text-text-tertiary opacity-60" />
                <p className="font-semibold text-text-primary text-base m-0">No videos found matching your criteria</p>
                {(searchQuery || activeCategory !== 'All' || activeSubcategory !== 'All' || filterType !== 'all' || sortBy !== 'default') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                      setActiveSubcategory('All');
                      setFilterType('all');
                      setSortBy('default');
                    }}
                    className="mt-1 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border-color rounded-xl text-xs font-bold text-primary cursor-pointer transition-colors"
                  >
                    Reset Filters & Search
                  </button>
                )}
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
                {editingId === 'new'
                  ? (formData.is_past_paper ? 'Add Past Paper Video' : 'Add New Video')
                  : 'Edit Video Details'}
              </h3>
              <button
                onClick={() => setEditingId(null)}
                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-full hover:bg-bg-tertiary transition-all cursor-pointer border-0 bg-transparent shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">YouTube URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-4 py-2.5 pl-11 rounded-xl border bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary ${formError ? 'border-red-300 focus:border-red-500 bg-red-50/10' : isValidUrl ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50/10' : 'border-border-color focus:border-primary'}`}
                    required
                  />
                  <LinkIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isValidUrl ? 'text-emerald-500' : 'text-text-tertiary'}`} size={18} />
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
                <div className="rounded-xl overflow-hidden bg-bg-secondary border border-border-color aspect-video w-full flex-shrink-0 relative">
                  <img src={formData.thumbnail} alt="Video preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">PREVIEW</div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Video title"
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
                  id="video_is_past_paper"
                  checked={!!formData.is_past_paper}
                  onChange={(e) => setFormData({ ...formData, is_past_paper: e.target.checked ? 1 : 0 })}
                  className="w-4.5 h-4.5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="video_is_past_paper" className="text-sm font-semibold text-text-primary cursor-pointer select-none">
                  Flag as solved past paper video walkthrough
                </label>
              </div>

              {/* Show on Landing Page Flag */}
              <div className="flex items-center gap-3 p-3.5 bg-bg-secondary rounded-xl border border-border-color/60">
                <input
                  type="checkbox"
                  id="video_show_on_homepage"
                  checked={!!formData.show_on_homepage}
                  disabled={disablePinCheckbox}
                  onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked ? 1 : 0 })}
                  className="w-4.5 h-4.5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="video_show_on_homepage" className={`text-sm font-semibold select-none cursor-pointer ${disablePinCheckbox ? 'text-text-tertiary cursor-not-allowed' : 'text-text-primary'}`}>
                  Show on Landing Page
                </label>
              </div>

              {/* Duration Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Duration (e.g. 15:40, 2:05:19)</label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 12:45"
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-5 py-2.5 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-color rounded-2xl w-full max-w-md shadow-2xl p-6 border border-border-color text-left">
            <h3 className="font-display font-bold text-lg text-text-primary mt-0 mb-2">Remove Video</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-text-primary">"{deleteConfirmName}"</strong> from the library? This action cannot be undone.
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-bg-color rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden shadow-2xl border border-border-color"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Play size={14} className="text-primary fill-current ml-0.5" />
                </div>
                <h3 className="font-display font-bold text-base md:text-lg text-text-primary line-clamp-1 pr-6">{previewVideo.title}</h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Iframe */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={getEmbedUrl(previewVideo.url)}
                title={previewVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideos;
