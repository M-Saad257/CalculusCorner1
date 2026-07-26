import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, BookMarked, Eye, X, Search, LayoutGrid, ChevronRight, Maximize, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Loader from '../../components/ui/Loader';
import api from '../../services/api';
import { sortLecturesNaturally } from '../../utils/sortUtils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const ResourceTab = ({ getFileUrl, studentClass }) => {
  const navigate = useNavigate();
  const [allResourcesList, setAllResourcesList] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedResource, setSelectedResource] = useState(null);

  const handleViewResource = (resource) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
      window.open(`${BACKEND_URL}/api/resources/${resource.id}/view`, '_blank');
    } else {
      setSelectedResource(resource);
    }
    api.post('/content/track', { type: 'resource', id: resource.id }).catch(() => {});
  };

  // Fetch all resources once to build filters
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/student/resources');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllResourcesList(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load resources metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Filter resources strictly by student class if student is logged in
  const classFilteredResources = useMemo(() => {
    if (!studentClass || studentClass === 'All') return allResourcesList;
    const target = studentClass.trim().toLowerCase();
    const matched = allResourcesList.filter(r => {
      if (!r.category) return false;
      const cat = r.category.trim().toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matched;
  }, [allResourcesList, studentClass]);

  const categories = useMemo(() => {
    if (studentClass && studentClass !== 'All') {
      return [studentClass];
    }
    const cats = new Set(classFilteredResources.map(r => r.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [classFilteredResources, studentClass]);

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

  // Fetch paginated resources on filters change
  const fetchPaginatedResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/resources', {
        params: {
          page: currentPage,
          limit: 6,
          category: activeCategory,
          subcategory: activeSubcategory,
          search: search
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setResources(res.data.data);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to fetch paginated resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedResources();
  }, [activeCategory, activeSubcategory, search, currentPage]);

  const subcategories = useMemo(() => {
    const targetResources = activeCategory === 'All'
      ? classFilteredResources
      : classFilteredResources.filter(r => (r.category || 'General').toLowerCase() === activeCategory.toLowerCase());
    const subs = new Set(targetResources.filter(r => r.subcategory).map(r => r.subcategory));
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [classFilteredResources, activeCategory]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory('All');
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-3 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-x-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <BookMarked size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-text-primary tracking-tight">
              Formula <span className="text-primary">Sheets</span>
            </h2>
            <p className="text-text-tertiary text-xs max-w-xl leading-relaxed mt-0.5">
              View inline or download exam-ready cheat sheets and reference materials.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-[var(--color-primary-dark)] px-3 py-1 bg-white/70 dark:bg-slate-800/70 border border-primary/20 rounded-full shrink-0 shadow-xs flex items-center gap-1.5">
          <FileText size={12} />
          {totalItems} Resources Available
        </span>
      </div>

      {/* Search + Category + Subcategory */}
      {allResourcesList.length > 0 && (
        <div className="flex flex-col gap-3 mb-2 px-1">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search formula sheets..."
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
      )}

      {/* Cards Grid or Empty State */}
      {loading ? (
        <Loader text="Loading formula sheets..." />
      ) : allResourcesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-color border border-dashed border-border-color rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText size={28} className="text-primary/50" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-base text-text-primary">No resources yet</p>
            <p className="text-text-secondary text-sm mt-1">Formula sheets and study materials will appear here once uploaded.</p>
          </div>
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-color border border-dashed border-border-color rounded-3xl">
          <Search size={32} className="text-text-tertiary" />
          <div className="text-center">
            <p className="font-semibold text-sm text-text-secondary">No resources match your filters.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); setActiveSubcategory('All'); }}
              className="mt-2 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...resources].sort(sortLecturesNaturally).map((res, idx) => {
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => handleViewResource(res)}
                  className="group cursor-pointer rounded-3xl bg-bg-color border border-border-color p-4 hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 text-left justify-between"
                >
                  <div className="flex flex-col gap-3">
                    {/* Thumbnail / Card Top */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-secondary border border-border-color/40">
                      {res.thumbnail_url ? (
                        <img
                          src={getFileUrl(res.thumbnail_url)}
                          alt={res.title}
                          className="w-full h-full object-contain p-1 rounded-lg bg-slate-900 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.target.onerror = null; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-primary/40">
                          <FileText size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Eye size={20} className="ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center backdrop-blur-sm z-20">
                        PDF
                      </span>
                    </div>

                    <div>
                      {/* Tags Row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                          {res.category || 'General'}
                        </span>
                        {res.subcategory && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border-color rounded-full">
                            {res.subcategory}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 mt-2 leading-snug group-hover:text-primary transition-colors" title={res.title}>
                        {res.title}
                      </h3>
                    </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="flex items-center justify-between text-xxs font-extrabold mt-4 pt-3 border-t border-border-color/65">
                    <span className="text-text-tertiary flex items-center gap-1">
                      <FileText size={11} className="fill-current" />
                      <span>FORMULA SHEET</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResource(res);
                        }}
                        className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/10 hover:text-primary text-text-secondary border border-border-color transition-colors cursor-pointer"
                        title="View PDF"
                      >
                        <Eye size={13} />
                      </button>
                      <a
                        href={`${BACKEND_URL}/api/resources/${res.id}/download`}
                        onClick={(e) => e.stopPropagation()}
                        download
                        className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/10 hover:text-primary text-text-secondary border border-border-color transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                </motion.div>
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

      {selectedResource && createPortal(
        <AnimatePresence>
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedResource(null)}
          >
            <div
              className="bg-bg-color rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6 border-b border-border-color flex justify-between items-center bg-bg-secondary">
                <h3 className="font-display font-bold text-lg md:text-xl text-text-primary line-clamp-1 pr-6">
                  {selectedResource.title}
                </h3>
                <div className="flex items-center gap-2 pr-6">
                  <a
                    href={`${BACKEND_URL}/api/resources/${selectedResource.id}/download`}
                    download
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-0 shadow-md decoration-none hover:no-underline"
                  >
                    <Download size={13} /> Download
                  </a>
                  <button
                    onClick={() => {
                      window.open(`/viewer/resource/${selectedResource.id}`, '_blank');
                      setSelectedResource(null);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-0 shadow-md"
                  >
                    <Maximize size={13} /> Full Screen
                  </button>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-900 relative">
                <iframe
                  src={`${BACKEND_URL}/api/resources/${selectedResource.id}/view`}
                  className="w-full h-full border-0"
                  title={selectedResource.title}
                />
              </div>
            </div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ResourceTab;
