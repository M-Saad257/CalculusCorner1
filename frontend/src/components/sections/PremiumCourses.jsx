import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Star, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const defaultCourses = [
  {
    id: 1,
    grade: "Grade 9",
    title: "Algebra & Geometry Foundation",
    price: "$29",
    period: "/month",
    features: [
      "Daily Video Lessons",
      "Interactive Chapter Quizzes",
      "Weekly Live Q&A Sessions",
      "PDF Formula Sheets",
      "Basic AI Tutor Support"
    ],
    popular: false,
    highlight: false
  },
  {
    id: 2,
    grade: "Grade 10",
    title: "Trigonometry & Pre-Calculus",
    price: "$39",
    period: "/month",
    features: [
      "Everything in Grade 9",
      "Mock Midterm & Final Exams",
      "AI Study Planner Integration",
      "Step-by-Step Worksheet Solvers",
      "24/7 AI Tutor Access"
    ],
    popular: true,
    highlight: false
  },
  {
    id: 3,
    grade: "Grade 11",
    title: "Calculus I (Limits & Derivatives)",
    price: "$49",
    period: "/month",
    features: [
      "Advanced Video Library",
      "Personalized Learning Insights",
      "Calculus Cheat Sheet PDF",
      "Priority Live Q&A Help",
      "Full Exam Prep Assistant Access"
    ],
    popular: false,
    highlight: true
  },
  {
    id: 4,
    grade: "Grade 12",
    title: "Calculus II (Integrals & Series)",
    price: "$59",
    period: "/month",
    features: [
      "Complete Integrals Walkthrough",
      "Advanced Infinite Series Guides",
      "1-on-1 Monthly Mentorship Session",
      "Board Exam Mock Simulations",
      "Unlimited AI Support Solutions"
    ],
    popular: false,
    highlight: false
  },
  {
    id: 5,
    grade: "SAT Prep",
    title: "SAT Mathematics Prep",
    price: "$45",
    period: "/month",
    features: [
      "10 Full-Length SAT Mock Tests",
      "High-Yield Formulas Overview",
      "SAT Math Secrets Cheat Sheet",
      "Interactive Scoring Dashboard",
      "Time-Management Strategies Session"
    ],
    popular: false,
    highlight: false
  }
];

const PremiumCourses = () => {
  const navigate = useNavigate();
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      const data = res.data.data;
      
      if (!Array.isArray(data)) {
        throw new Error('API response did not contain courses array');
      }

      // Parse features string back to array if needed
      const formattedData = data.map(course => ({
        ...course,
        features: typeof course.features === 'string' ? JSON.parse(course.features) : course.features,
        price: String(course.price).startsWith('$') || String(course.price).startsWith('Rs.') ? String(course.price) : `Rs. ${course.price}`,
        period: course.period || '/month'
      }));
      setCoursesData(formattedData);
      setLoading(false);
    } catch (err) {
      setCoursesData(defaultCourses);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchCourses();
    socket.on('course:create', refreshData);
    socket.on('course:update', refreshData);
    socket.on('course:delete', refreshData);
    return () => {
      socket.off('course:create', refreshData);
      socket.off('course:update', refreshData);
      socket.off('course:delete', refreshData);
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
    <section id="courses" className="py-10 md:py-16 bg-bg-tertiary/70 backdrop-blur-[2px] relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            Enroll Now
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            Premium <span className="text-gradient">Structured Courses</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Pick your grade and get instant access to a complete, expert-built course designed to take your math from wherever you are right now to where you need to be.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView && !loading ? "visible" : "hidden"}
        >
          {loading ? (
            <div className="col-span-full">
              <Loader text="Loading dynamic course catalog..." />
            </div>
          ) : (
            coursesData.map((course, index) => {
              // Apply special column spanning logic to center the bottom row on wide screens
              let gridColClass = "lg:col-span-2";
              if (index === 3) {
                gridColClass = "lg:col-start-2 lg:col-span-2";
              } else if (index === 4) {
                gridColClass = "lg:col-start-4 lg:col-span-2";
              }

              const isPopular = !!course.popular;
              const isHighlight = !!course.highlight;

              return (
                <motion.div 
                  key={course.id} 
                  variants={cardVariants} 
                  className={`group relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${gridColClass} ${
                    isHighlight 
                      ? 'bg-gradient-to-br from-primary to-primary-dark text-white border-0 shadow-lg' 
                      : isPopular
                        ? 'bg-bg-color border-2 border-primary shadow-lg scale-102 hover:scale-102 hover:-translate-y-2'
                        : 'bg-bg-color border-primary/10 shadow-md hover:-translate-y-2'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap z-10">
                      <Star size={12} className="fill-text-primary text-text-primary" /> Most Popular
                    </div>
                  )}

                  {/* Thumbnail */}
                  {course.thumbnail && (
                    <div className="-mx-8 -mt-8 mb-6 h-40 overflow-hidden rounded-t-[calc(1.5rem-1px)] relative">
                      <img
                        src={course.thumbnail.startsWith('http') ? course.thumbnail : `${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {/* Header */}
                  <div className={`mb-6 pb-6 border-b text-left ${isHighlight ? 'border-white/20' : 'border-border-color'}`}>
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
                      isHighlight ? 'bg-bg-color/ text-white' : 'bg-bg-secondary text-primary'
                    }`}>
                      {course.grade}
                    </span>
                    <h3 className="font-display font-bold text-xl mb-4">
                      {course.title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-extrabold text-3xl md:text-4xl">{course.price}</span>
                      <span className={`text-xs md:text-sm font-medium ${isHighlight ? 'text-white/80' : 'text-text-secondary'}`}>
                        {course.period || '/month'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grow mb-8 text-left">
                    <ul className="list-none p-0 m-0 flex flex-col gap-3.5">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                          <CheckCircle2 
                            size={18} 
                            className={`shrink-0 mt-0.5 ${isHighlight ? 'text-accent' : 'text-primary'}`} 
                          />
                          <span className={isHighlight ? 'text-white/90' : 'text-text-secondary'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div>
                    <Button 
                      variant={isPopular || isHighlight ? 'primary' : 'outline'} 
                      fullWidth
                      className={isHighlight ? 'bg-bg-color text-primary border-0 hover:bg-bg-secondary hover:text-primary-dark shadow-md' : ''}
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        navigate(token ? '/dashboard' : '/auth');
                      }}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default PremiumCourses;
