import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, PlayCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { useSocket } from '../../hooks/useSocket';

const DEFAULT_CATEGORIES = ['All', 'Calculus', 'Trigonometry', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'General'];

const VideoLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/content/videos');
      if (res.data && res.data.success) {
        setVideos(res.data.data || []);
      } else {
        throw new Error('Response did not indicate success');
      }
    } catch (err) {
      setError('Could not load lecture videos. Please try again later.');
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

  // Compile categories list dynamically from default list + custom categories stored in DB
  const categoriesList = Array.from(
    new Set([
      'All',
      ...DEFAULT_CATEGORIES.filter(c => c !== 'All'),
      ...videos.map(v => v.category).filter(Boolean)
    ])
  );

  const filteredVideos = videos.filter(video => 
    (activeCategory === 'All' || video.category === activeCategory) &&
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleBrowseAll = () => {
    setActiveCategory('All');
    setSearchQuery('');
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="videos" className="py-16 md:py-24 bg-bg-secondary relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div>
            <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
              Video Library
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight">
              Learn from the <span className="text-gradient">Best Lessons</span>
            </h2>
          </div>
          
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input 
              type="text" 
              placeholder="Search for a topic..." 
              className="w-full pl-11 pr-4 py-2.5 border border-border-color rounded-full font-sans text-sm bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="overflow-x-auto pb-4 mb-8 scrollbar-none">
          <div className="flex gap-3 min-w-max">
            {categoriesList.map(cat => (
              <button 
                key={cat} 
                className={`px-5 py-2 rounded-full border text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-text-primary text-white border-text-primary shadow-md' 
                    : 'bg-white border-border-color text-text-secondary hover:border-primary-light hover:text-primary'
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Loader text="Loading amazing lectures..." />
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-16 bg-white border border-red-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <AlertCircle size={40} className="text-red-500" />
            <p className="font-semibold text-text-primary text-center">{error}</p>
            <Button variant="primary" className="px-5 py-2" onClick={fetchVideos}>
              Try Again
            </Button>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            layout
          >
            {filteredVideos.map((video) => (
              <motion.div 
                key={video.id} 
                className="group cursor-pointer flex flex-col text-left bg-white rounded-3xl border border-border-color shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden hover:-translate-y-1.5"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => window.open(video.url, '_blank')}
              >
                <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50/50 shrink-0">
                  <img 
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-300">
                      <PlayCircle size={36} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col p-6 pt-5 grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xxs font-extrabold uppercase tracking-widest">
                      {video.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-text-primary mb-3 leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2" title={video.title}>
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-color/60">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                      <Clock size={14} className="text-primary/70" /> 
                      {formatDate(video.createdAt)}
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Watch Now
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Empty state */}
        {!loading && !error && filteredVideos.length === 0 && (
          <div className="text-center py-16 text-text-secondary flex flex-col items-center gap-4 bg-white rounded-3xl border border-border-color p-8 max-w-md mx-auto shadow-sm">
            <p className="font-medium text-base">No lessons found matching your search.</p>
            <Button variant="outline" className="px-5 py-2.5 text-sm" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
              Clear Filters
            </Button>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button variant="primary" size="lg" onClick={handleBrowseAll}>Browse All Videos</Button>
          </div>
        )}
      </div>

    </section>
  );
};

export default VideoLibrary;
