import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, Book, Archive, File, Search, Image as ImageIcon } from 'lucide-react';
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
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [Books, setBooks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Dynamically extract categories that actually have notes
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

  if (homeOnly) {
    filteredBooks = filteredBooks.filter(book => book.metadata?.show_on_home);
  }

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
                  Get instant access to a growing library of high-quality PDF notes and formula sheets — built to work alongside your video lessons and quizzes.
                </p>
              </div>
            )}
            {(!isTab || hideHeader) && (
              <div className="relative w-full md:w-auto mt-4 md:mt-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search notes..." 
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
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                    activeCategory === category 
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      activeSubcategory === subcat 
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

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-0"
          >
            {filteredBooks.map((Book, index) => {
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
                  <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden bg-slate-100/50 group-hover:bg-primary/5 transition-colors">
                    {Book.thumbnail_url ? (
                      <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${Book.thumbnail_url}`} alt={Book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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

                <div className="mt-4 pt-4 border-t border-border-color flex justify-between items-center w-full">
                  <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <FileText size={14} className="opacity-70" />
                    Note
                  </span>
                  <a 
                    href={`http://localhost:5173/api/admin/Books/${Book.id}/download`}
                    download
                    className="flex items-center gap-1.5 text-primary hover:text-primary-dark font-semibold text-sm transition-colors p-2 -mr-2 rounded-lg hover:bg-primary/5"
                  >
                    <span className="sr-only sm:not-sr-only sm:block">Download</span>
                    <Download size={16} />
                  </a>
                </div>
              </motion.div>
            )})}
          </motion.div>
          
          {filteredBooks.length === 0 && (
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

      </div>
    </section>
  );
};

export default Books;
