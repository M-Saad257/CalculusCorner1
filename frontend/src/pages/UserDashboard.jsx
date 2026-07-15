import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, GraduationCap, User, Play, FileText, BrainCircuit, Loader2, X, Menu, MessageSquare, LayoutDashboard, Star, TrendingUp, Award, Headset } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { useSocket } from '../hooks/useSocket';
import NotificationBell from '../components/ui/NotificationBell';
import { useDialog } from '../context/DialogContext';
import { useContent } from '../context/ContentContext';

const defaultCourses = [
  {
    id: 1,
    grade: "Grade 9",
    title: "Algebra & Geometry Foundation",
    description: "Build a strong mathematical foundation with basic algebra, linear equations, functions, and coordinate geometry.",
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
    description: "Excel in trigonometric identities, unit circle, polynomial functions, and pre-calculus essentials.",
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
    description: "Master limits, continuity, derivative rules, optimization problems, and curve sketching.",
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
    description: "Explore integration techniques, area/volume calculations, sequences, series convergence, and differential equations.",
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
    description: "Learn high-yield concepts, time management strategies, and practice mock tests for SAT success.",
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

// Tab Subcomponents
import DashboardHome from './UserDashboard/DashboardHome';
import CoursesTab from './UserDashboard/CoursesTab';
import ResourceTab from './UserDashboard/ResourceTab';
import PracticeTab from './UserDashboard/PracticeTab';
import ProfileTab from './UserDashboard/ProfileTab';
import SupportChatTab from './UserDashboard/SupportChatTab';
import AchievementTab from './UserDashboard/AchievementTab';
import CourseDetailTab from './UserDashboard/CourseDetailTab';

const ConnectionIndicator = ({ status }) => {
  const statusConfig = {
    connected: { label: 'Connected', dotColor: 'bg-emerald-500 shadow-emerald-500/50', textColor: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    reconnecting: { label: 'Reconnecting', dotColor: 'bg-amber-500 shadow-amber-500/50', textColor: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/20 animate-pulse' },
    offline: { label: 'Offline', dotColor: 'bg-rose-500 shadow-rose-500/50', textColor: 'text-rose-600', bgColor: 'bg-rose-500/10 border-rose-500/20' },
  };

  const current = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm transition-all duration-300 select-none ${current.bgColor} ${current.textColor}`}>
      <span className="relative flex h-1.5 w-1.5">
        {status === 'reconnecting' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotColor}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${current.dotColor}`}></span>
      </span>
      <span>{current.label}</span>
    </div>
  );
};

const UserDashboard = ({ defaultTab = 'overview' }) => {
  const navigate = useNavigate();
  const { showToast, alert: showAlert } = useDialog();
  const { content } = useContent();
  const visibility = content?.visibility || {};

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);
  const containerRef = useRef(null);

  // Support Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  const [student, setStudent] = useState(null);

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [videos, setVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Performance & Badges states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [adminResponses, setAdminResponses] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', role: '', text: '', rating: 5 });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentBanned, setStudentBanned] = useState(false);
  const [unbanRequest, setUnbanRequest] = useState(null);
  const [unbanLoading, setUnbanLoading] = useState(false);
  const [unbanSubmitting, setUnbanSubmitting] = useState(false);
  const [unbanError, setUnbanError] = useState('');
  const [unbanSuccess, setUnbanSuccess] = useState('');
  const [courseProgress, setCourseProgress] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Sockets
  const { socket, status, emitActivity, disconnectSocket } = useSocket();

  // AI Math Tutor tab states
  const [tutorInput, setTutorInput] = useState('');
  const [tutorEquation, setTutorEquation] = useState('');
  const [tutorIsSolving, setTutorIsSolving] = useState(false);
  const [tutorIsLoadingApi, setTutorIsLoadingApi] = useState(false);
  const [tutorChatStarted, setTutorChatStarted] = useState(false);
  const [tutorStepsRevealed, setTutorStepsRevealed] = useState(0);
  const [tutorSolutionSteps, setTutorSolutionSteps] = useState([]);
  const [aiConversationId, setAiConversationId] = useState(null);
  const [aiTutorStats, setAiTutorStats] = useState({ creditsLeft: 3, totalCredits: 3, isLocked: false, lockoutRemainingMs: 0, fetchedAt: Date.now() });

  const handleTutorSolve = async (e) => {
    e.preventDefault();
    if (!tutorInput.trim() || tutorIsSolving || tutorIsLoadingApi) return;

    // Simple heuristic to block pure text statements (like word problems)
    const mathTerms = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'sqrt', 'pi', 'dx', 'dy', 'dz', 'fx', 'int'];
    const words = tutorInput.toLowerCase().match(/[a-z]+/g) || [];
    const nonMathWords = words.filter(w => w.length > 1 && !mathTerms.includes(w));
    if (nonMathWords.length >= 2) {
      showToast('Please paste or write a mathematical equation, not a text statement.', 'error');
      return;
    }

    if (aiTutorStats?.isLocked) {
      let remainingMs = aiTutorStats.lockoutRemainingMs;
      if (aiTutorStats.fetchedAt) {
        remainingMs -= (Date.now() - aiTutorStats.fetchedAt);
      }
      if (remainingMs < 0) remainingMs = 0;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      showToast(`Tutor is resting. Time left: ${hours}h ${minutes}m`, 'error');
      return;
    }

    const currentEquation = tutorInput;
    setTutorEquation(currentEquation);
    setTutorInput('');
    setTutorChatStarted(true);
    setTutorIsLoadingApi(true);
    setTutorIsSolving(true);
    setTutorStepsRevealed(0);
    setTutorSolutionSteps([]);

    try {
      const res = await api.post('/student/tutor/solve', { equation: currentEquation });
      if (res.data && res.data.success) {
        const steps = res.data.data.steps;
        setTutorSolutionSteps(steps);
        setTutorIsLoadingApi(false);
        
        if (res.data.aiTutorStats) {
          setAiTutorStats({ ...res.data.aiTutorStats, fetchedAt: Date.now() });
        }

        // Animate steps
        steps.forEach((_, index) => {
          setTimeout(() => {
            setTutorStepsRevealed(index + 1);
            if (index === steps.length - 1) {
              setTutorIsSolving(false);
            }
          }, (index + 1) * 800);
        });
      }
    } catch (err) {
      setTutorIsLoadingApi(false);
      setTutorIsSolving(false);
      
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while solving.';
      showToast(errorMessage, 'error');

      if (err.response?.data?.aiTutorStats) {
        setAiTutorStats({ ...err.response.data.aiTutorStats, fetchedAt: Date.now() });
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      // Use aggregated dashboard endpoint to reduce round-trips and get computed stats
      const dashRes = await api.get('/student/dashboard');
      if (dashRes.data && dashRes.data.success) {
        const data = dashRes.data.data;
        if (data.stats) setDashboardStats(data.stats);
        if (data.profile) {
          setStudent(data.profile);
          setBio(data.profile.bio || '');
          setAvatar(data.profile.avatar || '');
          const isBanned = data.profile.status === 'banned' || data.profile.isBanned === 1;
          setStudentBanned(isBanned);
          setHasPendingRequest(data.profile.hasPendingRequest || false);
          setUnbanRequest(data.profile.unbanRequest || null);
          if (isBanned) return;
        }

        try {
          const coursesRes = await api.get('/courses');
          const allCoursesData = coursesRes.data.data;
          if (Array.isArray(allCoursesData)) {
            const formattedData = allCoursesData.map(course => ({
              ...course,
              features: typeof course.features === 'string' ? JSON.parse(course.features) : course.features,
              price: course.price.startsWith('$') || course.price.startsWith('Rs.') ? course.price : `Rs. ${course.price}`,
              period: course.period || '/month'
            }));
            
            setCourses(formattedData);
          } else {
            setCourses(defaultCourses);
          }
        } catch (coursesErr) {
          setCourses(defaultCourses);
        }
        if (Array.isArray(data.enrolled)) setEnrolledCourses(data.enrolled);
        if (Array.isArray(data.badges)) setEarnedBadges(data.badges);
        if (data.analytics) setAnalyticsData(data.analytics);
        if (Array.isArray(data.timeline)) setTimeline(data.timeline);
        if (Array.isArray(data.courseProgress)) setCourseProgress(data.courseProgress);
        if (Array.isArray(data.recentVideos)) setRecentVideos(data.recentVideos);
        if (data.aiTutorStats) setAiTutorStats({ ...data.aiTutorStats, fetchedAt: Date.now() });

        // If videos & resources endpoints are still used for content lists, keep them
        const resourcesRes = await api.get('/student/resources');
        if (resourcesRes.data && Array.isArray(resourcesRes.data.data)) {
          setResources(resourcesRes.data.data);
        }

        const videosRes = await api.get('/student/videos');
        if (videosRes.data && Array.isArray(videosRes.data.data)) {
          const videoList = videosRes.data.data;
          setVideos(videoList);
          if (videoList.length > 0) setSelectedVideo(videoList[0]);
        }
      }
    } catch (err) {
      // Fallback for banned users who are blocked on /student/dashboard (403)
      if (err.response?.status === 403) {
        try {
          const profileRes = await api.get('/student/profile');
          if (profileRes.data && profileRes.data.success) {
            const profile = profileRes.data.data;
            setStudent(profile);
            setBio(profile.bio || '');
            setAvatar(profile.avatar || '');
            const isBanned = profile.status === 'banned' || profile.isBanned === 1;
            setStudentBanned(isBanned);
            setHasPendingRequest(profile.hasPendingRequest || false);
            setUnbanRequest(profile.unbanRequest || null);
            return;
          }
        } catch (profileErr) {
        }
      }
      setError(err.response?.data?.message || 'Could not establish secure connection to retrieve study modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (activeTab !== defaultTab) {
      setActiveTab(defaultTab);
    }
    setError('');
  }, [defaultTab, location.search]);

  useEffect(() => {
    fetchDashboardData();
    fetchUnbanRequest();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const refreshData = () => {
      fetchDashboardData();
    };

    socket.on('course:update', refreshData);
    socket.on('course:create', refreshData);
    socket.on('enrollment:updated', refreshData);
    socket.on('student:review-request', () => {
      setReviewForm({
        name: student?.name || '',
        role: 'Student', // Can be edited by student
        text: '',
        rating: 5
      });
      setShowReviewModal(true);
    });

    return () => {
      socket.off('course:update', refreshData);
      socket.off('course:create', refreshData);
      socket.off('enrollment:updated', refreshData);
      socket.off('student:review-request');
    };
  }, [socket, student]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await api.get('/student/practice/analytics');
      if (res.data && res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      setBadgesLoading(true);
      const res = await api.get('/student/practice/badges');
      if (res.data && res.data.success) {
        setEarnedBadges(res.data.data);
      }
    } catch (err) {
    } finally {
      setBadgesLoading(false);
    }
  };

  const fetchUnbanRequest = async () => {
    try {
      setUnbanLoading(true);
      const res = await api.get('/student/unban-request');
      if (res.data && res.data.success) {
        const { hasPendingRequest: pending, unbanRequest: req } = res.data.data;
        setHasPendingRequest(pending);
        setUnbanRequest(req);
      }
    } catch (err) {
    } finally {
      setUnbanLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setReviewSubmitting(true);
      await api.post('/student/testimonials', reviewForm);
      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review. You may have already submitted one.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const submitUnbanRequest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setUnbanSubmitting(true);
      setUnbanError('');
      setUnbanSuccess('');
      const res = await api.post('/student/unban-request', {
        message: 'Automatic appeal submitted via student profile request.',
        reason: 'other'
      });
      if (res.data && res.data.success) {
        setUnbanSuccess('Unban request submitted successfully. Our admin team will review it shortly.');
        fetchUnbanRequest();
      }
    } catch (err) {
      setUnbanError(err.response?.data?.message || 'Unable to submit your request.');
    } finally {
      setUnbanSubmitting(false);
    }
  };

  // Support Chat Effects & Handlers
  const fetchChatMessages = async () => {
    try {
      setChatLoading(true);
      const res = await api.get('/student/support-messages');
      if (res.data && Array.isArray(res.data.data)) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    try {
      const res = await api.post('/student/support-messages', { message: text });
      if (res.data && res.data.success) {
        setChatMessages(prev => {
          const hasDuplicate = prev.some(m => m.message === text && m.sender_role === 'student' && Math.abs(Date.now() - new Date(m.created_at || m.createdAt).getTime()) < 5000);
          if (hasDuplicate) return prev;
          return [...prev, {
            id: Date.now(),
            student_id: student?.id,
            sender_role: 'student',
            message: text,
            created_at: new Date().toISOString()
          }];
        });
      }
    } catch (err) {
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'support_chat') {
      fetchChatMessages();
    }
    const parentContainer = document.querySelector('.grow.p-8.overflow-y-auto');
    if (parentContainer) {
      if (activeTab === 'support_chat') {
        parentContainer.style.overflowY = 'hidden';
      } else {
        parentContainer.style.overflowY = 'auto';
      }
    }
    return () => {
      if (parentContainer) {
        parentContainer.style.overflowY = 'auto';
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const currentUserId = userObj ? userObj.id : null;

      if (msg.studentId === student?.id || msg.studentId === currentUserId) {
        setChatMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === msg.id || (m.message === msg.message && Math.abs(new Date(m.created_at || m.createdAt) - new Date(msg.createdAt || msg.created_at)) < 2000))) {
            return prev;
          }
          return [...prev, {
            id: msg.id || Date.now(),
            student_id: msg.studentId,
            sender_role: msg.senderRole,
            message: msg.message,
            created_at: msg.createdAt || msg.created_at || new Date().toISOString()
          }];
        });
      }
    };

    socket.on('support:message', handleIncomingMessage);
    return () => {
      socket.off('support:message', handleIncomingMessage);
    };
  }, [socket, student]);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchAnalytics();
    } else if (activeTab === 'badges') {
      fetchBadges();
    }
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const pendingAttemptStr = localStorage.getItem('pending_quiz_attempt');

    if (token && pendingAttemptStr) {
      try {
        const pendingAttempt = JSON.parse(pendingAttemptStr);
        const answersPayload = Array.isArray(pendingAttempt.answers)
          ? pendingAttempt.answers.map(a => ({
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer
          }))
          : [];

        api.post('/student/practice/attempt', {
          answers: answersPayload,
          timeTaken: pendingAttempt.timeTaken,
          quizType: pendingAttempt.quizType,
          topic: pendingAttempt.topic
        }).then(res => {
          if (res.data && res.data.success) {
            showToast('Quiz results saved successfully!', 'success');
            // Refresh dashboard data
            fetchAnalytics();

            if (res.data.data.newBadges?.length > 0) {
              const badgeNames = res.data.data.newBadges.map(b => b.badgeName).join(', ');
              showAlert('Achievement Unlocked!', `Earned badge(s): ${badgeNames}. View them in your dashboard.`);
              fetchBadges();
            }
          }
        }).catch(err => {
        });

        localStorage.removeItem('pending_quiz_attempt');
      } catch (err) {
      }
    }
  }, []);

  // Track page activity via sockets
  useEffect(() => {
    emitActivity('/dashboard', activeTab);
  }, [activeTab, emitActivity]);

  // Real-time list updates
  useEffect(() => {
    if (socket) {
      const handleCourseCreate = (newCourse) => {
        // Do not auto-enroll students in newly created courses.
      };

      const handleCourseUpdate = (updatedCourse) => {
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      };

      const handleCourseDelete = ({ id }) => {
        setCourses(prev => prev.filter(c => c.id !== id));
      };

      const handleResourceCreate = (newResource) => {
        setResources(prev => {
          if (prev.find(r => r.id === newResource.id)) return prev;
          return [...prev, newResource];
        });
      };

      const handleResourceUpdate = (updatedResource) => {
        setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
      };

      const handleResourceDelete = ({ id }) => {
        setResources(prev => prev.filter(c => c.id !== id));
      };

      const handleVideoCreate = (newVideo) => {
        setVideos(prev => {
          if (prev.find(v => v.id === newVideo.id)) return prev;
          return [newVideo, ...prev];
        });
      };

      const handleVideoUpdate = (updatedVideo) => {
        setVideos(prev => {
          const list = prev.map(v => v.id === updatedVideo.id ? updatedVideo : v);
          if (selectedVideo && selectedVideo.id === updatedVideo.id) {
            setSelectedVideo(updatedVideo);
          }
          return list;
        });
      };

      const handleVideoDelete = ({ id }) => {
        setVideos(prev => {
          const list = prev.filter(v => v.id !== id);
          if (selectedVideo && selectedVideo.id === id) {
            setSelectedVideo(list[0] || null);
          }
          return list;
        });
      };

      socket.on('course:create', handleCourseCreate);
      socket.on('course:update', handleCourseUpdate);
      socket.on('course:delete', handleCourseDelete);
      socket.on('resource:create', handleResourceCreate);
      socket.on('resource:update', handleResourceUpdate);
      socket.on('resource:delete', handleResourceDelete);
      socket.on('video:create', handleVideoCreate);
      socket.on('video:update', handleVideoUpdate);
      socket.on('video:delete', handleVideoDelete);

      return () => {
        socket.off('course:create', handleCourseCreate);
        socket.off('course:update', handleCourseUpdate);
        socket.off('course:delete', handleCourseDelete);
        socket.off('resource:create', handleResourceCreate);
        socket.off('resource:update', handleResourceUpdate);
        socket.off('resource:delete', handleResourceDelete);
        socket.off('video:create', handleVideoCreate);
        socket.off('video:update', handleVideoUpdate);
        socket.off('video:delete', handleVideoDelete);
      };
    }
  }, [socket, selectedVideo]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.put('/student/profile', { bio, avatar });
      if (res.data && res.data.success) {
        setStudent(res.data.data);
        setIsEditingProfile(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile settings.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    navigate('/');
  };

  const getStats = () => {
    // Prefer aggregated dashboard stats from backend
    if (dashboardStats) {
      return {
        completion: dashboardStats.completion || 0,
        streak: dashboardStats.streak || 0,
        hoursSpent: dashboardStats.hoursSpent || 0,
        lessonsFinished: dashboardStats.lessonsFinished || 0
      };
    }

    try {
      if (student?.progress) {
        const prog = typeof student.progress === 'string' ? JSON.parse(student.progress) : student.progress;
        return {
          completion: prog.completion || 0,
          streak: prog.streak || 0,
          hoursSpent: prog.hoursSpent || 0,
          lessonsFinished: prog.lessonsFinished || 0
        };
      }
    } catch (e) {
    }

    return {
      completion: 0,
      streak: 0,
      hoursSpent: 0,
      lessonsFinished: 0
    };
  };
  const stats = getStats();

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${url}`;
  };


  return (
    <div className="flex h-screen w-full max-w-full bg-bg-secondary overflow-hidden font-sans text-left">
      {/* AI Tutor Loading Overlay */}
      {tutorIsLoadingApi && createPortal(
        <div className="fixed inset-0 z-[9999] backdrop-blur-md bg-bg-color/ flex flex-col items-center justify-center">
          <Loader text="AI Tutor is Thinking..." className="scale-125" />
          <p className="text-text-secondary text-base font-medium mt-2">Breaking down the steps for your equation.</p>
        </div>,
        document.body
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-bg-color border-r border-border-color flex flex-col shadow-lg z-50 transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-sm shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-border-color shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-center font-display font-extrabold text-base" style={
              {
                color: "#2563EB !important"
              }
            }>Calculus Corner</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg border-0 bg-transparent cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="grow flex flex-col py-2.5 gap-1 text-sm overflow-y-auto cc-scroll">
          <button onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'overview' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
            <LayoutDashboard size={18} /> <span>Overview</span>
          </button>
          {visibility.courses !== false && (
            <button onClick={() => { setActiveTab('courses'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'courses' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
              <BookOpen size={18} /> <span>Courses</span>
            </button>
          )}
          {visibility.notes !== false && (
            <button onClick={() => { setActiveTab('resources'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'resources' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
              <FileText size={18} /> <span>Formula Sheets</span>
            </button>
          )}
          {visibility.lectures !== false && (
            <button onClick={() => { setActiveTab('videos'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'videos' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
              <Play size={18} /> <span>Video Lectures</span>
            </button>
          )}
          <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'profile' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
            <User size={18} /> <span>My Profile</span>
          </button>
          <button onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'performance' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
            <TrendingUp size={18} /> <span>Performance Reports</span>
          </button>
          <button onClick={() => { setActiveTab('badges'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'badges' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
            <Award size={18} /> <span>Achievement Badges</span>
          </button>
          <button onClick={() => { setActiveTab('support_chat'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-6 py-3 font-semibold border-0 text-left cursor-pointer transition-all ${activeTab === 'support_chat' ? 'bg-primary text-white border-r-4 border-primary-dark' : 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-primary'}`}>
            <Headset size={18} /> <span>Support Chat</span>
          </button>
        </nav>

        <div className="p-3 px-6 border-t border-border-color">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full p-1 bg-transparent border-0 text-red-500 font-bold cursor-pointer hover:opacity-80 transition-opacity">
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="grow flex flex-col overflow-hidden">
        <header className="relative h-18 p-10 bg-bg-color border-b border-border-color flex items-center justify-between px-8 shadow-sm z-40">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-primary hover:bg-bg-tertiary rounded-xl cursor-pointer border-0 bg-transparent"
            >
              <Menu size={20} />
            </button>
            <span className="text-text-secondary text-sm font-medium">My Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionIndicator status={status} />
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold shadow-sm overflow-hidden">
              {student?.avatar ? <img src={getFileUrl(student.avatar)} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : (student?.name ? student.name.charAt(0).toUpperCase() : 'S')}
            </div>
          </div>
        </header>

        <div ref={containerRef} className="grow p-8 overflow-y-auto relative z-10">
          {loading ? (
            <Loader text="Syncing credentials & content database..." />
          ) : error && !student ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
          ) : (
            <>
              {studentBanned && (
                <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm animate-fadeIn">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-amber-900">Account Restricted</h3>
                      <p className="text-sm text-amber-800 mt-1">Your profile has been suspended and access to study modules is restricted.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasPendingRequest ? (
                        <span className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide border border-amber-200">
                          Unban Request Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            submitUnbanRequest();
                          }}
                          className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wide transition-colors border-0 cursor-pointer"
                        >
                          Request Unban
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <DashboardHome
                  student={student}
                  stats={stats}
                  videos={videos}
                  recentVideos={recentVideos}
                  enrolledCourses={enrolledCourses}
                  setActiveTab={setActiveTab}
                  setSelectedCourseForDetail={setSelectedCourseForDetail}
                />
              )}

              {activeTab === 'course_detail' && (
                <CourseDetailTab 
                  course={selectedCourseForDetail}
                  student={student}
                  setActiveTab={setActiveTab}
                  setSelectedCourseForDetail={setSelectedCourseForDetail}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesTab
                  courses={courses}
                  enrolledCourses={enrolledCourses}
                  setActiveTab={setActiveTab}
                  setSelectedCourseForDetail={setSelectedCourseForDetail}
                  loading={loading}
                />
              )}

              {activeTab === 'resources' && (
                <ResourceTab
                  resources={resources}
                  getFileUrl={getFileUrl}
                />
              )}

              {activeTab === 'videos' && (
                <PracticeTab
                  videos={videos}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  student={student}
                  setStudent={setStudent}
                  isEditingProfile={isEditingProfile}
                  setIsEditingProfile={setIsEditingProfile}
                  avatar={avatar}
                  setAvatar={setAvatar}
                  bio={bio}
                  setBio={setBio}
                  handleUpdateProfile={handleUpdateProfile}
                  studentBanned={studentBanned}
                  hasPendingRequest={hasPendingRequest}
                  unbanRequest={unbanRequest}
                  unbanSubmitting={unbanSubmitting}
                  unbanError={unbanError}
                  unbanSuccess={unbanSuccess}
                  submitUnbanRequest={submitUnbanRequest}
                  courses={courses}
                  enrolledCourses={enrolledCourses}
                  videos={videos}
                  resources={resources}
                  stats={stats}
                  timeline={timeline}
                />
              )}

              {activeTab === 'support_chat' && (
                <SupportChatTab
                  chatLoading={chatLoading}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  handleSendChatMessage={handleSendChatMessage}
                  chatSending={chatSending}
                  chatEndRef={chatEndRef}
                  student={student}
                />
              )}

              {(activeTab === 'performance' || activeTab === 'badges') && (
                <AchievementTab
                  activeTab={activeTab}
                  analyticsLoading={analyticsLoading}
                  analyticsData={analyticsData}
                  earnedBadges={earnedBadges}
                  badgesLoading={badgesLoading}
                  fetchAnalytics={fetchAnalytics}
                  fetchBadges={fetchBadges}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-bg-color rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-secondary/30">
              <h3 className="font-display font-bold text-xl text-text-primary m-0 flex items-center gap-2">
                <Star className="text-amber-400" /> Write a Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <p className="text-sm text-text-secondary mb-2">
                Calculus Corner Admin requested your feedback! Please share your experience.
              </p>

              <div className="flex gap-4 mb-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      size={32} 
                      className={star <= reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} 
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-primary block">Your Name</label>
                <input
                  type="text"
                  required
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border-color rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-primary block">Subtitle (e.g. A+ Grade, Federal Board)</label>
                <input
                  type="text"
                  required
                  value={reviewForm.role}
                  onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border-color rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-primary block">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-3 bg-bg-secondary border border-border-color rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border-color mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="flex-1"
                  disabled={reviewSubmitting || !reviewForm.text.trim()}
                >
                  {reviewSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
