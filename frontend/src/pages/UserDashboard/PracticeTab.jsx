import React, { useState, useMemo, useEffect } from 'react';
import { Play, Search, BarChart, LayoutGrid, ChevronRight, CheckCircle2, ArrowUpDown, Maximize, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { sortLecturesNaturally } from '../../utils/sortUtils';

const PracticeTab = ({ videos: parentVideos, onPlayVideo, studentClass }) => {
  const navigate = useNavigate();
  const [allVideosList, setAllVideosList] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('lecture_asc');

  // Fetch all videos metadata once for category/subcategory mapping
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/student/videos');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllVideosList(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load videos metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Filter videos strictly by student class if student is logged in
  const classFilteredVideos = useMemo(() => {
    if (!studentClass || studentClass === 'All') return allVideosList;
    const target = studentClass.trim().toLowerCase();
    const matched = allVideosList.filter(v => {
      if (!v.category) return false;
      const cat = v.category.trim().toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matched;
  }, [allVideosList, studentClass]);

  const categories = useMemo(() => {
    if (studentClass && studentClass !== 'All') {
      return [studentClass];
    }
    const cats = new Set(classFilteredVideos.map(v => v.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [classFilteredVideos, studentClass]);

  const initialCategory = React.useMemo(() => {
    if (studentClass && studentClass !== 'All') {
      return studentClass;
    }
    if (studentClass && categories.length > 0) {
      const found = categories.find(c => c.toLowerCase() === studentClass.toLowerCase() || c.toLowerCase().includes(studentClass.toLowerCase()));
      if (found) return found;
    }
    return 'All';
  }, [studentClass, categories]);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState('All');

  React.useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const subcategories = useMemo(() => {
    const targetVideos = activeCategory === 'All'
      ? classFilteredVideos
      : classFilteredVideos.filter(v => (v.category || 'General').toLowerCase() === activeCategory.toLowerCase());
    const subs = new Set(targetVideos.filter(v => v.subcategory).map(v => v.subcategory));
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [classFilteredVideos, activeCategory]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory('All');
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Fetch paginated videos
  const fetchPaginatedVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/videos', {
        params: {
          page: currentPage,
          limit: 6,
          category: activeCategory,
          subcategory: activeSubcategory,
          search: search,
          sort: sortBy
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVideos(res.data.data);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to fetch paginated videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedVideos();
  }, [activeCategory, activeSubcategory, search, sortBy, currentPage]);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn text-left min-h-[650px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Calculus Study Lectures</h2>
          <p className="text-text-secondary text-sm mt-1">Select a lecture card below to watch inline, or launch a practice assessment.</p>
        </div>
      </div>

      {/* Search + Sort Row */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search lectures..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-bg-color border border-border-color text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-2xl bg-bg-color border border-border-color text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
            >
              <option value="lecture_asc">Lecture Order (1.1, 1.2, 1.3...)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_az">Title A–Z</option>
              <option value="title_za">Title Z–A</option>
              <option value="completed">Completed First</option>
              <option value="in_progress">In Progress First</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary shrink-0">
            <LayoutGrid size={13} /> Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-bg-color text-text-secondary border-border-color hover:border-primary/40 hover:text-primary'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subcategory Pills */}
        {subcategories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pl-1">
            <span className="flex items-center gap-1 text-xs font-bold text-text-tertiary shrink-0">
              <ChevronRight size={13} /> Sub:
            </span>
            {subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => handleSubcategoryChange(sub)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeSubcategory === sub
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-700 shadow-sm'
                    : 'bg-bg-secondary text-text-secondary border-border-color hover:border-slate-400 hover:text-text-primary'
                  }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid / Empty States */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="mt-4 text-xs font-bold text-text-tertiary">Loading lectures...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center bg-bg-color border border-dashed border-border-color rounded-3xl text-text-secondary">
          <Search size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="font-semibold text-sm">No lectures found.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('All'); setActiveSubcategory('All'); }}
            className="mt-2 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
            {(sortBy === 'lecture_asc' ? [...videos].sort(sortLecturesNaturally) : videos).map(vid => {
              const progressPercent = parseFloat(vid.progressPercent !== undefined ? vid.progressPercent : vid.progress_percent) || 0;
              const isCompleted = vid.isCompleted === 1 || vid.is_completed === 1 || progressPercent >= 90;
              return (
                <div
                  key={vid.id}
                  onClick={() => onPlayVideo(vid)}
                  className="group cursor-pointer rounded-3xl bg-bg-color border border-border-color p-4 hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 text-left justify-between"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-secondary border border-border-color/40">
                      <img
                        src={vid.thumbnail || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                        alt={vid.title}
                        className="w-full h-full object-cover p-1 rounded-lg bg-slate-900 transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=60';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play size={20} className="fill-current ml-0.5" />
                        </div>
                      </div>
                      {vid.duration && (
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center backdrop-blur-sm z-20">
                          {vid.duration}
                        </span>
                      )}

                      {/* Video Progress Bar Overlay */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/30">
                          <div
                            className="bg-primary h-full rounded-r-sm transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                          {vid.category || 'General'}
                        </span>
                        {vid.subcategory && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border-color rounded-full">
                            {vid.subcategory}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 mt-2 leading-snug group-hover:text-primary transition-colors" title={vid.title}>
                        {vid.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xxs font-extrabold mt-4 pt-3 border-t border-border-color/65">
                    <span className="text-text-tertiary flex items-center gap-1">
                      <Play size={11} className="fill-current" />
                      <span>WATCH LECTURE</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const pos = Math.round(vid.last_position || vid.lastPosition || 0);
                          window.open(`/viewer/video/${vid.id}?t=${pos}`, '_blank');
                        }}
                        title="Open Cinematic Fullscreen"
                        className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer text-[10px]"
                      >
                        <Maximize size={10} /> Fullscreen
                      </button>
                      {progressPercent > 0 && (
                        <span className={isCompleted ? "text-emerald-600 font-bold" : "text-primary"}>
                          {isCompleted ? 'Completed' : `${progressPercent}%`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Navigation */}
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
    </div>
  );
};

export default PracticeTab;