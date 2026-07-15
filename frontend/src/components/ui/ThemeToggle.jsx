import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full bg-bg-secondary border border-border-color flex items-center justify-center text-text-secondary hover:text-primary hover:bg-bg-color hover:border-primary/50 transition-all shadow-sm group cursor-pointer"
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 90,
          scale: isDark ? 1 : 0.5,
          opacity: isDark ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Moon size={18} className="text-indigo-400 group-hover:text-indigo-500" />
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? -90 : 0,
          scale: isDark ? 0.5 : 1,
          opacity: isDark ? 0 : 1
        }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Sun size={18} className="text-amber-500 group-hover:text-amber-600" />
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
