import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const bgColors = ["bg-blue-100 text-blue-800", "bg-emerald-100 text-emerald-800", "bg-purple-100 text-purple-800", "bg-amber-100 text-amber-800"];

const defaultTestimonials = [
  {
    id: 1,
    name: 'Ahmad Khan',
    role: 'A+ Grade (98%) - Federal Board',
    text: 'Calculus Corner completely changed my perspective on math. The step-by-step videos and past paper solutions helped me secure a top position in my board exams.',
    rating: 5
  },
  {
    id: 2,
    name: 'Fatima Ali',
    role: 'ECAT Topper - UET Lahore',
    text: 'The shortcut tricks taught here for the Entry Test are unmatched. I was able to solve complex MCQs in under 30 seconds!',
    rating: 5
  },
  {
    id: 3,
    name: 'Zainab Qureshi',
    role: 'A Grade - Sindh Board',
    text: 'I used to have severe math anxiety. The AI tutor and the interactive lessons made everything so clear. Highly recommended!',
    rating: 5
  }
];

const SuccessStories = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('/api/testimonials?status=approved');
        if (!res.ok) throw new Error('API fetch failed');
        const json = await res.json();
        const data = json.data;
        if (!Array.isArray(data)) {
          throw new Error(json.message || 'API did not return an array');
        }
        setTestimonials(data.length > 0 ? data : defaultTestimonials);
        setLoading(false);
      } catch (err) {
        setTestimonials(defaultTestimonials);
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('/api/testimonials?status=approved');
        const json = await res.json();
        const data = json.data || [];
        setTestimonials(data.length > 0 ? data : defaultTestimonials);
      } catch (err) {
      }
    };
    socket.on('site:testimonial-update', fetchTestimonials);
    return () => socket.off('site:testimonial-update', fetchTestimonials);
  }, [socket]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const paginate = (newDirection) => {
    if (testimonials.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = testimonials.length - 1;
      if (nextIndex >= testimonials.length) nextIndex = 0;
      return nextIndex;
    });
  };

  return (
    <section id="success" className="py-10 md:py-16 bg-bg-color/70 backdrop-blur-[2px] relative overflow-hidden" ref={containerRef}>
      {/* Background shape */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-bg-secondary to-transparent z-0 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            Testimonials
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            Student <span className="text-gradient">Success Stories</span>
          </h2>
        </div>

        <motion.div 
          className="relative w-full max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="relative min-h-[380px] md:min-h-[320px] flex items-center justify-center">
            {loading ? (
              <div className="text-center py-8 font-semibold text-text-secondary">Loading dynamic reviews...</div>
            ) : testimonials.length > 0 ? (
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  className="w-full p-8 md:p-12 rounded-3xl bg-bg-color shadow-xl border border-border-color relative text-left glass"
                >
                  <Quote className="absolute top-6 right-8 text-slate-100/90 pointer-events-none" size={64} />
                  
                  <div className="flex gap-1 text-accent mb-6">
                    {Array.from({ length: testimonials[currentIndex]?.rating || 5 }).map((_, i) => (
                      <Star key={i} size={18} className="fill-accent text-accent" />
                    ))}
                  </div>
                  
                  <p className="font-display font-medium text-lg md:text-2xl text-text-primary leading-relaxed mb-8 relative z-10">
                    "{testimonials[currentIndex]?.text}"
                  </p>
                  
                  <div className="flex items-center gap-4 border-t border-border-color pt-6 mt-auto">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-extrabold text-xl shadow-sm shrink-0 ${bgColors[currentIndex % bgColors.length]}`}>
                      {testimonials[currentIndex]?.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-base md:text-lg text-text-primary mb-0.5">{testimonials[currentIndex]?.name}</h4>
                      <p className="text-primary text-xs md:text-sm font-semibold">{testimonials[currentIndex]?.role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 font-semibold text-text-secondary">No reviews found.</div>
            )}
          </div>

          {/* Controls & Navigations */}
          {!loading && testimonials.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-8">
              <button 
                className="bg-bg-color border border-border-color w-11 h-11 rounded-full flex items-center justify-center text-text-primary cursor-pointer hover:bg-bg-secondary hover:text-primary hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm" 
                onClick={() => paginate(-1)}
                aria-label="Previous review"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button 
                    key={index} 
                    className={`w-2.5 h-2.5 rounded-full border-0 cursor-pointer transition-all duration-300 ${
                      index === currentIndex ? 'bg-primary w-6' : 'bg-border-color'
                    }`}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                className="bg-bg-color border border-border-color w-11 h-11 rounded-full flex items-center justify-center text-text-primary cursor-pointer hover:bg-bg-secondary hover:text-primary hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm" 
                onClick={() => paginate(1)}
                aria-label="Next review"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default SuccessStories;
