import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, PlayCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { useSocket } from '../../hooks/useSocket';

const VideoLibrary = ({ hideHeader = false }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
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

  const categoriesList = Array.from(
    new Set(['All', ...videos.map(v => v.category).filter(Boolean)])
  );

  const subcategoriesList = Array.from(
    new Set(['All', ...videos.filter(v => v.category === activeCategory && v.subcategory).map(v => v.subcategory)])
  );

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeCategory]);

  const filteredVideos = videos.filter(video => {
    const matchesCat = activeCategory === 'All' || video.category === activeCategory;
    const matchesSub = activeSubcategory === 'All' || video.subcategory === activeSubcategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSub && matchesSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleBrowseAll = () => {
    setActiveCategory('All');
    setActiveSubcategory('All');
    setSearchQuery('');
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="videos" className="py-10 md:py-16 bg-bg-secondary/70 backdrop-blur-[2px] relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 text-left">
          {!hideHeader && (
            <div>
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
                Video Library
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight">
                Learn from the <span className="text-gradient">Best Video Lectures</span>
              </h2>
            </div>
          )}

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="text"
              placeholder="Search for a topic..."
              className="w-full pl-11 pr-4 py-2.5 border border-border-color rounded-full font-sans text-sm bg-bg-color shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
            {categoriesList.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${activeCategory === category
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {activeCategory !== 'All' && subcategoriesList.length > 1 && (
            <div className="flex flex-wrap gap-2 md:gap-3 justify-start mt-2">
              {subcategoriesList.map((subcat) => (
                <button
                  key={subcat}
                  onClick={() => setActiveSubcategory(subcat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${activeSubcategory === subcat
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <Loader text="Loading amazing lectures..." />
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-16 bg-bg-color border border-red-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <AlertCircle size={40} className="text-red-500" />
            <p className="font-semibold text-text-primary text-center">{error}</p>
            <Button variant="primary" className="px-5 py-2" onClick={fetchVideos}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-0"
            layout
          >
            {filteredVideos.map((video) => (
              <motion.a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-4 rounded-[2rem] bg-bg-color border border-border-color shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-300 relative text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                layout
              >
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-5 bg-slate-100 isolate">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                      <PlayCircle size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-[2px]">
                    <div className="w-16 h-16 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/30 transform scale-75 group-hover:scale-100 transition-transform duration-300 ease-out">
                      <PlayCircle size={32} className="ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 z-20">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-bg-color/90 backdrop-blur-md text-text-primary shadow-sm">
                      {video.subcategory ? video.subcategory : video.category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-grow px-2">
                  <h3 className="font-display font-bold text-lg text-text-primary leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-semibold text-text-tertiary mt-auto">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-text-secondary" />
                      {formatDate(video.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}

        {!loading && !error && filteredVideos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 px-4 border-2 border-dashed border-border-color rounded-3xl bg-bg-color text-center"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">New Lectures Coming Soon!</h3>
            <p className="text-text-secondary">Sir Mehtab is actively crafting and recording new high-quality video lessons—stay tuned, they will be available here soon!</p>
          </motion.div>
        )}

      </div>
    </section>
  );
};

export default VideoLibrary;
