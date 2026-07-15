import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import api from '../services/api';
import { useDialog } from '../context/DialogContext';
import { useSocket } from '../hooks/useSocket';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useDialog();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollingMap, setEnrollingMap] = useState({});

  const handleEnroll = async (courseId, courseTitle) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please sign in to enroll in this course.', 'error');
      navigate('/auth');
      return;
    }

    try {
      setEnrollingMap(prev => ({ ...prev, [courseId]: true }));
      const res = await api.post('/student/enroll', { courseId });
      if (res.data && res.data.success) {
        if (res.data.alreadyEnrolled) {
          showToast(res.data.message || 'You are already enrolled in this course.', 'info');
        } else {
          showToast(res.data.message || `Successfully enrolled in "${courseTitle}"!`, 'success');
        }
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to enroll in this course. Please try again.', 'error');
    } finally {
      setEnrollingMap(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/courses');
      if (Array.isArray(res.data.data)) {
        // Parse feature strings to arrays if needed
        const formatted = res.data.data.map(course => ({
          ...course,
          features: typeof course.features === 'string' ? JSON.parse(course.features) : course.features
        }));
        setCourses(formatted);
      } else {
        throw new Error('Courses data is missing or invalid');
      }
    } catch (err) {
      setError('Unable to retrieve courses. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Use the existing context from the hook, not redefining it
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-bg-color flex flex-col font-sans">
      <Navbar />
      
      <main className="grow pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
              Explore Syllabus
            </span>
            <h1 className="font-display font-black text-3.5xl md:text-5xl text-text-primary mb-4 leading-tight">
              SaaS-Grade <span className="text-gradient">Math Programs</span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              Unlock complete learning modules tailored for board exam prep, entry test shortcuts, and standard curriculum mastery.
            </p>
          </div>

          {/* Loader */}
          {loading ? (
            <Loader text="Loading courses from the database..." />
          ) : error ? (
            /* Error Fallback */
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-red-50 border border-red-100 rounded-3xl max-w-lg mx-auto gap-4 text-center">
              <p className="text-red-600 font-semibold text-sm leading-relaxed">{error}</p>
              <button 
                onClick={fetchCourses} 
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold border-0 cursor-pointer transition-colors shadow-md text-xs"
              >
                <RefreshCw size={14} /> Retry Fetch
              </button>
            </div>
          ) : (
            /* Courses Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => {
                const isPopular = !!course.popular;
                return (
                  <motion.div 
                    key={course.id} 
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 bg-bg-color shadow-md hover:-translate-y-1.5 hover:shadow-lg text-left ${
                      isPopular ? 'border-primary border-2 scale-102' : 'border-primary/10'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                        <Star size={12} className="fill-text-primary text-text-primary" /> Most Popular
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-6 pb-6 border-b border-border-color">
                      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 bg-bg-secondary text-primary">
                        {course.grade}
                      </span>
                      <h3 className="font-display font-bold text-xl mb-4 text-text-primary">
                        {course.title}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-extrabold text-3.5xl text-text-primary">
                          {course.price.startsWith('Rs.') || course.price.startsWith('$') ? course.price : `Rs. ${course.price}`}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">/month</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="grow mb-8">
                      <ul className="list-none p-0 m-0 flex flex-col gap-3.5">
                        {Array.isArray(course.features) && course.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-primary" />
                            <span className="text-text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action button */}
                    <div>
                      <Button 
                        variant={isPopular ? 'primary' : 'outline'} 
                        fullWidth
                        disabled={enrollingMap[course.id]}
                        onClick={() => handleEnroll(course.id, course.title)}
                      >
                        {enrollingMap[course.id] ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="animate-spin" size={14} /> Enrolling...
                          </span>
                        ) : 'Enroll Now'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CoursesPage;
