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
    <section id="about" className="relative min-h-screen flex px-10 items-center justify-center pt-20 pb-8 overflow-hidden bg-bg-color/70 dark:bg-[#0B1221]/75 backdrop-blur-[2px] text-text-primary" ref={containerRef}>
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

      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 w-full mt-6">

        {/* LEFT SIDE: Hero Content */}
        <motion.div
          className="flex flex-col items-center xl:items-start text-center xl:text-left w-full relative z-20 xl:col-span-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-bg-secondary border border-gray-100 dark:border-border-color rounded-full text-xs font-semibold text-gray-600 dark:text-text-secondary mb-6 shadow-sm">
            <Star className="text-amber-400 fill-amber-400" size={14} />
            <span>{heroData.badge || '#1 Premium Math Learning Platform'}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.1] tracking-tight text-gray-900 dark:text-text-primary mb-6">
            {heroData.headline_part1 || 'Where Mathematics'} <br />
            <span className="text-primary">{heroData.headline_gradient || 'Meets Infinity'}</span>
          </motion.h1>

          <motion.div variants={itemVariants} className="w-16 h-1 bg-primary rounded-full mb-6 mx-auto xl:mx-0"></motion.div>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-text-secondary leading-relaxed max-w-2xl xl:max-w-xl mb-8">
            {heroData.subheadline || 'From Algebra to Calculus, learn every concept step by step, clear video lessons and real expert guidance.'}
          </motion.p>

          {/* Call to Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center xl:justify-start gap-4 w-full sm:w-auto px-4 xl:px-0">
            <button
              onClick={() => navigate('/notes')}
              className="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-full overflow-hidden shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0 cursor-pointer"
            >
              <span className="relative z-10">{heroData.button_primary || 'Start Learning'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover:translate-x-1 transition-transform">
                <path d="m9 18 6-6-6-6" />
              </svg>
              <div className="absolute inset-0 bg-bg-color/ translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('videos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/#videos');
              }}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-bg-color dark:bg-bg-secondary text-primary font-bold rounded-full border border-gray-200 dark:border-border-color shadow-sm hover:border-primary/50 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Play size={18} className="fill-primary text-primary" />
              <span>{heroData.button_secondary || 'Watch Free Lessons'}</span>
            </button>
          </motion.div>

          {/* Features Row below buttons */}

        </motion.div>

        {/* RIGHT SIDE: Photo and Little Text */}
        <motion.div
          className="relative w-full max-w-md lg:max-w-lg mx-auto xl:ml-auto flex flex-col items-center mt-12 xl:mt-0 xl:col-span-5"
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {/* Main Image Container */}
          <div className="relative w-full max-w-[360px] rounded-[40px] bg-gray-50 dark:bg-bg-tertiary pt-8 px-6 pb-0 mb-20 flex justify-center items-end h-[380px]">
            {/* Top Left Float */}
            <motion.div
              className="absolute top-6 -left-12 p-3 lg:p-4 rounded-2xl bg-glass shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-border-color flex flex-col items-center text-center max-w-[140px] z-20 cursor-default transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-primary/30"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 1.5, -1.5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
              whileHover={{
                scale: 1.1,
                rotate: 0,
                y: -5
              }}
            >
              <User className="text-primary mb-1" size={24} />
              <p className="text-[11px] font-bold text-gray-800 dark:text-text-secondary leading-tight">Muhammad Mehtab</p>
            </motion.div>

            <AnimatePresence>
              <motion.img
                src={getImageUrl(aboutData.image_url)}
                alt="Muhammad Mehtab math tutor"
                className="w-full h-[110%] object-cover object-bottom rounded-b-[40px] z-10 drop-shadow-xl"
                onError={(e) => {
                  const fallbackSrc = window.location.origin + "/SirMehtabPhoto.png";
                  if (e.target.src !== fallbackSrc) {
                    e.target.src = "/SirMehtabPhoto.png";
                  }
                }}
              />
            </AnimatePresence>
            {/* Bottom Right Float */}
          </div>

          {/* Bottom Card over overlapping */}
          <div className="absolute bottom-0 z-30 w-[110%] max-w-[420px] text-center p-6 rounded-3xl bg-bg-color dark:bg-bg-secondary shadow-[0_20px_50px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-border-color border-t-4 border-t-primary">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-bg-color">
              <Award className="text-white fill-white" size={20} />
            </div>
            <h3 className="font-display font-bold text-base lg:text-lg text-gray-900 dark:text-text-primary mb-2 mt-2">
              {aboutData.heading || 'Transforming Math Anxiety into Mastery'}
            </h3>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-text-secondary leading-relaxed">
              {aboutData.paragraph1 || 'We break down complex topics into clear, step-by-step lessons that actually stick, building real confidence that lasts beyond exam day.'}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
