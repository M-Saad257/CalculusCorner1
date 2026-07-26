import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Download, FileSpreadsheet, Book, Archive, File, Search, Image as ImageIcon, Eye, X, ArrowRight, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import Button from '../ui/Button';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const styleOptions = [
  { icon: FileText, bgColor: 'bg-blue-50 text-blue-600' },
  { icon: Archive, bgColor: 'bg-purple-50 text-purple-600' },
  { icon: Book, bgColor: 'bg-pink-50 text-pink-600' },
  { icon: FileSpreadsheet, bgColor: 'bg-emerald-50 text-emerald-600' },
  { icon: File, bgColor: 'bg-amber-50 text-amber-600' },
  { icon: Book, bgColor: 'bg-red-50 text-red-600' },
];

const Books = ({ isTab = false, hideHeader = false, homeOnly = false }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [Books, setBooks] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  const handleViewBook = (book) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
      window.open(`${import.meta.env.VITE_BACKEND_URL || ''}/api/books/${book.id}/view`, '_blank');
    } else {
      setSelectedBook(book);
    }
  };

  const loadBooks = async () => {
    try {
      const res = await api.get('/books');
      if (res.data && Array.isArray(res.data.data)) {
        setBooks(res.data.data);
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && Books.length > 0) {
        const u = JSON.parse(userStr);
        const userClass = u?.class || u?.grade || null;
        if (userClass) {
          const matched = Books.find(b => (b.category || '').toLowerCase() === userClass.toLowerCase() || (b.category || '').toLowerCase().includes(userClass.toLowerCase()));
          if (matched && matched.category) {
            setActiveCategory(matched.category);
          }
        }
      }
    } catch (e) { }
  }, [Books]);

  const { socket } = useSocket();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Dynamically extract categories that actually have books
  const categoriesList = Array.from(
    new Set(['All', ...Books.map(v => v.category).filter(Boolean)])
  );

  // Dynamically extract subcategories based on the active category
  const subcategoriesList = Array.from(
    new Set(['All', ...Books.filter(r => r.category === activeCategory && r.subcategory).map(r => r.subcategory)])
  );

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeCategory]);

  let filteredBooks = Books.filter(Book => {
    const matchesCat = activeCategory === 'All' || Book.category === activeCategory;
    const matchesSub = activeSubcategory === 'All' || Book.subcategory === activeSubcategory;
    const matchesSearch = Book.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSub && matchesSearch;
  });

  const displayBooks = useMemo(() => {
    if (homeOnly) {
      return Books.filter(book => book.show_on_homepage === 1 || book.showOnHomepage === 1 || book.metadata?.show_on_home);
    }
    const pinned = Books.filter(book => book.show_on_homepage === 1 || book.showOnHomepage === 1 || book.metadata?.show_on_home);
    const unpinned = Books.filter(book => book.show_on_homepage !== 1 && book.showOnHomepage !== 1 && !book.metadata?.show_on_home);
    const combined = [...pinned, ...unpinned];
    return combined.filter(Book => {
      const matchesCat = activeCategory === 'All' || Book.category === activeCategory;
      const matchesSub = activeSubcategory === 'All' || Book.subcategory === activeSubcategory;
      const matchesSearch = Book.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSub && matchesSearch;
    });
  }, [Books, homeOnly, activeCategory, activeSubcategory, searchQuery]);

  return (
    <section id={!isTab ? "Books" : undefined} className={isTab ? "relative" : "py-10 md:py-16 bg-bg-secondary/70 backdrop-blur-[2px] relative"} ref={containerRef}>
      <div className={isTab ? "" : "container mx-auto px-4 md:px-8"}>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 text-left">
          {!hideHeader && (
            <div className="max-w-2xl">
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
                Premium Books Library
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight mb-4">
                Premium <span className="text-gradient">Books</span>
              </h2>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed">
                Get instant access to a growing library of high-quality PDF books and formula sheets, built to work alongside your video lessons and quizzes.
              </p>
            </div>
          )}
          {(!isTab || hideHeader) && (
            <div className="relative w-full md:w-auto mt-4 md:mt-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search books..."
                className="w-full md:w-64 pl-11 pr-4 py-3 rounded-full border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={`grid gap-6 mb-0 ${homeOnly ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
        >
          {displayBooks.map((Book, index) => {
            const option = styleOptions[index % styleOptions.length];
            const Icon = option.icon;
            return (
              <motion.div
                key={Book.id}
                variants={itemVariants}
                className="group relative p-4 rounded-2xl bg-bg-color border border-border-color shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col justify-between text-left h-full"
              >
                <div className="absolute top-4 right-4 z-10">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${option.bgColor}`}>
                    {Book.subcategory ? Book.subcategory : Book.category}
                  </span>
                </div>

                <div className="flex flex-col flex-grow">
                  <div className="relative w-full aspect-video mb-4 rounded-xl overflow-hidden bg-slate-100/50 group-hover:bg-primary/5 transition-colors">
                    {Book.thumbnail_url ? (
                      <img src={`${import.meta.env.VITE_BACKEND_URL || ''}${Book.thumbnail_url}`} alt={Book.title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className={`w-12 h-12 opacity-50 ${option.bgColor.split(' ')[1]}`} />
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-lg text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {Book.title}
                  </h3>
                </div>

                <div className="mt-4 pt-4 border-t border-border-color flex justify-between items-center w-full gap-2">
                  <button
                    onClick={() => handleViewBook(Book)}
                    className="flex items-center gap-1.5 text-primary hover:text-primary-dark font-bold text-xs transition-colors py-2 px-3 rounded-lg hover:bg-primary/5 cursor-pointer border border-primary/20 bg-transparent"
                  >
                    <Eye size={14} />
                    <span>View Book</span>
                  </button>
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL || ''}/api/books/${Book.id}/download`}
                    download
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-xs transition-colors py-2 px-3 rounded-lg hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-600/20"
                  >
                    <span>Download</span>
                    <Download size={14} />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {displayBooks.length === 0 && (
          <div className="py-16 px-4 text-center border-2 border-dashed border-border-color rounded-3xl bg-bg-color">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">New Books Coming Soon!</h3>
            <p className="text-text-secondary mx-auto">
              Sir Mehtab is actively compiling and publishing new reference books, stay tuned, they will be available here soon!
            </p>
          </div>
        )}

        {homeOnly && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate('/enroll')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-105 transition-all duration-300 cursor-pointer border-0 text-sm"
            >
              <span>More Books</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {createPortal(
        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setSelectedBook(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-bg-color rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-color relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 md:p-6 border-b border-border-color flex justify-between items-left bg-bg-secondary">
                  <h3 className="font-display font-bold text-lg md:text-xl text-text-primary line-clamp-1 pr-6">
                    {selectedBook.title}
                  </h3>
                  <div className="flex items-left gap-2 pr-6">
                    <a
                      href={`${import.meta.env.VITE_BACKEND_URL || ''}/api/books/${selectedBook.id}/download`}
                      download
                      style={{
                        color:'white'
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-0 shadow-md decoration-none hover:no-underline"
                    >
                      <Download size={13} /> Download
                    </a>
                    <button
                      onClick={() => {
                        window.open(`/viewer/book/${selectedBook.id}`, '_blank');
                        setSelectedBook(null);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-0 shadow-md"
                    >
                      <ExternalLink size={13} /> Full Screen
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 w-full bg-slate-900 relative">
                  <iframe
                    src={`${import.meta.env.VITE_BACKEND_URL || ''}/api/books/${selectedBook.id}/view`}
                    className="w-full h-full border-0"
                    title={selectedBook.title}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      </div>
    </section>
  );
};

export default Books;
