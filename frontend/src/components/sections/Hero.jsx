import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, Target, Bot, Star, Brain, CheckCircle2, Award, User } from 'lucide-react';
import Button from '../ui/Button';
import { useContent } from '../../context/ContentContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const Hero = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const heroData = content?.hero || {};
  const aboutData = content?.about || {};
  const { socket } = useSocket();

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "-30% 0px -30% 0px" });

  const [announcements, setAnnouncements] = useState([]);

  const token = localStorage.getItem("token");

  const formatLink = (url) => {
    if (!url) return '#';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/content/announcements');
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setAnnouncements(response.data.data);
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
      }
    };
    fetchAnnouncements();

    if (socket) {
      const handleCreate = (newAnn) => {
        setAnnouncements(prev => {
          if (prev.find(a => a.id === newAnn.id)) return prev;
          const updated = [...prev, newAnn];
          return updated.sort((a, b) => {
            if (a.display_order !== b.display_order) return a.display_order - b.display_order;
            if (a.priority !== b.priority) return b.priority - a.priority;
            return new Date(b.created_at) - new Date(a.created_at);
          });
        });
      };

      const handleUpdate = (updatedAnn) => {
        setAnnouncements(prev => {
          if (!updatedAnn.active) {
            return prev.filter(a => a.id !== updatedAnn.id);
          }
          const exists = prev.find(a => a.id === updatedAnn.id);
          const updated = exists
            ? prev.map(a => a.id === updatedAnn.id ? updatedAnn : a)
            : [...prev, updatedAnn];
          return updated.sort((a, b) => {
            if (a.display_order !== b.display_order) return a.display_order - b.display_order;
            if (a.priority !== b.priority) return b.priority - a.priority;
            return new Date(b.created_at) - new Date(a.created_at);
          });
        });
      };

      const handleDelete = ({ id }) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      };

      socket.on('announcement:create', handleCreate);
      socket.on('announcement:update', handleUpdate);
      socket.on('announcement:delete', handleDelete);

      return () => {
        socket.off('announcement:create', handleCreate);
        socket.off('announcement:update', handleUpdate);
        socket.off('announcement:delete', handleDelete);
      };
    }
  }, [socket]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const floatingCardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80, delay: 0.5 }
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "/SirMehtabPhoto.webp";

    url = url.replace('localost', 'localhost');

    if (url.startsWith("/uploads")) {
      // Serve uploads from the backend running on port 5000
      return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }

    // Fallback map checks for old relative routes mappings
    if (url.startsWith("http://") && !url.includes("localhost")) {
      return url.replace("http://", "https://");
    }

    return url;
  };
  return (
    <section id="about" className="relative min-h-screen flex px-4 sm:px-8 xl:px-10 items-center justify-center pt-24 sm:pt-28 pb-8 overflow-hidden bg-bg-color/70 dark:bg-[#0B1221]/75 backdrop-blur-[2px] text-text-primary" ref={containerRef}>
      {/* Notice Banner */}
      {announcements.length === 1 && (
        <div className="absolute top-20 left-0 w-full bg-gradient-to-r from-primary to-primary-dark text-white text-center py-3 px-4 font-semibold text-xs md:text-sm z-30 flex justify-center items-center gap-2 shadow-sm animate-fadeIn">
          <Star size={16} fill="currentColor" className="text-accent shrink-0" />
          <span className="font-extrabold uppercase text-[10px] bg-bg-color/ px-2 py-0.5 rounded border border-white/20 mr-1 select-none">
            {announcements[0].title || 'Notice'}
          </span>
          {announcements[0].link ? (
            <a href={formatLink(announcements[0].link)} target="_blank" rel="noopener noreferrer" className="hover:underline text-white hover:text-white cursor-pointer">
              {announcements[0].text}
            </a>
          ) : (
            <span>{announcements[0].text}</span>
          )}
        </div>
      )}

      {announcements.length > 1 && (
        <div className="absolute top-20 left-0 w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 z-30 shadow-sm overflow-hidden select-none animate-fadeIn border-y border-white/10 flex items-center">
          <style>{`
            @keyframes marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 30s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="animate-marquee flex gap-16 items-center">
            {[...announcements, ...announcements].map((ann, idx) => (
              <div key={idx} className="flex items-center gap-2.5 whitespace-nowrap px-4 shrink-0">
                <Star size={14} fill="currentColor" className="text-accent shrink-0 animate-pulse" />
                <span className="font-extrabold uppercase text-[10px] tracking-wider bg-bg-color/ px-2.5 py-0.5 rounded-full border border-white/25">
                  {ann.title || 'Notice'}
                </span>
                <span className="text-xs md:text-sm font-semibold tracking-wide">
                  {ann.link ? (
                    <a href={formatLink(ann.link)} target="_blank" rel="noopener noreferrer" className="hover:underline text-white hover:text-white cursor-pointer">
                      {ann.text}
                    </a>
                  ) : (
                    ann.text
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Animated Math Background is rendered via LandingPage.jsx */}
      {/* Ambient Radial Glowing Aura */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 xl:left-24 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      <div className={`container mx-auto px-3 sm:px-6 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 w-full ${announcements.length >= 1 ? 'mt-10 xl:mt-10' : 'mt-2 xl:mt-6'}`}>

        {/* LEFT SIDE: Hero Content */}
        <motion.div
          className="flex flex-col items-start text-left w-full relative z-20 xl:col-span-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="self-center xl:self-start inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-500/30 rounded-full text-xs font-semibold text-slate-800 dark:text-blue-200 shadow-[0_2px_12px_rgba(37,99,235,0.08)] backdrop-blur-md mb-4 xl:mb-2 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400/25 dark:bg-amber-400/30 flex items-center justify-center shrink-0">
              <Star className="text-amber-500 fill-amber-400" size={12} />
            </div>
            <span>{heroData.badge || '#1 Premium Math Learning Platform'}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="font-display font-extrabold text-[36px] xs:text-[42px] sm:text-5xl md:text-5xl lg:text-6xl xl:text-[64px] leading-[1.08] tracking-tight text-slate-900 dark:text-white mb-3 xl:mb-4 w-full">
            {heroData.headline_part1 ? (
              heroData.headline_part1.includes('Where Mathematics') ? (
                <>
                  Where <br className="xl:hidden" />
                  Mathematics <br className="hidden xl:block" />
                </>
              ) : (
                <>{heroData.headline_part1} <br /></>
              )
            ) : (
              <>
                Where <br className="xl:hidden" />
                Mathematics <br className="hidden xl:block" />
              </>
            )}
            <span className="text-primary block mt-1">
              {heroData.headline_gradient || 'Meets Infinity'}
            </span>
          </motion.h1>

          {/* Accent Line */}
          <motion.div variants={itemVariants} className="w-full max-w-[85%] sm:max-w-[280px] h-1.5 bg-primary rounded-full mb-5 xl:mb-6 mt-1 ml-0 mr-auto shadow-[0_0_12px_rgba(37,99,235,0.4)]"></motion.div>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-[15px] sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl xl:max-w-xl mb-2 xl:mb-2 text-left font-medium">
            {heroData.subheadline || 'From Algebra to Calculus, learn every concept step by step, clear video lessons and real expert guidance.'}
          </motion.p>

          {/* Call to Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-3.5 w-full sm:w-auto px-0 xl:px-0">
            {!token && (
              <button
                onClick={() => navigate('/enroll')}
                className="flex items-center justify-center gap-2.5 px-6 py-3 bg-white/90 dark:bg-slate-800/90 text-primary dark:text-primary-light font-bold text-sm sm:text-base rounded-full border border-blue-200 dark:border-slate-700 shadow-xs hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer backdrop-blur-sm"
              >
                <User
                  size={25}
                  className="fill-primary text-primary dark:fill-primary-light dark:text-primary-light"
                />
                <span>Enroll Now</span>
              </button>
            )}
            <button
              onClick={() => { window.open("https://www.youtube.com/@Calculus.Corner", "_blank"); }}
              className="group relative flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm sm:text-base rounded-full overflow-hidden shadow-[0_10px_25px_-5px_rgba(255,0,0,0.4)] hover:shadow-[0_14px_30px_-5px_rgba(255,0,0,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0"
            >
              <span className="relative z-10">Subscribe on YouTube</span>
            </button>
          </motion.div>

          {/* Micro Trust Stats Row */}
          <motion.div variants={itemVariants} className="mt-6 xl:mt-8 pt-4 xl:pt-6 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-3 gap-2 w-full max-w-lg">
            <div className="flex flex-col items-start">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <Star className="text-amber-400 fill-amber-400" size={14} /> 4.9/5
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Student Rating</span>
            </div>
            <div className="flex flex-col items-start border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">100% Free</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Video Lessons</span>
            </div>
            <div className="flex flex-col items-start border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">Expert</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tutor Guidance</span>
            </div>
          </motion.div>

        </motion.div>

        {/* RIGHT SIDE: Photo and Card */}
        <motion.div
          className="relative w-full max-w-md lg:max-w-lg mx-auto xl:ml-auto flex flex-col mb-14 items-center mt-10 xl:mt-0 xl:col-span-5"
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {/* Main Image Container (Enlarged and shifted slightly up) */}
          <div className="relative w-full max-w-[390px] rounded-[20px] bg-gradient-to-b from-blue-50/80 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/60 dark:border-slate-800 pt-8 px-6 pb-0 mb-20 flex justify-center items-end h-[440px] shadow-lg">
            {/* Top Left Float */}
            <motion.div
              className="absolute top-6 -left-5 sm:-left-6 lg:-left-12 p-3 lg:p-4 rounded-2xl bg-transparent border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center max-w-[140px] z-20 cursor-default transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-primary/30"
              animate={{
                y: [0, -8, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-1 text-primary">
                <User size={18} />
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Muhammad Mehtab</p>
            </motion.div>

            <AnimatePresence>
              <motion.img
                src={getImageUrl(aboutData.image_url)}
                alt="Muhammad Mehtab math tutor"
                className="w-full h-[110%] object-cover object-bottom rounded-b-[40px] z-10 drop-shadow-2xl"
                onError={(e) => {
                  const fallbackSrc = window.location.origin + "/SirMehtabPhoto.png";
                  if (e.target.src !== fallbackSrc) {
                    e.target.src = "/SirMehtabPhoto.png";
                  }
                }}
              />
            </AnimatePresence>
          </div>

          {/* Bottom Card overlapping */}
          <div className="absolute bottom-0 z-30 w-[94%] sm:w-[105%] max-w-[420px] text-center p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-primary backdrop-blur-lg">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
              <Award className="text-white fill-white" size={20} />
            </div>
            <h3 className="font-display font-bold text-base lg:text-lg text-slate-900 dark:text-white mb-2 mt-2">
              {aboutData.heading || 'Transforming Math Anxiety into Mastery'}
            </h3>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {aboutData.paragraph1 || 'We break down complex topics into clear, step-by-step lessons that actually stick, building real confidence that lasts beyond exam day.'}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
