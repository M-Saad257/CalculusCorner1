import React, { useState, useMemo } from 'react';
import { FileText, Download, BookMarked, Eye, X, Search, LayoutGrid, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const ResourceTab = ({ resources, getFileUrl }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [resources]);

  const subcategories = useMemo(() => {
    if (activeCategory === 'All') return [];
    const subs = new Set(
      resources
        .filter(r => (r.category || 'General') === activeCategory && r.subcategory)
        .map(r => r.subcategory)
    );
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [resources, activeCategory]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory('All');
  };

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchCat = activeCategory === 'All' || (r.category || 'General') === activeCategory;
      const matchSub = activeSubcategory === 'All' || r.subcategory === activeSubcategory;
      const matchSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSub && matchSearch;
    });
  }, [resources, activeCategory, activeSubcategory, search]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-3 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-x-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <BookMarked size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-text-primary leading-tight">
              Formula <span className="text-gradient">Sheets</span>
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">View inline or download exam-ready cheat sheets and reference materials.</p>
          </div>
        </div>
        {resources.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-bg-color border border-border-color rounded-full text-xs font-bold text-text-secondary shadow-sm">
            <FileText size={13} className="text-primary" />
            {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'} Available
          </span>
        )}
      </div>

      {/* Search + Category + Subcategory */}
      {resources.length > 0 && (
        <div className="flex flex-col gap-3 mb-2 px-1">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
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

      {/* Cards Grid or Empty State */}
      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-color border border-dashed border-border-color rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText size={28} className="text-primary/50" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-base text-text-primary">No resources yet</p>
            <p className="text-text-secondary text-sm mt-1">Formula sheets and study materials will appear here once uploaded.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((res, idx) => {
            const palettes = [
              { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', tag: 'bg-blue-500/15 text-blue-400' },
              { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', tag: 'bg-violet-500/15 text-violet-400' },
              { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', tag: 'bg-emerald-500/15 text-emerald-400' },
              { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', tag: 'bg-amber-500/15 text-amber-400' },
              { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', tag: 'bg-rose-500/15 text-rose-400' },
            ];
            const palette = palettes[idx % palettes.length];

            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="group relative bg-bg-color border border-border-color rounded-3xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Thumbnail / Card Top */}
                <div className={`w-full h-32 overflow-hidden ${palette.bg} flex items-center justify-center relative border-b border-border-color/45`}>
                  {res.thumbnail_url ? (
                    <img
                      src={getFileUrl(res.thumbnail_url)}
                      alt={res.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <FileText size={36} className={`${palette.text} opacity-40`} />
                  )}
                </div>

                <div className="p-5 flex flex-col gap-4 grow">
                  {/* Tags Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-tertiary flex items-center gap-1.5">
                      <FileText size={13} className={palette.text} /> PDF
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${palette.tag}`}>
                        {res.category || 'General'}
                      </span>
                      {res.subcategory && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border-color/60">
                          {res.subcategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="grow">
                    <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {res.title}
                    </h3>
                    {res.description && (
                      <p className="text-text-secondary text-xs mt-1.5 line-clamp-2 leading-relaxed">{res.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setSelectedResource(res)}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${palette.bg} ${palette.text} ${palette.border} hover:opacity-80 cursor-pointer bg-transparent`}
                    >
                      <Eye size={13} />
                      View Notes
                    </button>
                    <a
                      href={`/api/student/resources/${res.id}/download?token=${localStorage.getItem('token')}`}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold border border-border-color text-text-secondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all dark:bg-bg-secondary"
                      download
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Iframe Viewer Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedResource && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
              onClick={() => setSelectedResource(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.45 }}
                className="bg-bg-color rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <FileText size={15} className="text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-base text-text-primary line-clamp-1 pr-4">
                      {selectedResource.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/student/resources/${selectedResource.id}/download?token=${localStorage.getItem('token')}`}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl transition-colors"
                    >
                      <Download size={13} />
                      Download
                    </a>
                    <button
                      onClick={() => setSelectedResource(null)}
                      className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Iframe */}
                <div className="flex-grow bg-bg-secondary flex items-center justify-center relative">
                  <iframe
                    src={`/api/resources/${selectedResource.id}/view`}
                    title={selectedResource.title}
                    className="w-full h-full border-0"
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

export default ResourceTab;
