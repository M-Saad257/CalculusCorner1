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
    <section className="py-8 md:py-12 bg-bg-color/70 backdrop-blur-[2px] border-b border-border-color" ref={containerRef}>
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

        <div className="grid grid-cols-2 md:flex flex-wrap justify-center md:justify-around lg:justify-end gap-3 md:gap-6 lg:gap-10 w-full lg:w-auto mt-6 lg:mt-0">
          {/* Subscriber Stat */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-auto flex items-center justify-center md:justify-start gap-4 p-4 px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm w-full md:w-auto">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-50 text-red-500 shrink-0">
              <FaYoutube className="text-xl md:text-2xl" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-none">58K+</h3>
              <p className="text-xs md:text-sm text-text-secondary font-medium mt-1">Subscribers</p>
            </div>
          </motion.div>

          {/* Views Stat */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-auto flex flex-col md:flex-row items-center text-center md:text-left gap-2 md:gap-4 p-3 md:p-4 md:px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-blue-50 text-primary shrink-0">
              <Eye className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-display font-bold text-xl md:text-3xl text-text-primary leading-none">17M+</h3>
              <p className="text-[10px] md:text-sm text-text-secondary font-medium mt-1">Views</p>
            </div>
          </motion.div>

          {/* Videos Stat */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-auto flex flex-col md:flex-row items-center text-center md:text-left gap-2 md:gap-4 p-3 md:p-4 md:px-6 bg-bg-secondary rounded-2xl border border-border-color hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
              <Video className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-display font-bold text-xl md:text-3xl text-text-primary leading-none">155+</h3>
              <p className="text-[10px] md:text-sm text-text-secondary font-medium mt-1">Free Videos</p>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
};

export default SocialProof;
