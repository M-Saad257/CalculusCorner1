import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FaYoutube } from 'react-icons/fa';
import { Eye, Video } from 'lucide-react';

const SocialProof = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <section className="py-12 md:py-16 bg-bg-color border-b border-border-color" ref={containerRef}>
      <motion.div 
        className="container mx-auto px-4 md:px-8 flex flex-col lg:flex-row justify-between items-center gap-8"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        
        <div className="text-center lg:text-left max-w-sm">
          <p className="uppercase text-xxs font-extrabold tracking-widest text-primary mb-2">Trusted by thousands</p>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-tight">Pakistan's Growing Math Community</h2>
        </div>

        <div className="flex flex-wrap justify-center md:justify-around lg:justify-end gap-6 lg:gap-10 w-full lg:w-auto">
          {/* Subscriber Stat */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-500 shrink-0">
              <FaYoutube size={26} />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-none">58K+</h3>
              <p className="text-xs md:text-sm text-text-secondary font-medium mt-1">Subscribers</p>
            </div>
          </motion.div>

          {/* Views Stat */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-primary shrink-0">
              <Eye size={26} />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-none">16M+</h3>
              <p className="text-xs md:text-sm text-text-secondary font-medium mt-1">Views</p>
            </div>
          </motion.div>

          {/* Videos Stat */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
              <Video size={26} />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-none">145+</h3>
              <p className="text-xs md:text-sm text-text-secondary font-medium mt-1">Free Videos</p>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
};

export default SocialProof;
