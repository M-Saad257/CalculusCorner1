import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, Download, Eye, X, LayoutGrid, FileText,
  Archive, Book, FileSpreadsheet, File, ChevronRight, Maximize
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const styleOptions = [
  { icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' }
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const BooksTab = ({ studentClass }) => {
  const [allBooksList, setAllBooksList] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { socket } = useSocket();

  // Filter books strictly by student class if student is logged in
  const classFilteredBooks = useMemo(() => {
    if (!studentClass || studentClass === 'All') return allBooksList;
    const target = studentClass.trim().toLowerCase();
    const matched = allBooksList.filter(b => {
      if (!b.category) return false;
      const cat = b.category.trim().toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matched;
  }, [allBooksList, studentClass]);

  const categories = useMemo(() => {
    if (studentClass && studentClass !== 'All') {
      return [studentClass];
    }
    const cats = new Set(classFilteredBooks.map(b => b.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [classFilteredBooks, studentClass]);

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

  React.useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);


  // Load all metadata once for filters
  const loadBooksMetadata = async () => {
    try {
      const res = await api.get('/books');
      if (res.data?.data) setAllBooksList(res.data.data);
    } catch (_) { }
  };

  // Load paginated data
  const loadPaginatedBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/books', {
        params: {
          page: currentPage,
          limit: 6,
          category: activeCategory,
          subcategory: activeSubcategory,
          search: search
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBooks(res.data.data);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (_) { }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadBooksMetadata();
  }, []);

  useEffect(() => {
    loadPaginatedBooks();
  }, [activeCategory, activeSubcategory, search, currentPage]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      loadBooksMetadata();
      loadPaginatedBooks();
    };
    socket.on('book:create', refresh);
    socket.on('book:update', refresh);
    socket.on('book:delete', refresh);
    return () => {
      socket.off('book:create', refresh);
      socket.off('book:update', refresh);
      socket.off('book:delete', refresh);
    };
  }, [socket, activeCategory, activeSubcategory, search, currentPage]);

  // Reset subcategory when category changes
  useEffect(() => {
    setActiveSubcategory('All');
    setCurrentPage(1);
  }, [activeCategory]);

  const subcategories = useMemo(() => {
    const targetBooks = activeCategory === 'All'
      ? classFilteredBooks
      : classFilteredBooks.filter(b => (b.category || '').toLowerCase() === activeCategory.toLowerCase());
    const subs = new Set(targetBooks.filter(b => b.subcategory).map(b => b.subcategory));
    return subs.size > 0 ? ['All', ...Array.from(subs).sort()] : [];
  }, [classFilteredBooks, activeCategory]);

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
        {!loading && allBooksList.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-color border border-border-color rounded-full text-xs font-bold text-text-secondary shadow-sm">
            <BookOpen size={13} className="text-primary" />
            {totalItems} {totalItems === 1 ? 'Book' : 'Books'} Available
          </span>
        )}
      </div>

      {/* Search + Filters */}
      {allBooksList.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
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
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${activeCategory === cat
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
                  onClick={() => { setActiveSubcategory(sub); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeSubcategory === sub
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
        <div className="col-span-full">
          <Loader text="Loading premium books catalog..." />
        </div>
      ) : allBooksList.length === 0 ? (
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
      ) : books.length === 0 ? (
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map((book, idx) => {
              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => {
                    api.post('/content/track', {
                      type: 'book',
                      id: book.id
                    }).catch(() => { });

                    window.open(`/viewer/book/${book.id}`, '_blank');
                  }}
                  className="group cursor-pointer rounded-3xl bg-bg-color border border-border-color p-4 hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 text-left justify-between"
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* Thumbnail / Card Top */}
                    <div className="relative w-44 aspect-[3/4] rounded-xl overflow-hidden bg-bg-secondary border border-border-color/40 shadow-md">
                      {book.thumbnail_url ? (
                        <img
                          src={`${BACKEND_URL}${book.thumbnail_url}`}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-primary/40">
                          <BookOpen size={40} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <BookOpen size={20} />
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm z-20">
                        BOOK
                      </span>
                    </div>

                    <div className="w-full">
                      {/* Tags Row */}
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                          {book.category || "General"}
                        </span>

                        {book.subcategory && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border-color rounded-full">
                            {book.subcategory}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className="font-display font-bold text-sm text-center text-text-primary line-clamp-2 mt-3 leading-snug group-hover:text-primary transition-colors"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                    </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="flex items-center justify-between text-xxs font-extrabold mt-4 pt-3 border-t border-border-color/65">
                    <span className="text-text-tertiary flex items-center gap-1">
                      <BookOpen size={11} className="fill-current" />
                      <span>READ BOOK</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          api.post('/content/track', {
                            type: 'book',
                            id: book.id
                          }).catch(() => { });

                          window.open(`/viewer/book/${book.id}`, '_blank');
                        }}
                        className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/10 hover:text-primary text-text-secondary border border-border-color transition-colors cursor-pointer"
                        title="Read Book"
                      >
                        <Eye size={13} />
                      </button>
                      <a
                        href={`${BACKEND_URL}/api/books/${book.id}/download`}
                        onClick={(e) => e.stopPropagation()}
                        download
                        className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/10 hover:text-primary text-text-secondary border border-border-color transition-colors cursor-pointer"
                        title="Download Book"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 bg-bg-color p-3 rounded-2xl border border-border-color shadow-sm w-fit mx-auto flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${currentPage === pageNum
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

      {/* Book Viewer Modal */}
    </div>
  );
};

export default BooksTab;
