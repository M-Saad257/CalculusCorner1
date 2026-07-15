import React from 'react';
import { motion } from 'framer-motion';

const GlobalMathBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Top Left */}
      <motion.div
        className="absolute top-[10%] left-[5%] w-[180px] md:w-[350px] h-[180px] md:h-[350px] opacity-60 md:opacity-100"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="100" cy="100" r="80" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="5 5" />
          <path d="M100 20 L180 140 L20 140 Z" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </motion.div>

      {/* Bottom Right */}
      <motion.div
        className="absolute bottom-[10%] right-[5%] w-[200px] md:w-[450px] h-[200px] md:h-[450px] opacity-60 md:opacity-100"
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="40" y="40" width="120" height="120" stroke="var(--color-accent)" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(45 100 100)" />
          <ellipse cx="100" cy="100" rx="90" ry="30" stroke="var(--color-accent)" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </motion.div>
      
      {/* Top Right (New) */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-[150px] md:w-[250px] h-[150px] md:h-[250px] opacity-50 md:opacity-80"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <polygon points="100,20 180,180 20,180" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="5 5" />
        </svg>
      </motion.div>
      
      {/* Bottom Left (New) */}
      <motion.div
        className="absolute bottom-[20%] left-[10%] w-[120px] md:w-[200px] h-[120px] md:h-[200px] opacity-50 md:opacity-80"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="100" cy="100" r="90" stroke="var(--color-accent)" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="100" cy="100" r="60" stroke="var(--color-primary)" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 4" />
        </svg>
      </motion.div>

      {/* Math Symbols floating */}
      <motion.div
        className="absolute top-[20%] left-[12%] text-5xl md:text-8xl text-primary-dark opacity-20 font-bold"
        animate={{ y: [-15, 15, -15], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        ∫<sub className="text-[0.4em] -ml-2">0</sub><sup className="text-[0.4em]">∞</sup>
      </motion.div>

      <motion.div
        className="absolute bottom-[20%] right-[12%] text-6xl md:text-9xl text-primary-dark opacity-20 font-bold"
        animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        ∑
      </motion.div>

      <motion.div
        className="absolute top-[35%] right-[20%] text-2xl md:text-4xl text-primary-dark opacity-25 font-bold"
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        e<sup>iπ</sup> + 1 = 0
      </motion.div>
      
      <motion.div
        className="absolute bottom-[40%] left-[25%] text-3xl md:text-5xl text-primary-dark opacity-20 font-bold"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        lim<sub>x→∞</sub> (1+1/x)<sup>x</sup>
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[40%] text-5xl md:text-8xl text-primary-dark opacity-20 font-bold"
        animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        π
      </motion.div>
    </div>
  );
};

export default GlobalMathBackground;
