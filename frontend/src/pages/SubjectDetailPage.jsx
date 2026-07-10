import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, Award, Zap, CheckCircle2, ChevronRight, 
  GraduationCap, Clock, Sparkles, PlayCircle, HelpCircle 
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useSocket } from '../hooks/useSocket';

const SubjectDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  
  // State to hold a mini-cache of related subject details for titles
  const [relatedSubjectDetails, setRelatedSubjectDetails] = useState({});

  // Reset scroll to top on slug change or mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchSubject = async () => {
    setLoadingSubject(true);
    try {
      const res = await api.get(`/subjects/${slug}`);
      setSubject(res.data.data);
    } catch (err) {
      setSubject(null);
    } finally {
      setLoadingSubject(false);
    }
  };

  // Fetch Subject Data
  useEffect(() => {
    if (slug) fetchSubject();
  }, [slug]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !slug) return;
    const refreshData = () => fetchSubject();
    socket.on('subject:update', refreshData);
    socket.on('subject:delete', refreshData);
    return () => {
      socket.off('subject:update', refreshData);
      socket.off('subject:delete', refreshData);
    };
  }, [socket, slug]);

  // Set page meta details (SEO title and meta description)
  useEffect(() => {
    if (subject) {
      document.title = subject.seoTitle || `${subject.title} | Calculus Corner`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', subject.seoDescription || subject.subtitle);
    }
  }, [subject]);

  const fetchRelatedData = async () => {
    if (!subject) return;
    
    // Fetch related videos
    try {
      setLoadingVideos(true);
      const res = await api.get('/content/videos');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const filtered = res.data.data.filter(
          v => v.category?.toLowerCase() === subject.relatedVideosCategory?.toLowerCase()
        );
        setVideos(filtered.slice(0, 3));
      }
    } catch (err) {
    } finally {
      setLoadingVideos(false);
    }

    // Fetch related subjects names (just fetch all and cache to be simple)
    try {
      if (subject.relatedSubjects && subject.relatedSubjects.length > 0) {
         const res = await api.get('/subjects');
         if (res.data && res.data.success) {
           const allSubjects = res.data.data;
           const mapping = {};
           allSubjects.forEach(s => {
             mapping[s.slug] = s;
           });
           setRelatedSubjectDetails(mapping);
         }
      }
    } catch (err) {
    }
  };

  // Fetch related videos and related subjects info
  useEffect(() => {
    fetchRelatedData();
  }, [subject]);

  useEffect(() => {
    if (!socket || !subject) return;
    const refreshVideos = () => fetchRelatedData();
    socket.on('video:create', refreshVideos);
    socket.on('video:update', refreshVideos);
    socket.on('video:delete', refreshVideos);
    return () => {
      socket.off('video:create', refreshVideos);
      socket.off('video:update', refreshVideos);
      socket.off('video:delete', refreshVideos);
    };
  }, [socket, subject]);

  if (loadingSubject) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-secondary">
        <Navbar />
        <main className="grow flex items-center justify-center py-20">
          <div className="text-center text-text-tertiary animate-pulse">Loading subject...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle case where subject slug is invalid
  if (!subject) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-secondary">
        <Navbar />
        <main className="grow flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white border border-border-color rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <HelpCircle size={32} />
            </div>
            <h1 className="font-display font-bold text-2xl text-text-primary mb-3">
              Subject Guide Not Found
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              We couldn't find the curriculum detail page you were looking for. It may have been moved or renamed.
            </p>
            <Button variant="primary" onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-color">
      <Navbar />
      
      {/* Hero Header Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-blue-50/40 via-bg-secondary to-bg-color overflow-hidden">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-light/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-8 relative text-left">
          {/* Breadcrumb & Back navigation */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-text-tertiary mb-6 select-none">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/#subjects" className="hover:text-primary transition-colors">Subjects</Link>
            <ChevronRight size={14} />
            <span className="text-text-secondary font-semibold">{subject.title}</span>
          </div>

          <div className="max-w-3xl">
            {subject.badge && (
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary bg-primary-light/10 px-3 py-1.5 rounded-full mb-4 shadow-sm select-none">
                {subject.badge}
              </span>
            )}
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-text-primary mb-4 leading-tight">
              {subject.title} <span className="text-gradient">Learning Path</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
              {subject.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="pb-24 bg-bg-color">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
            
            {/* Main Column */}
            <div className="lg:col-span-2 flex flex-col gap-10 text-left">
              
              {/* Overview */}
              <div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-4 flex items-center gap-2">
                  <BookOpen className="text-primary" size={24} /> Overview
                </h2>
                <div className="h-[2px] w-12 bg-primary mb-6 rounded-full" />
                <p className="text-base md:text-lg text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {subject.overview}
                </p>
              </div>

              {/* Why It Matters Callout */}
              <div className="bg-gradient-to-br from-blue-50/50 via-white to-bg-secondary border border-blue-100 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="font-display font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} /> Why {subject.title} Matters
                </h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                  {subject.whyItMatters}
                </p>
              </div>

              {/* Core Topics Covered */}
              {(subject.topicsCovered && subject.topicsCovered.length > 0) && (
                <div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-4 flex items-center gap-2">
                    <GraduationCap className="text-primary" size={24} /> Syllabus & Key Topics
                  </h2>
                  <div className="h-[2px] w-12 bg-primary mb-6 rounded-full" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subject.topicsCovered.map((topic, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 rounded-2xl bg-bg-secondary border border-border-color/80 shadow-inner">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 select-none">
                          {index + 1}
                        </span>
                        <span className="text-text-primary font-medium text-sm md:text-base leading-snug">
                          {topic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience & We Help */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-border-color shadow-sm text-left">
                  <h4 className="font-display font-bold text-lg text-text-primary mb-3">Target Audience</h4>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                    {subject.whoItIsFor}
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-border-color shadow-sm text-left">
                  <h4 className="font-display font-bold text-lg text-text-primary mb-3">Calculus Corner Support</h4>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                    {subject.howWeHelp}
                  </p>
                </div>
              </div>

              {/* Learning Outcomes */}
              {(subject.learningOutcomes && subject.learningOutcomes.length > 0) && (
                <div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-4 flex items-center gap-2">
                    <Award className="text-primary" size={24} /> What You Will Master
                  </h2>
                  <div className="h-[2px] w-12 bg-primary mb-6 rounded-full" />
                  <div className="flex flex-col gap-4">
                    {subject.learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3.5">
                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                        <span className="text-text-secondary text-sm md:text-base leading-relaxed">
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Preparation Guidance */}
              {(subject.examPrepTips && subject.examPrepTips.length > 0) && (
                <div className="bg-gradient-to-br from-amber-50/50 via-white to-bg-secondary border border-amber-100 rounded-3xl p-6 md:p-8 shadow-sm">
                  <h2 className="font-display font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
                    <Zap className="text-amber-500" size={20} /> Exam-focused Prep Tips
                  </h2>
                  <ul className="list-disc pl-5 flex flex-col gap-3 text-text-secondary text-sm md:text-base leading-relaxed">
                    {subject.examPrepTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Sidebar Column */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              
              {/* Quick Facts Card */}
              <div className="p-6 rounded-3xl bg-white border border-border-color shadow-md text-left">
                <h3 className="font-display font-bold text-lg text-text-primary mb-4 pb-3 border-b border-border-color/60">
                  Quick Facts
                </h3>
                <div className="flex flex-col gap-4">
                  {subject.sidebarDifficulty && (
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-text-tertiary block mb-1">
                        Difficulty Level
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        subject.sidebarDifficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        subject.sidebarDifficulty === 'Medium' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {subject.sidebarDifficulty}
                      </span>
                    </div>
                  )}
                  {subject.sidebarFocus && (
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-text-tertiary block mb-1">
                        Key Focus
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {subject.sidebarFocus}
                      </span>
                    </div>
                  )}
                  {subject.sidebarRecommendedGrade && (
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-text-tertiary block mb-1">
                        Recommended Grade
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {subject.sidebarRecommendedGrade}
                      </span>
                    </div>
                  )}
                  {subject.sidebarStudyTime && (
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-text-tertiary block mb-1">
                        Weekly Study Workload
                      </span>
                      <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                        <Clock size={14} className="text-text-tertiary" /> {subject.sidebarStudyTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Videos Card */}
              {subject.relatedVideosCategory && (
                <div className="p-6 rounded-3xl bg-white border border-border-color shadow-md text-left">
                  <h3 className="font-display font-bold text-lg text-text-primary mb-4 pb-3 border-b border-border-color/60 flex items-center gap-1.5">
                    <PlayCircle className="text-red-500" size={18} /> Related Video Lectures
                  </h3>
                  
                  {loadingVideos ? (
                    <div className="text-xs text-text-tertiary py-4 animate-pulse">Loading related videos...</div>
                  ) : videos.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {videos.map(video => (
                        <div 
                          key={video.id} 
                          onClick={() => window.open(video.url, '_blank')}
                          className="group flex gap-3 cursor-pointer items-start p-2 rounded-xl hover:bg-bg-secondary transition-all"
                        >
                          <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 border border-border-color bg-slate-100 shadow-sm">
                            <img 
                              src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                              alt={video.title} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'; }}
                            />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="text-white drop-shadow" size={16} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-sans font-bold text-xs text-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={video.title}>
                              {video.title}
                            </span>
                            <span className="text-[10px] text-text-tertiary">Watch Lecture</span>
                          </div>
                        </div>
                      ))}
                      <Link to="/courses" className="text-xs text-primary font-bold hover:underline mt-2 flex items-center gap-1">
                        Browse All Lectures <ChevronRight size={12} />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-bg-secondary rounded-2xl text-center border border-dashed border-border-color">
                      <PlayCircle className="text-text-tertiary/60 mb-2" size={24} />
                      <p className="text-xs text-text-secondary leading-snug mb-3">No specific videos uploaded for this category yet.</p>
                      <Link to="/courses">
                        <Button variant="outline" size="sm" className="text-xxs px-3 py-1.5">Browse Learning Portal</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Related Subjects Card */}
              {(subject.relatedSubjects && subject.relatedSubjects.length > 0) && (
                <div className="p-6 rounded-3xl bg-white border border-border-color shadow-md text-left">
                  <h3 className="font-display font-bold text-lg text-text-primary mb-4 pb-3 border-b border-border-color/60">
                    Related Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {subject.relatedSubjects.map(relatedSlug => {
                      const details = relatedSubjectDetails[relatedSlug];
                      const title = details ? details.title : relatedSlug.charAt(0).toUpperCase() + relatedSlug.slice(1);
                      return (
                        <Link 
                          key={relatedSlug} 
                          to={`/subjects/${relatedSlug}`}
                          className="px-3 py-1.5 bg-bg-secondary hover:bg-primary hover:text-white border border-border-color/60 rounded-full text-xs font-semibold text-text-secondary hover:border-primary transition-all cursor-pointer"
                        >
                          {title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className="bg-bg-secondary py-16 text-center border-t border-border-color relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-3xl relative">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl text-text-primary mb-4 leading-tight">
            Accelerate Your Math Mastery with <span className="text-gradient">Calculus Corner</span>
          </h2>
          <p className="text-base text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
            Gain immediate access to our expert-designed syllabus courses, extensive practice worksheets, and step-by-step AI Solver guidance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/courses" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto px-8 py-3 text-sm">
                Get Started Today
              </Button>
            </Link>
            <Link to="/#contact" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-sm">
                Contact for Guidance
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SubjectDetailPage;
