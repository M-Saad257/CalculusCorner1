import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Clock, BarChart, Medal, X, ChevronRight, Sparkles, Award, Loader2, Play, BookOpen, MousePointerClick, ShieldAlert } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const Practice = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const navigate = useNavigate();
  const { alert: showAlert, showToast } = useDialog();
  const [selectedOption, setSelectedOption] = useState('');
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  // Modals state
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showTimedModal, setShowTimedModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('reports');
  const [topicsList, setTopicsList] = useState([]);
  const [pendingTopic, setPendingTopic] = useState(null);
  const [pendingTimeMode, setPendingTimeMode] = useState(null);
  const [flowOrigin, setFlowOrigin] = useState(null);

  // Quiz Engine state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(420); // default 7 minutes
  const [totalTime, setTotalTime] = useState(420);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false); // true only after user explicitly clicks "Start Quiz"
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Quiz context metadata
  const [quizTitle, setQuizTitle] = useState('Daily Challenge');
  const [quizSubtitle, setQuizSubtitle] = useState('Calculus: Applications of Derivatives');
  const [quizType, setQuizType] = useState('practice');
  const [topicName, setTopicName] = useState(null);

  // Quiz results metrics
  const [scoreMetrics, setScoreMetrics] = useState({
    score: 0,
    percentage: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    timeTaken: 0
  });

  const fetchTopics = async () => {
    try {
      const res = await api.get('/practice/topics');
      if (res.data && res.data.success) {
        setTopicsList(res.data.data);
      }
    } catch (err) {
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('question_pool:update', fetchTopics);
    return () => {
      socket.off('question_pool:update', fetchTopics);
    };
  }, [socket]);

  // Load active quiz or initialize new one
  useEffect(() => {
    fetchTopics();

    const savedState = localStorage.getItem('practice_quiz_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        // Auto-clear old 'Daily Challenge' caches to force the new selection screen
        if (state.quizTitle === 'Daily Challenge') {
          localStorage.removeItem('practice_quiz_state');
          return;
        }

        if (state && !state.isCompleted && state.questions && state.questions.length > 0) {
          if (state.quizStarted && state.startTimestamp) {
            // Quiz was actively running — verify timer hasn't expired while user was away
            const elapsedSinceStart = Math.floor((Date.now() - state.startTimestamp) / 1000);
            const remaining = state.totalTime - elapsedSinceStart;

            if (remaining <= 0) {
              // Time ran out while away — auto-submit with answers recorded so far
              calculateAndSubmitQuiz(state.questions, state.answers, state.totalTime, state.quizType, state.topic);
              localStorage.removeItem('practice_quiz_state');
            } else {
              setQuestions(state.questions);
              setCurrentIndex(state.currentIndex);
              setAnswers(state.answers);
              setTimeLeft(remaining);
              setTotalTime(state.totalTime);
              setQuizInProgress(true);
              setQuizStarted(true);
              setQuizTitle(state.quizTitle);
              setQuizSubtitle(state.quizSubtitle);
              setQuizType(state.quizType);
              setTopicName(state.topic);
              const currentQ = state.questions[state.currentIndex];
              setSelectedOption(state.answers[currentQ.id] || '');
              return;
            }
          } else {
            // Quiz was fetched but user never clicked Start — restore to ready screen, no timer
            setQuestions(state.questions);
            setCurrentIndex(0);
            setAnswers({});
            setTimeLeft(state.totalTime);
            setTotalTime(state.totalTime);
            setQuizInProgress(true);
            setQuizStarted(false);
            setQuizTitle(state.quizTitle);
            setQuizSubtitle(state.quizSubtitle);
            setQuizType(state.quizType);
            setTopicName(state.topic);
            return;
          }
        }
      } catch (err) {
      }
    }
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (!quizInProgress || !quizStarted || isCompleted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          calculateAndSubmitQuiz(questions, answers, totalTime, quizType, topicName);
          return 0;
        }

        const savedState = localStorage.getItem('practice_quiz_state');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            state.timeLeft = prev - 1;
            state.currentIndex = currentIndex;
            state.answers = answers;
            localStorage.setItem('practice_quiz_state', JSON.stringify(state));
          } catch (e) { }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizInProgress, quizStarted, isCompleted, questions, answers, currentIndex, totalTime, quizType, topicName]);

  const generateNewQuiz = async (type, topic = null, customLimit = 10, customMinutes = 7) => {
    try {
      setLoadingQuestions(true);
      setIsCompleted(false);
      setQuizStarted(false); // Reset — user must click Start Quiz again
      setSelectedOption('');
      setAnswers({});
      setCurrentIndex(0);

      const seconds = customMinutes * 60;
      setTimeLeft(seconds);
      setTotalTime(seconds);

      let endpoint = '/practice/questions';
      const params = { limit: customLimit };
      if (topic) params.topic = topic;

      const res = await api.get(endpoint, { params });
      if (res.data && res.data.success && res.data.data.length > 0) {
        const fetchedQuestions = res.data.data;
        setQuestions(fetchedQuestions);
        setQuizInProgress(true);
        setQuizType(type);
        setTopicName(topic);

        let title = 'Daily Challenge';
        let subtitle = 'Calculus: Shuffled Practice';
        const timeLabel = customLimit === 5 ? 'Quick' : customLimit === 20 ? 'Challenge' : 'Standard';

        if (type === 'topic') {
          title = `Topic Test (${timeLabel})`;
          subtitle = `Calculus: ${topic}`;
        } else if (type === 'timed') {
          title = `Timed Quiz (${timeLabel})`;
          subtitle = `Calculus: ${topic ? topic : 'General Practice'}`;
        }

        setQuizTitle(title);
        setQuizSubtitle(subtitle);

        const quizState = {
          questions: fetchedQuestions,
          currentIndex: 0,
          answers: {},
          totalTime: seconds,
          startTimestamp: null,      // Stamped only when user clicks "Start Quiz"
          quizTitle: title,
          quizSubtitle: subtitle,
          quizType: type,
          topic,
          isCompleted: false,
          quizStarted: false          // Timer gate — set to true in handleStartQuiz
        };
        localStorage.setItem('practice_quiz_state', JSON.stringify(quizState));
      } else {
        setQuestions([]);
        setQuizInProgress(false);
      }
    } catch (err) {
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Called when user clicks "Start Quiz" — stamps the real start time and activates the timer
  const handleStartQuiz = () => {
    const now = Date.now();
    setQuizStarted(true);
    const savedState = localStorage.getItem('practice_quiz_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        state.startTimestamp = now;
        state.quizStarted = true;
        localStorage.setItem('practice_quiz_state', JSON.stringify(state));
      } catch (e) { }
    }
  };

  const calculateAndSubmitQuiz = async (qList, ansMap, maxTime, type, topic) => {
    setIsCompleted(true);
    setQuizInProgress(false);
    localStorage.removeItem('practice_quiz_state');

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const formattedAnswers = qList.map(q => {
      const selected = ansMap[q.id] || null;
      const isCorrect = selected === q.correctAnswer;

      if (!selected) skipped++;
      else if (isCorrect) correct++;
      else wrong++;

      return {
        questionId: q.id,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    const score = correct;
    const totalQ = qList.length;
    const pct = totalQ > 0 ? (correct / totalQ) * 100 : 0;
    const timeSpent = maxTime - timeLeft;

    const metrics = {
      score,
      percentage: parseFloat(pct.toFixed(1)),
      correct,
      wrong,
      skipped,
      timeTaken: timeSpent
    };

    setScoreMetrics(metrics);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const attemptPayload = {
          answers: formattedAnswers.map(a => ({
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer
          })),
          timeTaken: timeSpent,
          quizType: type,
          topic: topic || 'General'
        };
        const res = await api.post('/student/practice/attempt', attemptPayload);
        if (res.data && res.data.success && res.data.data.newBadges?.length > 0) {
          const badgeNames = res.data.data.newBadges.map(b => b.badgeName).join(', ');
          showAlert('Achievement Unlocked!', `Earned badge(s): ${badgeNames}. View them in your dashboard.`);
        }
      } catch (err) {
      }
    } else {
      // Save pending quiz attempt in localStorage for restoring after login
      const pendingAttempt = {
        score,
        totalQuestions: totalQ,
        answers: formattedAnswers,
        timeTaken: timeSpent,
        quizType: type,
        topic: topic || 'General',
        scoreMetrics: metrics
      };
      localStorage.setItem('pending_quiz_attempt', JSON.stringify(pendingAttempt));
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);

    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(updatedAnswers);

    const savedState = localStorage.getItem('practice_quiz_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        state.answers = updatedAnswers;
        localStorage.setItem('practice_quiz_state', JSON.stringify(state));
      } catch (e) { }
    }
  };

  const handleSkip = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      setSelectedOption(answers[nextQ.id] || '');

      const savedState = localStorage.getItem('practice_quiz_state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          state.currentIndex = nextIdx;
          localStorage.setItem('practice_quiz_state', JSON.stringify(state));
        } catch (e) { }
      }
    } else {
      calculateAndSubmitQuiz(questions, answers, totalTime, quizType, topicName);
    }
  };

  const handleSubmitAnswer = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      setSelectedOption(answers[nextQ.id] || '');

      const savedState = localStorage.getItem('practice_quiz_state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          state.currentIndex = nextIdx;
          localStorage.setItem('practice_quiz_state', JSON.stringify(state));
        } catch (e) { }
      }
    } else {
      calculateAndSubmitQuiz(questions, answers, totalTime, quizType, topicName);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTopicTest = (topic) => {
    setShowTopicModal(false);
    setPendingTopic(topic);
    
    if (pendingTimeMode) {
      generateNewQuiz(flowOrigin || 'topic', topic, pendingTimeMode.count, pendingTimeMode.minutes);
      setPendingTimeMode(null);
      setPendingTopic(null);
      setFlowOrigin(null);
    } else {
      setShowTimedModal(true);
    }
  };

  const startTimedQuiz = (mode) => {
    setShowTimedModal(false);
    setPendingTimeMode(mode);
    
    if (pendingTopic) {
      generateNewQuiz(flowOrigin || 'timed', pendingTopic, mode.count, mode.minutes);
      setPendingTimeMode(null);
      setPendingTopic(null);
      setFlowOrigin(null);
    } else {
      setShowTopicModal(true);
    }
  };

  const handleReportsClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard?tab=performance');
    } else {
      navigate('/auth?redirect=/dashboard?tab=performance', { state: { redirectTo: '/dashboard?tab=performance' } });
    }
  };

  const handleBadgesClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard?tab=badges');
    } else {
      navigate('/auth?redirect=/dashboard?tab=badges', { state: { redirectTo: '/dashboard?tab=badges' } });
    }
  };

  const formatTimeTaken = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="practice" className="py-16 md:py-24 bg-bg-secondary relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">

        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            Interactive Learning
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            Master Concepts with <span className="text-gradient">Active Practice</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Reading lessons is just the start - you need reps. Our quiz system adapts to your level, tracks your weak spots, and keeps you on track for exam day.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Main Dashboard Preview */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-border-color glass min-h-[440px] flex flex-col justify-between">
            {loadingQuestions ? (
              <Loader text="Loading practice questions..." />
            ) : isCompleted ? (
              <div className="p-8 text-center flex flex-col items-center justify-center grow gap-5 relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl md:text-2xl text-text-primary m-0">Quiz Completed!</h3>
                  <p className="text-xs text-text-secondary mt-1">{quizTitle} - {quizSubtitle}</p>
                </div>

                {/* Results Container (Relative, with optional Blur) */}
                <div className="w-full max-w-sm relative mt-2">
                  <div className={`grid grid-cols-2 gap-4 w-full text-left transition-all duration-300 ${!localStorage.getItem('token') ? 'blur-md select-none pointer-events-none' : ''}`}>
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color/60">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary">Your Score</span>
                      <p className="font-display font-black text-xl text-primary mt-1 m-0">{scoreMetrics.score} / {questions.length}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color/60">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary">Percentage</span>
                      <p className="font-display font-black text-xl text-indigo-600 mt-1 m-0">{scoreMetrics.percentage}%</p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color/60">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary">Correct / Wrong</span>
                      <p className="font-sans font-bold text-sm text-text-primary mt-1 m-0">
                        <span className="text-emerald-500 font-extrabold">{scoreMetrics.correct}</span> / <span className="text-rose-500 font-extrabold">{scoreMetrics.wrong}</span>
                      </p>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color/60">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary">Time Spent / Skipped</span>
                      <p className="font-sans font-bold text-sm text-text-primary mt-1 m-0">
                        {formatTimeTaken(scoreMetrics.timeTaken)} / <span className="text-text-tertiary font-semibold">{scoreMetrics.skipped} skip</span>
                      </p>
                    </div>
                  </div>

                  {/* Auth Requirement Overlay */}
                  {!localStorage.getItem('token') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/70 backdrop-blur-xs rounded-2xl text-center border border-border-color/50 shadow-sm animate-fadeIn">
                      <h4 className="font-display font-extrabold text-sm text-text-primary mb-2">Requires Login / Signup</h4>
                      <div className="flex gap-2.5 w-full max-w-[210px]">
                        <button
                          onClick={() => {
                            navigate('/auth?redirect=/dashboard', { state: { redirectTo: '/dashboard' } });
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-xs rounded-xl border-0 shadow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => {
                            navigate('/auth?redirect=/dashboard', { state: { redirectTo: '/dashboard' } });
                          }}
                          className="flex-1 px-3 py-2 bg-white hover:bg-bg-secondary text-primary hover:text-primary-dark font-bold text-xs rounded-xl border border-border-color hover:border-primary-light hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {localStorage.getItem('token') && (
                  <Button
                    variant="primary"
                    onClick={() => generateNewQuiz(quizType, topicName, questions.length || 10, Math.floor(totalTime / 60) || 7)}
                    className="px-6 py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer mt-2"
                  >
                    Start New Quiz
                  </Button>
                )}
              </div>
            ) : questions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center grow text-text-secondary font-semibold text-sm h-full">
                {isAdmin ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center mb-4">
                      <ShieldAlert size={32} />
                    </div>
                    <h3 className="font-display font-bold text-xl text-text-primary mb-2">Access Denied</h3>
                    <p className="text-sm text-text-secondary max-w-sm leading-relaxed mb-8">
                      You do not have the permissions required to access this resource. Please make sure you are logged in with the correct role.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-[200px]">
                      <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/admin')}>
                        Go to Workspace
                      </Button>
                    </div>
                  </>
                ) : topicsList.length === 0 ? (
                  <>
                    <BookOpen size={56} strokeWidth={1.5} className="mb-5 text-slate-300" />
                    <span className="text-base font-bold text-blue-500">No quiz questions found. </span><br /><span className='text-sm text-gray-500'>We're preparing high-quality practice questions for this topic.</span>
                  </>
                ) : (
                  <>
                    <MousePointerClick size={56} strokeWidth={1.5} className="mb-5 text-primary/30 animate-pulse" />
                    <span className="text-base text-slate-500 max-w-xs leading-relaxed">
                      Please select a topic and time limit from the options to start your practice session!
                    </span>
                  </>
                )}
              </div>
            ) : !quizStarted ? (
              /* ── Quiz Ready Screen — shown after questions load, before user starts ── */
              <motion.div
                className="bg-white p-6 rounded-2xl border-border-color shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="p-8 text-center flex flex-col items-center justify-center grow gap-5">
                  <div>
                    <h3 className="font-display font-bold text-xl md:text-4xl text-text-primary m-0">{quizTitle}</h3>
                    <p className="text-xs text-text-secondary mt-5">{quizSubtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-[260px] py-5">
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color text-center">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary block mb-1">Questions</span>
                      <span className="font-display font-black text-2xl text-primary">{questions.length}</span>
                    </div>
                    <div className="p-3 bg-bg-secondary rounded-2xl border border-border-color text-center">
                      <span className="text-[10px] font-extrabold uppercase text-text-tertiary block mb-1">Time Limit</span>
                      <span className="font-display font-black text-2xl text-primary">
                        {Math.floor(totalTime / 60)}<span className="text-sm font-bold text-text-secondary">m</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleStartQuiz}
                    className="px-8 py-3 text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Play size={15} fill="currentColor" />
                    Start Quiz
                  </Button>
                  <p className="text-[10px] text-text-tertiary mt-2">Timer starts only after you click Start Quiz</p>
                  
                  <button 
                    onClick={() => {
                      localStorage.removeItem('practice_quiz_state');
                      setQuizInProgress(false);
                      setQuizStarted(false);
                      setQuestions([]);
                    }}
                    className="mt-2 text-xs font-bold text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer transition-colors"
                  >
                    Cancel Saved Quiz
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex justify-between items-center p-4 md:px-6 md:py-4 bg-linear-to-tr from-slate-50 to-slate-100/50 border-b border-border-color text-left shrink-0">
                  <div>
                    <h3 className="font-display font-bold text-base md:text-lg text-text-primary mb-0.5">{quizTitle}</h3>
                    <p className="text-xs md:text-sm text-text-secondary font-medium">{quizSubtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-full font-bold text-xs md:text-sm shadow-sm border border-red-100 shrink-0">
                    <Clock size={16} /> <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                <div className="p-4 md:p-6 text-left grow flex flex-col justify-between">
                  <div>
                    <span className="text-xs md:text-sm text-primary font-bold uppercase tracking-wider mb-2 block">Question {currentIndex + 1} of {questions.length}</span>
                    <p className="text-base md:text-lg text-text-primary font-semibold mb-4 leading-relaxed">{questions[currentIndex].question}</p>

                    <div className="flex flex-col gap-2 mb-4">
                      {questions[currentIndex].options.map((opt, idx) => {
                        const label = String.fromCharCode(65 + idx);
                        const isSelected = selectedOption === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleOptionSelect(opt)}
                            className={`text-left p-3 md:py-2.5 md:px-4 rounded-xl font-sans text-sm md:text-base border cursor-pointer transition-all duration-200 ${isSelected
                              ? 'bg-blue-50/70 border-primary text-primary font-semibold shadow-sm ring-1 ring-primary'
                              : 'bg-bg-secondary border-border-color text-text-primary hover:bg-blue-50/40 hover:border-blue-200'
                              }`}
                          >
                            {label}) {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border-color pt-4">
                    <Button variant="outline" onClick={handleSkip} className="px-5 py-2.5 text-sm cursor-pointer">Skip</Button>
                    <Button variant="primary" onClick={handleSubmitAnswer} disabled={!selectedOption} className="px-5 py-2.5 text-sm cursor-pointer">Submit Answer</Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <motion.div
              variants={itemVariants}
              onClick={() => {
                setPendingTopic(null);
                setPendingTimeMode(null);
                setFlowOrigin('topic');
                setShowTopicModal(true);
              }}
              className={`bg-white p-6 rounded-2xl border border-border-color shadow-sm transition-all duration-300 text-left ${isAdmin ? 'opacity-50 cursor-not-allowed blur-[2px] pointer-events-none' : 'hover:-translate-y-1 hover:shadow-md cursor-pointer group'}`}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-indigo-50 text-indigo-600 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                <CheckCircle size={24} />
              </div>
              <h4 className="font-sans font-bold text-base md:text-lg text-text-primary mb-2 group-hover:text-primary transition-colors">Topic Tests</h4>
              <p className="text-sm text-text-secondary leading-relaxed">MCQs built around every single sub-topic in your syllabus - no guesswork about what to study.</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              onClick={() => {
                setPendingTopic(null);
                setPendingTimeMode(null);
                setFlowOrigin('timed');
                setShowTimedModal(true);
              }}
              className={`bg-white p-6 rounded-2xl border border-border-color shadow-sm transition-all duration-300 text-left ${isAdmin ? 'opacity-50 cursor-not-allowed blur-[2px] pointer-events-none' : 'hover:-translate-y-1 hover:shadow-md cursor-pointer group'}`}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-red-50 text-red-500 shadow-inner group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Clock size={24} />
              </div>
              <h4 className="font-sans font-bold text-base md:text-lg text-text-primary mb-2 group-hover:text-red-500 transition-colors">Timed Quizzes</h4>
              <p className="text-sm text-text-secondary leading-relaxed">Practice under real exam time pressure so you're not caught off guard when it actually counts.</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              onClick={handleReportsClick}
              className="bg-white p-6 rounded-2xl border border-border-color shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 text-left cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-emerald-50 text-emerald-600 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <BarChart size={24} />
              </div>
              <h4 className="font-sans font-bold text-base md:text-lg text-text-primary mb-2 group-hover:text-emerald-500 transition-colors">Performance Reports</h4>
              <p className="text-sm text-text-secondary leading-relaxed">See where you're strong and where you keep losing marks - then fix exactly that.</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              onClick={handleBadgesClick}
              className="bg-white p-6 rounded-2xl border border-border-color shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 text-left cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-amber-50 text-amber-600 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Medal size={24} />
              </div>
              <h4 className="font-sans font-bold text-base md:text-lg text-text-primary mb-2 group-hover:text-amber-500 transition-colors">Achievement Badges</h4>
              <p className="text-sm text-text-secondary leading-relaxed">Earn badges as you get through tough topics - a small win that keeps you going.</p>
            </motion.div>
          </div>
        </motion.div>

      </div>

      {/* Topic Selection Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl w-full max-w-md text-left animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-text-primary m-0">Select Topic Test</h3>
              <button onClick={() => setShowTopicModal(false)} className="p-1.5 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            {topicsList.length === 0 ? (
              <p className="text-sm text-text-secondary m-0">No topics available in the pool. Ask admin to upload questions!</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {topicsList.map(topic => (
                  <button
                    key={topic}
                    onClick={() => startTopicTest(topic)}
                    className="p-4 rounded-xl border border-border-color hover:border-primary bg-bg-secondary/40 hover:bg-primary/5 text-left font-semibold text-xs md:text-sm text-text-primary transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <span>{topic}</span>
                    <ChevronRight size={16} className="text-text-tertiary group-hover:text-primary transition-colors animate-pulse" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timed Quiz Modal */}
      {showTimedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowTimedModal(false)}>
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl w-full max-w-3xl text-left animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-text-primary m-0">Select Timed Quiz Mode</h3>
                <p className="text-xs text-text-secondary mt-1 m-0">Choose a format and challenge yourself against the clock.</p>
              </div>
              <button onClick={() => setShowTimedModal(false)} className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer flex-shrink-0 ml-4">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Quick Quiz', count: 5, minutes: 3, desc: 'A fast 5-question sprint to test your core recall.', mode: 'quick', color: 'indigo' },
                { name: 'Standard Quiz', count: 10, minutes: 7, desc: 'A balanced 10-question quiz mixing depth and speed.', mode: 'standard', color: 'primary' },
                { name: 'Challenge Mode', count: 20, minutes: 15, desc: 'A grueling 20-question exam simulation for math masters.', mode: 'challenge', color: 'red' }
              ].map(mode => (
                <button
                  key={mode.mode}
                  onClick={() => startTimedQuiz(mode)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-3 group hover:-translate-y-1 hover:shadow-lg ${
                    mode.color === 'indigo' ? 'border-indigo-100 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50' :
                    mode.color === 'red' ? 'border-red-100 hover:border-red-400 bg-red-50/40 hover:bg-red-50' :
                    'border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                    mode.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                    mode.color === 'red' ? 'bg-red-100 text-red-600' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {mode.count} Qs / {mode.minutes} Mins
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className={`font-bold text-sm sm:text-base transition-colors ${
                      mode.color === 'indigo' ? 'text-text-primary group-hover:text-indigo-600' :
                      mode.color === 'red' ? 'text-text-primary group-hover:text-red-500' :
                      'text-text-primary group-hover:text-primary'
                    }`}>{mode.name}</span>
                    <span className="text-xs text-text-secondary leading-relaxed">{mode.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl w-full max-w-sm text-center animate-fadeIn flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-primary flex items-center justify-center shadow-inner">
              <Award size={24} />
            </div>
            <h3 className="font-display font-bold text-lg text-text-primary m-0">Authentication Required</h3>
            <p className="text-xs text-text-secondary leading-relaxed m-0">
              {authModalReason === 'reports'
                ? 'Please log in or create an account to view your dynamic performance reports and quiz statistics.'
                : 'Please log in or create an account to earn achievement badges and track your masteries.'}
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  const target = authModalReason === 'reports' ? '/dashboard?tab=performance' : '/dashboard?tab=badges';
                  navigate(`/auth?redirect=${encodeURIComponent(target)}`, { state: { redirectTo: target } });
                }}
                className="grow py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-xs rounded-xl border-0 shadow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  const target = authModalReason === 'reports' ? '/dashboard?tab=performance' : '/dashboard?tab=badges';
                  navigate(`/auth?redirect=${encodeURIComponent(target)}`, { state: { redirectTo: target } });
                }}
                className="grow py-2.5 bg-white hover:bg-bg-secondary text-primary hover:text-primary-dark font-bold text-xs rounded-xl border border-border-color hover:border-primary-light hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Practice;
