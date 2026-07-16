import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, Search, Download, FileText, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const PastPapersPage = () => {
  const [videos, setVideos] = useState([]);
  const [dbPdfs, setDbPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'pdfs'

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  const fetchPastPaperData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch solved videos
      const resVids = await api.get('/content/videos');
      if (resVids.data && Array.isArray(resVids.data.data)) {
        setVideos(resVids.data.data);
      }

      // 2. Fetch solved books/notes PDFs
      try {
        const resBooks = await api.get('/books');
        const books = resBooks.data?.data || [];
        
        const resResources = await api.get('/resources');
        const resources = resResources.data?.data || [];
        
        const combined = [...books, ...resources];
        const filteredPdfs = combined.filter(item => 
          item.is_past_paper === 1
        );
        setDbPdfs(filteredPdfs);
      } catch (pdfErr) {
        console.error('Failed to load past paper books:', pdfErr);
      }

    } catch (err) {
      console.error('Failed to load past paper videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastPaperData();
    window.scrollTo(0, 0);
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchPastPaperData();
    socket.on('video:create', refreshData);
    socket.on('video:update', refreshData);
    socket.on('video:delete', refreshData);
    socket.on('resource:create', refreshData);
    socket.on('resource:update', refreshData);
    socket.on('resource:delete', refreshData);
    socket.on('book:create', refreshData);
    socket.on('book:update', refreshData);
    socket.on('book:delete', refreshData);

    return () => {
      socket.off('video:create', refreshData);
      socket.off('video:update', refreshData);
      socket.off('video:delete', refreshData);
      socket.off('resource:create', refreshData);
      socket.off('resource:update', refreshData);
      socket.off('resource:delete', refreshData);
      socket.off('book:create', refreshData);
      socket.off('book:update', refreshData);
      socket.off('book:delete', refreshData);
    };
  }, [socket]);

  // Filter dynamic database videos that are past papers
  const filteredVideos = videos.filter(vid => 
    vid.is_past_paper === 1
  ).filter(vid => vid.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filter database PDFs that are past papers
  const filteredPdfs = dbPdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (pdf) => {
    if (pdf.downloadUrl && pdf.downloadUrl !== '#') {
      window.open(pdf.downloadUrl, '_blank');
      return;
    }
    
    const fileUrl = pdf.file_url || pdf.url;
    if (fileUrl) {
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${import.meta.env.VITE_BACKEND_URL || ''}${fileUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      alert(`Downloading "${pdf.title}" is in demo mode.`);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-28 pb-16 bg-transparent relative z-10 w-full text-left">
        
        {/* Hero Section */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black font-display text-text-primary tracking-tight">
              Solved Past Papers
            </h1>
            <p className="text-text-secondary text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              Ace your upcoming exams with solved past paper video walkthroughs and PDF solutions.
            </p>
          </div>
        </div>

        {/* Section List */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-border-color/80">
            {/* Tabs selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === 'videos'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-bg-color text-text-secondary border-border-color hover:bg-bg-tertiary'
                }`}
              >
                Solved Video Papers
              </button>
              <button
                onClick={() => setActiveTab('pdfs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === 'pdfs'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-bg-color text-text-secondary border-border-color hover:bg-bg-tertiary'
                }`}
              >
                Solved PDFs & Documents
              </button>
            </div>
            
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
              <input
                type="text"
                placeholder={`Search past ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-color border border-border-color rounded-xl font-sans text-xs md:text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin mr-2"></div>
              Loading solved papers...
            </div>
          ) : (
            <div>
              {activeTab === 'videos' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredVideos.map((video, idx) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        onClick={() => setSelectedVideo(video)}
                        className="p-4 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left group cursor-pointer"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-bg-secondary flex-shrink-0">
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-text-tertiary">
                                <Film size={32} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <div className="px-4 py-2 bg-white/20 text-white rounded-full text-xs font-bold transition-all backdrop-blur-md">
                                Play Solved Video
                              </div>
                            </div>
                            <div className="absolute top-3 left-3">
                              <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 rounded bg-bg-color/90 text-text-primary shadow-sm border border-border-color/60">
                                {video.subcategory || video.category || 'Past Paper'}
                              </span>
                            </div>
                          </div>
                          
                          <h3 className="font-display font-bold text-sm text-text-primary m-0 line-clamp-2" title={video.title}>
                            {video.title}
                          </h3>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-color/60 text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                          <span>{video.subcategory || 'Board Exam'}</span>
                          <span className="text-primary hover:underline flex items-center gap-1 font-extrabold">
                            Play <Play size={10} className="fill-primary" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredVideos.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-secondary gap-2 border-2 border-dashed border-border-color rounded-2xl bg-bg-color">
                      <Film size={40} className="text-text-tertiary" />
                      <p className="text-sm">No solved past paper videos found.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredPdfs.map((pdf, idx) => (
                      <motion.div
                        key={pdf.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        className="p-5 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText size={24} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex gap-2 items-center">
                              <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-bg-secondary text-text-primary border border-border-color/60">
                                {pdf.subcategory || pdf.category || 'Past Paper'}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-sm text-text-primary m-0 line-clamp-2">{pdf.title}</h3>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color/60">
                          <button
                            onClick={() => handleDownload(pdf)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white border-0 text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-sm shadow-primary/20"
                          >
                            <Download size={14} /> Download PDF
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredPdfs.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-secondary gap-2 border-2 border-dashed border-border-color rounded-2xl bg-bg-color">
                      <FileText size={40} className="text-text-tertiary" />
                      <p className="text-sm">No solved past paper PDFs found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Embedded Iframe Player Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-bg-color rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-border-color relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 md:p-6 border-b border-border-color flex justify-between items-center bg-bg-secondary">
                  <h3 className="font-display font-bold text-base md:text-lg text-text-primary line-clamp-1 pr-6">
                    {selectedVideo.title}
                  </h3>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                  <iframe
                    src={getEmbedUrl(selectedVideo.url)}
                    title={selectedVideo.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <Footer />
    </>
  );
};

export default PastPapersPage;
