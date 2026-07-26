import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Clock, AlertCircle, X, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { useSocket } from '../../hooks/useSocket';
import VideoPlayerModal from '../ui/VideoPlayerModal';
import { sortLecturesNaturally } from '../../utils/sortUtils';

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const VideoLibrary = ({ hideHeader = false, isHomePage = false }) => {
  const [videos, setVideos] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState(isHomePage ? 'lecture_asc' : 'lecture_asc');

  const [allVideosList, setAllVideosList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const containerRef = useRef(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      const isStudentUser = decoded && decoded.role === 'student';

      const params = {
        page: currentPage,
        limit: 12,
        category: activeCategory,
        subcategory: activeSubcategory,
        search: searchQuery,
        sort: sortBy
      };

      let res;
      if (isStudentUser) {
        try {
          res = await api.get('/student/videos', { params });
        } catch (tokenErr) {
          res = await api.get('/content/videos', { params });
        }
      } else {
        res = await api.get('/content/videos', { params });
      }

      if (res.data && res.data.success) {
        setVideos(res.data.data || []);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      } else {
        throw new Error('Response did not indicate success');
      }
    } catch (err) {
      setError('Could not load lecture videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      const isStudentUser = decoded && decoded.role === 'student';
      let res;
      if (isStudentUser) {
        try {
          res = await api.get('/student/videos');
        } catch (tokenErr) {
          res = await api.get('/content/videos');
        }
      } else {
        res = await api.get('/content/videos');
      }
      if (res.data && res.data.success) {
        setAllVideosList(res.data.data || []);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [activeCategory, activeSubcategory, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSubcategory, searchQuery, sortBy]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && allVideosList.length > 0) {
        const u = JSON.parse(userStr);
        const userClass = u?.class || u?.grade || null;
        if (userClass) {
          const matched = allVideosList.find(v => (v.category || '').toLowerCase() === userClass.toLowerCase() || (v.category || '').toLowerCase().includes(userClass.toLowerCase()));
          if (matched && matched.category) {
            setActiveCategory(matched.category);
          }
        }
      }
    } catch (e) { }
  }, [allVideosList]);

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

  const categoriesList = [
    'All',
    ...Array.from(new Set(allVideosList.map(v => v.category).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  ];

  const subcategoriesList = [
    'All',
    ...Array.from(new Set(allVideosList.filter(v => v.category === activeCategory && v.subcategory).map(v => v.subcategory)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  ];

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeCategory]);

  const displayVideos = (() => {
    let list = [...videos];
    if (sortBy === 'lecture_asc') {
      list.sort(sortLecturesNaturally);
    }
    if (isHomePage) {
      return list.filter(v => v.show_on_homepage === 1 || v.showOnHomepage === 1);
    }
    const pinned = list.filter(v => v.show_on_homepage === 1 || v.showOnHomepage === 1);
    const unpinned = list.filter(v => v.show_on_homepage !== 1 && v.showOnHomepage !== 1);
    return [...pinned, ...unpinned];
  })();

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
      <div className="container mx-auto px-4 md:px-8 min-h-[700px]">

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

          <div className="flex items-center gap-2 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search for a topic..."
                className="w-full pl-11 pr-4 py-2.5 border border-border-color rounded-full font-sans text-sm bg-bg-color shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {!isHomePage && (
              <div className="relative shrink-0">
                <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="pl-8 pr-3 py-2.5 rounded-full bg-bg-color border border-border-color text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none shadow-inner"
                >
                  <option value="lecture_asc">Lecture Order (1.1, 1.2, 1.3...)</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title_az">A–Z</option>
                  <option value="title_za">Z–A</option>
                </select>
              </div>
            )}
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
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white hover:text-slate-800'
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
          <div className="relative">
            <motion.div
              className={`grid gap-8 mb-0 ${isHomePage ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
              layout
            >
              {displayVideos.map((video) => {
                const progressPercent = parseFloat(video.progressPercent !== undefined ? video.progressPercent : video.progress_percent) || 0;
                const isCompleted = video.isCompleted === 1 || video.is_completed === 1 || progressPercent >= 90;
                return (
                  <motion.div
                    key={video.id}
                    onClick={() => {
                      navigate(`/viewer/video/${video.id}`);
                    }}
                    className="group flex flex-col p-4 rounded-[2rem] bg-bg-color border border-border-color shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-300 relative text-left cursor-pointer"
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
                      {video.duration && (
                        <span className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center backdrop-blur-sm z-20">
                          {video.duration}
                        </span>
                      )}
                      {/* Video Progress Bar Overlay */}
                      {localStorage.getItem('token') && progressPercent > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/30 z-20">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}

                      <div className="absolute top-4 left-4 z-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-bg-color/90 backdrop-blur-md text-text-primary shadow-sm">
                          {video.subcategory ? video.subcategory : video.category}
                        </span>
                      </div>
                      {/* YouTube direct link button */}
                      <div className="absolute top-4 right-4 z-20">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-md hover:scale-110 transition-all duration-200 cursor-pointer border-0"
                          title="Watch on YouTube"
                        >
                          <FaYoutube size={16} />
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow px-2">
                      <h3 className="font-display font-bold text-lg text-text-primary leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs font-semibold text-text-tertiary mt-auto">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-text-secondary" />
                          {formatDate(video.createdAt)}
                        </span>
                        {localStorage.getItem('token') && progressPercent > 0 && (
                          <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-primary'}`}>
                            {isCompleted ? 'Completed' : `${progressPercent}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Pagination Controls */}
            {!isHomePage && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 bg-bg-color p-3 rounded-2xl border border-border-color shadow-sm w-fit mx-auto flex-wrap">
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

            {isHomePage && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => navigate('/lectures')}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-105 transition-all duration-300 cursor-pointer border-0 text-sm"
                >
                  <span>More Lectures</span>
                  <PlayCircle size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 px-4 border-2 border-dashed border-border-color rounded-3xl bg-bg-color text-center shadow-inner"
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
