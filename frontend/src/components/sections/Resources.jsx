import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, Book, Archive, File, Search } from 'lucide-react';
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

const DEFAULT_CATEGORIES = ['All', 'Calculus', 'Trigonometry', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'General'];

const Resources = ({ isTab = false }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [resources, setResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const deriveSizeLabel = (url = '') => {
      const lower = url.toLowerCase();
      if (lower.endsWith('.pdf')) return 'PDF';
      if (lower.endsWith('.docx')) return 'DOCX';
      if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'PPT';
      if (lower.endsWith('.xlsx')) return 'XLSX';
      if (lower.endsWith('.zip')) return 'ZIP';
      return 'Resource';
    };

    const loadResources = async () => {
      try {
        const res = await api.get('/resources');
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((item, index) => {
            const option = styleOptions[index % styleOptions.length];
            const fileSource = item.original_filename || item.file_url || '';
            return {
              id: item.id,
              title: item.title || 'Study Resource',
              category: item.category || 'General',
              icon: option.icon,
              size: deriveSizeLabel(fileSource),
              bgColor: option.bgColor,
              file_url: item.file_url || '',
            };
          });
          setResources(mapped);
        }
      } catch (err) {
      }
    };

    loadResources();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const loadResources = async () => {
      try {
        const res = await api.get('/resources');
        if (res.data && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((item, index) => {
            const option = styleOptions[index % styleOptions.length];
            const fileSource = item.original_filename || item.file_url || '';
            const deriveSizeLabel = (url = '') => {
              const lower = url.toLowerCase();
              if (lower.endsWith('.pdf')) return 'PDF';
              if (lower.endsWith('.docx')) return 'DOCX';
              if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'PPT';
              if (lower.endsWith('.xlsx')) return 'XLSX';
              if (lower.endsWith('.zip')) return 'ZIP';
              return 'Resource';
            };
            return {
              id: item.id,
              title: item.title || 'Study Resource',
              category: item.category || 'General',
              icon: option.icon,
              size: deriveSizeLabel(fileSource),
              bgColor: option.bgColor,
              file_url: item.file_url || '',
            };
          });
          setResources(mapped);
        }
      } catch (err) {
      }
    };

    socket.on('resource:create', loadResources);
    socket.on('resource:update', loadResources);
    socket.on('resource:delete', loadResources);

    return () => {
      socket.off('resource:create', loadResources);
      socket.off('resource:update', loadResources);
      socket.off('resource:delete', loadResources);
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

  const categoriesList = Array.from(
    new Set([
      'All',
      ...DEFAULT_CATEGORIES.filter(c => c !== 'All'),
      ...resources.map(v => v.category).filter(Boolean)
    ])
  );

  const filteredResources = resources.filter(resource => 
    (activeCategory === 'All' || resource.category === activeCategory) &&
    resource.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id={!isTab ? "resources" : undefined} className={isTab ? "relative" : "py-16 md:py-24 bg-bg-secondary relative"} ref={containerRef}>
      <div className={isTab ? "" : "container mx-auto px-4 md:px-8"}>
        
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-left">
            <div className="max-w-2xl">
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
               Notes Library
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight mb-4">
                Downloadable <span className="text-gradient">Study Materials</span>
              </h2>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed">
                Get instant access to a growing library of high-quality PDF notes and formula sheets — built to work alongside your video lessons and quizzes.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto items-end">
              <Button
                variant="outline"
                className="self-start md:self-auto px-5 py-2.5 text-sm shrink-0"
                onClick={() => window.location.href = '/df-library'}
              >
                Browse PDF Library
              </Button>
              <div className="relative w-full max-w-sm mt-2 md:mt-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  className="w-full pl-11 pr-4 py-2.5 border border-border-color rounded-full font-sans text-sm bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

        {isTab && (
          <div className="relative w-full max-w-sm mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="w-full pl-11 pr-4 py-2.5 border border-border-color rounded-full font-sans text-sm bg-white shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

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

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {filteredResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <motion.div 
                key={resource.id} 
                variants={itemVariants} 
                className="group flex flex-col p-6 rounded-2xl bg-white border border-border-color shadow-sm hover:shadow-lg hover:border-primary-light/50 hover:-translate-y-1 transition-all duration-300 glass text-left"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-inner ${resource.bgColor}`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xxs font-extrabold tracking-wide uppercase text-text-secondary bg-bg-secondary px-3 py-1 rounded-full border border-border-color/50">
                    {resource.category}
                  </span>
                </div>
                
                <h3 className="font-display font-bold text-lg text-text-primary mb-8 grow">
                  {resource.title}
                </h3>
                
                <div className="flex items-center justify-between border-t border-border-color pt-4">
                  <span className="text-xs text-text-tertiary font-semibold">
                    {resource.size}
                  </span>

                  <a
                    href={`http://localhost:5173/api/resources/${resource.id}/download`}
                    download
                    className="flex items-center gap-2 bg-transparent text-primary font-bold text-sm group-hover:scale-105 group-hover:text-primary-dark transition-all duration-200"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                </div> 
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

export default Resources;
