import React, { useState, useMemo } from 'react';
import { Play, X, ExternalLink, Search, BarChart, LayoutGrid, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';

const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    if (url.includes('youtube.com/embed/')) return url;
    let videoId = null;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) videoId = watchMatch[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
  } catch (e) {}
  return null;
};

const PracticeTab = ({ videos }) => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(videos.map(v => v.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [videos]);

  const subcategories = useMemo(() => {
    if (activeCategory === 'All') return [];
    const subs = new Set(
      videos.filter(v => (v.category || 'General') === activeCategory && v.subcategory).map(v => v.subcategory)
    );
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [videos, activeCategory]);

  // Reset subcategory when category changes
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory('All');
  };

  const filtered = useMemo(() => {
    return videos.filter(v => {
      const matchCat = activeCategory === 'All' || (v.category || 'General') === activeCategory;
      const matchSub = activeSubcategory === 'All' || v.subcategory === activeSubcategory;
      const matchSearch = !search.trim() || v.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSub && matchSearch;
    });
  }, [videos, search, activeCategory, activeSubcategory]);

  const handleOpenVideo = (vid) => {
    const embedUrl = getEmbedUrl(vid.url);
    if (embedUrl) {
      api.post(`/student/progress/video/${vid.id}`, { progressPercent: 100 }).catch(() => {});
      setSelectedVideo({ ...vid, embedUrl });
    } else {
      api.post(`/student/progress/video/${vid.id}`, { progressPercent: 100 }).catch(() => {});
      window.open(vid.url, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Calculus Study Lectures</h2>
          <p className="text-text-secondary text-sm mt-1">Select a lecture card below to watch inline, or launch a practice assessment.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/', { state: { scrollTo: 'practice' } })}
          className="px-6 py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer flex items-center gap-2"
        >
          <BarChart size={14} />
          <span>Launch Timed Quiz Practice</span>
        </Button>
      </div>

      {/* Search + Category + Subcategory Filter */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lectures..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-bg-color border border-border-color text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeCategory === cat
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
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    activeSubcategory === sub
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
      )}

      {/* Grid / Empty States */}
      {videos.length === 0 ? (
        <div className="p-12 text-center bg-bg-color border border-border-color rounded-3xl text-text-secondary font-semibold">
          No video lectures uploaded yet. Check back soon!
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-bg-color border border-dashed border-border-color rounded-3xl text-text-secondary">
          <Search size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="font-semibold text-sm">No lectures match your filters.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('All'); setActiveSubcategory('All'); }}
            className="mt-2 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(vid => (
            <div
              key={vid.id}
              onClick={() => handleOpenVideo(vid)}
              className="group cursor-pointer rounded-3xl bg-bg-color border border-border-color p-4 hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 text-left"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-bg-secondary border border-border-color/40">
                <img
                  src={vid.thumbnail || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                  alt={vid.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
              </div>

              <div className="flex-1 flex flex-col justify-between">
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

                <div className="flex items-center gap-1.5 text-text-tertiary text-xxs font-extrabold mt-4 pt-3 border-t border-border-color/65">
                  <Play size={11} className="fill-current" />
                  <span>WATCH INLINE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Video Player Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.45 }}
                className="bg-bg-color rounded-3xl w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
                style={{ maxHeight: '85vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Play size={14} className="text-primary fill-current ml-0.5" />
                    </div>
                    <h3 className="font-display font-bold text-base text-text-primary line-clamp-1 pr-4">
                      {selectedVideo.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-primary border border-border-color hover:border-primary/30 hover:bg-primary/5 rounded-xl transition-colors"
                    >
                      <ExternalLink size={13} />
                      YouTube
                    </a>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={selectedVideo.embedUrl}
                    title={selectedVideo.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
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

export default PracticeTab;
