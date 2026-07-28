import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Tag, AlertCircle, Bell } from 'lucide-react';
import Loader from '../components/ui/Loader';

const UpdatesPage = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'General', 'Board Updates', 'Result Announcement', 'News & Events'];

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/updates');
      if (res.data && Array.isArray(res.data.data)) {
        setUpdates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('update:create', loadUpdates);
    socket.on('update:update', loadUpdates);
    socket.on('update:delete', loadUpdates);

    return () => {
      socket.off('update:create', loadUpdates);
      socket.off('update:update', loadUpdates);
      socket.off('update:delete', loadUpdates);
    };
  }, [socket]);

  const filteredUpdates = updates.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Board Updates': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Result Announcement': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'News & Events': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-28 pb-16 bg-transparent relative z-10 w-full min-h-[85vh] text-left">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="p-6 md:p-10 rounded-[2.5rem] glass dark:bg-slate-900/60 border border-border-color/50 shadow-xl relative z-10">
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                <Bell size={12} className="animate-bounce" /> Stay Informed
              </span>
              <h1 className="text-3xl md:text-5xl font-black font-display text-text-primary tracking-tight">
                Latest News & Board Updates
              </h1>
              <p className="text-text-secondary text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
                Real-time results notifications, exam dates, board announcements, and local educational updates.
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-bg-color border border-border-color p-5 rounded-2xl shadow-sm mb-8">
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${activeCategory === cat
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                        : 'bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative grow md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-border-color rounded-xl font-sans text-xs md:text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* List Content */}
            {loading ? (
              <div className="col-span-full">
                <Loader text="Loading dynamic updates..." />
              </div>
            ) : (
              <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredUpdates.map((item, idx) => (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, ease: 'easeOut', delay: idx * 0.05 }}
                      className="p-6 md:p-8 rounded-3xl bg-bg-color border border-border-color shadow-sm hover:shadow-md transition-shadow relative flex flex-col md:flex-row md:items-start justify-between gap-6 overflow-hidden group"
                    >
                      {/* Decorative element on hover */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>

                      {/* Update Image */}
                      {item.image && (
                        <div className="w-full md:w-72 h-48 rounded-2xl overflow-hidden border border-border-color shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-grow space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-text-tertiary">
                            <Calendar size={12} />
                            {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold font-display text-text-primary group-hover:text-primary transition-colors">
                          {item.title}
                        </h2>
                        <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:text-primary-dark font-semibold hover:underline transition-colors"
                          >
                            View Related Link ↗
                          </a>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>

                {filteredUpdates.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-border-color bg-bg-color rounded-3xl p-6">
                    <AlertCircle size={48} className="text-text-tertiary mx-auto mb-4" />
                    <h3 className="font-display font-bold text-lg text-text-primary">No Announcements Found</h3>
                    <p className="text-text-secondary text-sm mt-1 max-w-sm mx-auto">There are no updates matching your search. Please adjust your criteria or check back later.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
};

export default UpdatesPage;
