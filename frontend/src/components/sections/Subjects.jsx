import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FunctionSquare, Shapes, TriangleRight, BarChart3, Infinity as InfinityIcon, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

// Icon Map for dynamic rendering
const iconMap = {
  'FunctionSquare': FunctionSquare,
  'Shapes': Shapes,
  'TriangleRight': TriangleRight,
  'BarChart3': BarChart3,
  'InfinityIcon': InfinityIcon,
  'GraduationCap': GraduationCap,
};

const Subjects = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [subjectsData, setSubjectsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjectsData(res.data.data || []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjectsData(res.data.data || []);
      } catch (error) {
      }
    };

    socket.on('subject:create', fetchSubjects);
    socket.on('subject:update', fetchSubjects);
    socket.on('subject:delete', fetchSubjects);

    return () => {
      socket.off('subject:create', fetchSubjects);
      socket.off('subject:update', fetchSubjects);
      socket.off('subject:delete', fetchSubjects);
    };
  }, [socket]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section id="subjects" className="py-16 md:py-24 bg-bg-secondary relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            Curriculum
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            Comprehensive <span className="text-gradient">Subject Coverage</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Whether you're starting from scratch or pushing into advanced topics, our learning paths are designed around the actual Grade 9-12 syllabus
          </p>
        </div>

        {loading ? (
          <div className="text-center text-text-tertiary animate-pulse py-10">Loading subjects...</div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {subjectsData.map((subject) => {
              const Icon = iconMap[subject.icon] || FunctionSquare;
              return (
                <motion.div 
                  key={subject.id} 
                  variants={cardVariants} 
                  className="group flex flex-col p-8 rounded-3xl bg-white border border-border-color shadow-sm hover:border-primary/20 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden transition-all duration-300 text-left"
                >
                  {/* Accent top indicator */}
                  <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0 ${subject.bgColor}`}>
                    <Icon size={28} />
                  </div>
                  
                  <h3 className="font-display font-bold text-xl text-text-primary mb-3">
                    {subject.title}
                  </h3>
                  <p className="text-base text-text-secondary leading-relaxed mb-6 grow line-clamp-3">
                    {subject.subtitle}
                  </p>
                  
                  <Link to={`/subjects/${subject.slug}`} className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary-dark transition-colors mt-auto">
                    Learn More 
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>
    </section>
  );
};

export default Subjects;
