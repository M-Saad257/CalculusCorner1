import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, Download, Eye, X, LayoutGrid, FileText,
  Archive, Book, FileSpreadsheet, File, ChevronRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const styleOptions = [
  { icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  { icon: Archive, bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
  { icon: Book, bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
  { icon: FileSpreadsheet, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  { icon: File, bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  { icon: BookOpen, bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const BooksTab = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const { socket } = useSocket();

  const loadBooks = async () => {
    try {
      const res = await api.get('/books');
      if (res.data?.data) setBooks(res.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadBooks(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('book:create', loadBooks);
    socket.on('book:update', loadBooks);
    socket.on('book:delete', loadBooks);
    return () => {
      socket.off('book:create', loadBooks);
      socket.off('book:update', loadBooks);
      socket.off('book:delete', loadBooks);
    };
  }, [socket]);

  // Reset subcategory when category changes
  useEffect(() => { setActiveSubcategory('All'); }, [activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(books.map(b => b.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [books]);

  const subcategories = useMemo(() => {
    if (activeCategory === 'All') return [];
    const subs = new Set(
      books.filter(b => b.category === activeCategory && b.subcategory).map(b => b.subcategory)
    );
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [books, activeCategory]);

  const filtered = useMemo(() => {
    return books.filter(b => {
      const matchCat = activeCategory === 'All' || b.category === activeCategory;
      const matchSub = activeSubcategory === 'All' || b.subcategory === activeSubcategory;
      const matchSearch = !search.trim() || b.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSub && matchSearch;
    });
  }, [books, activeCategory, activeSubcategory, search]);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn text-left">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Books Library</h2>
          <p className="text-text-secondary text-sm mt-1">
            Browse, view and download premium reference books and study materials.
          </p>
        </div>
        {!loading && books.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-color border border-border-color rounded-full text-xs font-bold text-text-secondary shadow-sm">
            <BookOpen size={13} className="text-primary" />
            {books.length} {books.length === 1 ? 'Book' : 'Books'} Available
          </span>
        )}
      </div>

      {/* Search + Filters */}
      {!loading && books.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books by title..."
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
                onClick={() => setActiveCategory(cat)}
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

          {/* Subcategory Pills — only shown when a category is selected and has subcategories */}
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
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300 shadow-sm'
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

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        /* Empty state — no books at all */
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-color border border-dashed border-border-color rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={28} className="text-primary/50" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-base text-text-primary">No books yet</p>
            <p className="text-text-secondary text-sm mt-1">Books will appear here once uploaded by the admin.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state — filters/search returned nothing */
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-color border border-dashed border-border-color rounded-3xl">
          <Search size={32} className="text-text-tertiary" />
          <div className="text-center">
            <p className="font-semibold text-sm text-text-secondary">No books match your filters.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); setActiveSubcategory('All'); }}
              className="mt-2 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((book, idx) => {
            const style = styleOptions[idx % styleOptions.length];
            const Icon = style.icon;
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="group relative bg-bg-color border border-border-color rounded-3xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Category badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {book.subcategory || book.category || 'Book'}
                  </span>
                </div>

                {/* Thumbnail / Icon */}
                <div className={`w-full h-36 overflow-hidden ${style.bg} flex items-center justify-center relative`}>
                  {book.thumbnail_url ? (
                    <img
                      src={`${BACKEND_URL}${book.thumbnail_url}`}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Icon size={40} className={`${style.text} opacity-40`} />
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 grow">
                  <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => setSelectedBook(book)}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${style.bg} ${style.text} ${style.border} hover:opacity-80 bg-transparent`}
                    >
                      <Eye size={13} />
                      View
                    </button>
                    <a
                      href={`${BACKEND_URL}/api/books/${book.id}/download`}
                      download
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold border border-border-color text-text-secondary hover:text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all dark:bg-bg-secondary"
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

      {/* Book Viewer Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
              onClick={() => setSelectedBook(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.45 }}
                className="bg-bg-color rounded-3xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <BookOpen size={15} className="text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-base text-text-primary line-clamp-1 pr-4">
                      {selectedBook.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`${BACKEND_URL}/api/books/${selectedBook.id}/download`}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl transition-colors"
                    >
                      <Download size={13} />
                      Download
                    </a>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* PDF Iframe */}
                <div className="flex-grow bg-bg-secondary flex items-center justify-center relative">
                  <iframe
                    src={`/api/books/${selectedBook.id}/view`}
                    title={selectedBook.title}
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

export default BooksTab;
