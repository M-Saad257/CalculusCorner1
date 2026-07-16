import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useContent } from '../context/ContentContext';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Award, Code, Mail, Phone, BookOpen, Users, Star, BookMarked, Calendar, MapPin } from 'lucide-react';

const AboutPage = () => {
  const { content } = useContent();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getImageUrl = (url) => {
    if (!url) return "/SirMehtabPhoto.png";

    url = url.replace('localost', 'localhost');

    if (url.startsWith("/uploads")) {
      // Serve uploads from the backend running on port 5000
      return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }

    // Fallback map checks for old relative routes mappings
    if (url.startsWith("http://") && !url.includes("localhost")) {
      return url.replace("http://", "https://");
    }

    return url;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-28 pb-20 bg-transparent relative z-10 w-full overflow-hidden">
        
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            className="max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Main Profile Hero - Spans full width on mobile, 8 cols on desktop */}
              <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-8 bg-bg-secondary border border-border-color rounded-2xl p-6 md:p-10 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch relative z-10">
                  <div className="relative w-48 md:w-64 shrink-0 flex flex-col">
                    <div className="w-full h-48 md:h-full rounded-2xl overflow-hidden border border-border-color shadow-md transform group-hover:scale-[1.02] transition-transform duration-500 bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={getImageUrl(content?.about?.image_url)} 
                        alt="Mr. Muhammad Mehtab" 
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const fallbackSrc = window.location.origin + "/SirMehtabPhoto.png";
                          if (e.target.src !== fallbackSrc) {
                            e.target.src = "/SirMehtabPhoto.png";
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-blue-500 text-white p-2.5 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                      <Star size={18} fill="currentColor" />
                    </div>
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold tracking-widest text-xs uppercase mb-4 shadow-sm">
                      Lead Instructor
                    </span>
                    <h1 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-2 leading-tight tracking-tight">
                      Muhammad <span className="text-primary">Mehtab</span>
                    </h1>
                    <h2 className="text-lg md:text-xl text-text-secondary font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
                      <GraduationCap className="text-primary" size={20} /> PhD (Cont.) Mathematics
                    </h2>
                    <p className="text-text-secondary leading-relaxed text-base md:text-lg mb-6 max-w-xl font-medium">
                      Dedicated to making high-level mathematics accessible and engaging. My mission is to build a community where every student can achieve exceptional results through proven teaching methodologies.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <a href="mailto:muhammadmehtab1995@gmail.com" className="flex items-center gap-2 text-sm font-bold text-white bg-primary px-6 py-3 rounded-xl shadow-md hover:bg-primary-dark transition-all hover:-translate-y-1">
                        <Mail size={18} /> Email Me
                      </a>
                      <a href="tel:+923465689633" className="flex items-center gap-2 text-sm font-bold text-primary bg-bg-color border border-primary/20 px-6 py-3 rounded-xl shadow-sm hover:border-primary hover:bg-primary/5 transition-all hover:-translate-y-1">
                        <Phone size={18} /> +92 346-5689633
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats/Quick Info - Spans 4 cols */}
              <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 md:p-8 text-white flex-1 flex items-center gap-6 relative overflow-hidden group shadow-md hover:shadow-lg transition-all">
                  <div className="w-16 h-16 shrink-0 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                    <Users size={32} />
                  </div>
                  <div className="flex-1 z-10">
                    <h3 className="font-display text-4xl lg:text-5xl font-extrabold mb-1 tracking-tight">1000+</h3>
                    <p className="font-bold text-primary-light text-sm uppercase tracking-wider">Students Mentored</p>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </div>

                <div className="bg-bg-color border border-border-color rounded-2xl p-6 md:p-8 flex-1 flex items-center gap-6 relative overflow-hidden group shadow-sm hover:border-primary/40 transition-colors">
                  <div className="w-16 h-16 shrink-0 bg-bg-secondary border border-border-color rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <BookOpen size={32} />
                  </div>
                  <div className="flex-1 z-10">
                    <h3 className="font-display text-4xl lg:text-5xl font-extrabold text-text-primary mb-1 tracking-tight">6+</h3>
                    <p className="font-bold text-text-secondary text-sm uppercase tracking-wider">Years Experience</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700 text-primary pointer-events-none">
                    <BookOpen size={140} />
                  </div>
                </div>
              </motion.div>

              {/* Education Grid */}
              <motion.div variants={itemVariants} className="md:col-span-12 mt-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transform -rotate-3">
                    <GraduationCap size={24} />
                  </div>
                  <h3 className="font-display font-extrabold text-3xl text-text-primary">Academic Journey</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { degree: "PhD Mathematics", inst: "NUML, Islamabad", date: "Jan 2025 – Cont.", highlight: true, icon: Award },
                    { degree: "MS Mathematics", inst: "NUML, Islamabad", date: "Sep 2020 – Jan 2024", highlight: false, icon: BookMarked },
                    { degree: "MSc Mathematics", inst: "AIOU, Islamabad", date: "Mar 2018 – Aug 2020", highlight: false, icon: GraduationCap }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      className={`relative rounded-2xl p-6 xl:p-8 border flex flex-col h-full overflow-hidden group ${
                        item.highlight 
                          ? 'bg-gradient-to-br from-primary to-blue-800 text-white border-transparent shadow-lg shadow-primary/20' 
                          : 'bg-bg-color border-border-color hover:border-primary/40 hover:shadow-md transition-all'
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none ${item.highlight ? 'text-white' : 'text-primary'}`}>
                         <item.icon size={128} />
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-6 self-start shadow-sm border relative z-10 ${
                        item.highlight ? 'bg-white/20 border-white/10 text-white' : 'bg-bg-secondary border-border-color text-text-secondary'
                      }`}>
                        <Calendar size={14} /> {item.date}
                      </div>
                      
                      <h4 className={`font-display font-extrabold text-2xl mb-2 leading-tight relative z-10 ${item.highlight ? 'text-white' : 'text-text-primary'}`}>
                        {item.degree}
                      </h4>
                      
                      <div className={`mt-auto pt-6 flex items-center gap-3 font-semibold relative z-10 ${item.highlight ? 'text-primary-light' : 'text-text-secondary'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.highlight ? 'bg-white/10' : 'bg-bg-secondary border border-border-color text-primary'}`}>
                           <MapPin size={14} />
                        </div>
                        {item.inst}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Experience Highlights */}
              <motion.div variants={itemVariants} className="md:col-span-8 bg-bg-color border border-border-color rounded-[2rem] p-8 md:p-10 shadow-sm mt-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-primary/20 flex items-center justify-center text-primary shadow-sm transform rotate-3">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="font-display font-extrabold text-3xl text-text-primary">Professional Experience</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { role: "School Teacher", org: "FGEI Sir Syed Model Public School Boys", date: "Nov 2023 – Present" },
                    { role: "Lecturer & HOD", org: "Army Public School and College", date: "May 2020 – Nov 2023" },
                    { role: "Lecturer", org: "Oxford Girls Degree College", date: "Aug 2019 – May 2020" },
                    { role: "Lecturer", org: "Potohar College of Science & Commerce", date: "Aug 2018 – Jun 2019" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col border-l-4 border-primary/20 hover:border-primary pl-5 py-1 transition-colors">
                      <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1">{item.date}</span>
                      <h4 className="font-extrabold text-text-primary text-lg mb-1">{item.role}</h4>
                      <p className="text-sm font-medium text-text-secondary">{item.org}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Skills Area */}
              <motion.div variants={itemVariants} className="md:col-span-4 bg-bg-secondary border border-border-color rounded-[2rem] p-8 md:p-10 shadow-sm mt-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
                    <Code size={24} />
                  </div>
                  <h3 className="font-display font-extrabold text-2xl text-text-primary">Skills</h3>
                </div>

                <div className="space-y-6">
                  {[
                    { name: 'Word, Excel, PPT', pct: 95 },
                    { name: 'C++ Programming', pct: 90 },
                    { name: 'Maple', pct: 60 },
                    { name: 'MathType', pct: 60 }
                  ].map((skill, idx) => (
                    <div key={idx} className="group/skill">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-text-primary group-hover/skill:text-primary transition-colors">{skill.name}</span>
                        <span className="text-primary">{skill.pct}%</span>
                      </div>
                      <div className="w-full bg-bg-color rounded-full h-3 shadow-inner overflow-hidden border border-border-color/50">
                        <motion.div 
                          className="bg-primary h-full rounded-full relative" 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 rounded-full blur-[2px]"></div>
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>

          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
