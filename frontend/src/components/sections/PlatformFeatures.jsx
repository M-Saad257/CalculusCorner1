import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, FileText } from 'lucide-react';

// Import existing sections to render inside tabs
import Community from './Community';

const TABS = [
  { id: 'community', label: 'Community', icon: <Users size={18} /> }
];

const PlatformFeatures = () => {
  const [activeTab, setActiveTab] = useState('community');
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const matchedTab = TABS.find(tab => tab.id === hash);
      if (matchedTab) {
        setActiveTab(matchedTab.id);
        // Add a slight delay to ensure tab state is updated and element is rendered/ready
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'community': return <Community isTab={true} />;
      default: return null;
    }
  };

  return (
    <section id="features" ref={sectionRef} className=" bg-bg-secondary/70 backdrop-blur-[2px] relative">
        <div className="flex flex-col items-center w-full">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
