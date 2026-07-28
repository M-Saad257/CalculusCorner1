import React, { useState } from 'react';
import { useContent } from '../../context/ContentContext';
import {
  GraduationCap,
  Briefcase,
  Award,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  User,
  Code,
  FileText,
  Layers
} from 'lucide-react';

const About = () => {
  const { content } = useContent();
  const aboutData = content?.about || {};
  const [activeTab, setActiveTab] = useState('profile');

  const fallbackData = {
    badge: 'About the Founder',
    heading: 'Mr. Muhammad Mehtab',
    heading_gradient: 'PhD (Cont.) Mathematics',
    profile_description: 'The objective of my career is to become a **better researcher** in my field to deliver a **positive contribution** in scientific community and to become a **creative and resourceful teacher** with proven abilities to **enhance student\'s performance**. Possess a **positive and effective teaching style** with the willingness to work above and beyond the call of duty.',
    education_phd: 'PhD Mathematics from National University of Modern Languages, Islamabad, Pakistan (January 2025 – Present). Research area focused on **Advanced Numerical Methods** and **Computational Fluid Dynamics**.',
    education_ms: 'MS Mathematics from National University of Modern Languages, Islamabad, Pakistan (2020 – 2024). **Thesis Title:** **Extension of finite difference scheme** for the **time-fractional hyperbolic problem** with **stability analysis**.',
    education_msc: 'MSc Mathematics from Allama Iqbal Open University, Islamabad, Pakistan (2018 – 2020). Specialization: **Pure & Applied Mathematics**.',
    education_bsc: 'BSc Mathematics from University of the Punjab, Lahore, Pakistan (2015 – 2018). Specialization: **Pure & Applied Mathematics**.',
    education_bed: 'B.Ed. Education from Virtual University of Pakistan (2021 – 2022). Specialization: **Education Science**.',
    experience_ssms: 'School Teacher at **Federal Government Education Institute**, Rawalpindi (November 2023 – Present). Taught Mathematics to the students of **SSC level**.',
    experience_aps: 'Lecturer & HOD at **Army Public School and College**, Rawat, Islamabad (May 2020 – November 2023). Taught mathematics at **HSSC level**, served as **Head of Department (HOD) of Mathematics**, and acted as **Discipline Incharge**.',
    experience_oxford: 'Lecturer at **Oxford Girls Degree College**, Shah Bagh, Rawalpindi (August 2019 – May 2020). Taught core undergraduate courses: **metric space**, **mechanics**, **vector calculus**, **mathematical methods**, and **calculus**.',
    experience_potohar: 'Lecturer at **Potohar College of Science & Commerce for Boys**, Kallar Syadan (August 2018 – June 2019). Taught mathematics to the students of **HSSC level**.',
    skill_cpp: '90',
    skill_maple: '95',
    skill_mathtype: '95',
    skill_office: '95',
    personal_dob: '01-December-1995',
    personal_email: 'muhammadmehtab1995@gmail.com',
    personal_hobbies: 'Badminton, Cricket, Programming, Article reading, Poetry',
    image_url: '/Final.webp'
  };

  const data = { ...fallbackData, ...aboutData };

  const parseMarkdown = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.flatMap((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-primary font-extrabold dark:text-primary-light">{part.slice(2, -2)}</strong>;
      }
      const subParts = part.split(/(\*.*?\*)/g);
      return subParts.map((subPart, subIndex) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          return <em key={`${index}-${subIndex}`} className="italic font-medium text-text-primary dark:text-text-primary">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
      });
    });
  };

  const getSkillLabel = (pct) => {
    const val = parseInt(pct) || 0;
    if (val >= 90) return 'Expert';
    if (val >= 75) return 'Advanced';
    return 'Proficient';
  };

  const renderSpecializationTags = (text) => {
    const specMatch = text.match(/(?:specialization|specialized in):\s*([^\.]+)/i);
    if (specMatch && specMatch[1]) {
      const specs = specMatch[1].split(/&|,|and/i).map(s => s.trim()).filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {specs.map((spec, i) => {
            const cleanSpec = spec.replace(/\*/g, '');
            return (
              <span key={i} className="text-[9px] font-extrabold text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary-light px-2.5 py-1 rounded-full select-none tracking-wider uppercase">
                {cleanSpec}
              </span>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const parseTimelineEntry = (text, defaultTitle, defaultInst) => {
    if (!text) return { title: defaultTitle, inst: defaultInst, details: '' };

    let splitIndex = text.indexOf(' from ');
    let splitLen = 6;
    if (splitIndex === -1) {
      splitIndex = text.indexOf(' at ');
      splitLen = 4;
    }
    if (splitIndex === -1) {
      splitIndex = text.indexOf(': ');
      splitLen = 2;
    }

    if (splitIndex !== -1) {
      const title = text.substring(0, splitIndex).trim();
      const rest = text.substring(splitIndex + splitLen).trim();

      // Check if there's a newline separating the header from details
      const newlineIndex = rest.indexOf('\n');
      if (newlineIndex !== -1) {
        const inst = rest.substring(0, newlineIndex).trim();
        const details = rest.substring(newlineIndex).trim();
        return { title, inst, details };
      }

      // Fallback to dot search if no newline is found
      const dotIndex = rest.search(/\.(?=\s|\b|$)/);
      if (dotIndex !== -1) {
        const inst = rest.substring(0, dotIndex).trim();
        const details = rest.substring(dotIndex + 1).trim();
        return { title, inst, details };
      } else {
        return { title, inst: rest, details: '' };
      }
    }

    return { title: defaultTitle, inst: defaultInst, details: text };
  };

  const renderEducationItem = (text, defaultTitle, defaultInst) => {
    const parsed = parseTimelineEntry(text, defaultTitle, defaultInst);
    const hasThesis = parsed.details.toLowerCase().includes('thesis');
    let mainText = parsed.details;
    let thesisText = '';

    if (hasThesis) {
      let matchIndex = parsed.details.search(/\*\*thesis/i);
      if (matchIndex === -1) {
        matchIndex = parsed.details.search(/thesis/i);
      }
      if (matchIndex !== -1) {
        mainText = parsed.details.substring(0, matchIndex).trim();
        thesisText = parsed.details.substring(matchIndex).trim();
      }
    }

    return (
      <div className="relative pl-10 pb-2 text-left group">
        {/* Sleek Timeline Graduation Bullet */}
        <div className="absolute -left-[29px] top-1.5 w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center border-4 border-bg-color dark:border-bg-secondary shadow-md group-hover:scale-110 transition-transform duration-300 z-10 select-none">
          <GraduationCap size={13} className="text-primary dark:text-primary-light fill-primary/10" />
        </div>

        {/* Cohesive Micro-Card */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-color/50 dark:bg-bg-secondary/30 hover:border-primary/20 hover:shadow-md transition-all duration-300">
          <span className="inline-block text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-wider mb-0.5">
            {parseMarkdown(parsed.title)}
          </span>
          <p className="text-xs text-text-secondary font-bold mb-2">
            {parseMarkdown(parsed.inst)}
          </p>
          {mainText && (
            <p className="text-xs text-text-secondary leading-relaxed font-normal whitespace-pre-line">
              {parseMarkdown(mainText)}
            </p>
          )}

          {/* Specialization Tags */}
          {renderSpecializationTags(text)}

          {/* Research Thesis Box */}
          {thesisText && (
            <div className="mt-4 p-4 rounded-xl border-l-4 border-l-primary bg-gradient-to-r from-primary/[0.03] to-primary-dark/[0.01] dark:from-primary/[0.05] dark:to-primary-dark/[0.02] border border-border-color/60 flex flex-col gap-2 shadow-sm text-left">
              <span className="text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-wider flex items-center gap-1.5 select-none">
                <FileText size={12} className="text-primary animate-pulse" /> Research Thesis & Formulation
              </span>
              <p className="text-xs italic text-text-secondary leading-relaxed font-normal whitespace-pre-line">
                {parseMarkdown(thesisText)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExperienceItem = (text, defaultTitle, defaultInst) => {
    const parsed = parseTimelineEntry(text, defaultTitle, defaultInst);
    return (
      <div className="relative pl-10 pb-2 text-left group">
        {/* Timeline Bullet */}
        <div className="absolute -left-[29px] top-1.5 w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center border-4 border-bg-color dark:border-bg-secondary shadow-md group-hover:scale-110 transition-transform duration-300 z-10 select-none">
          <Briefcase size={13} className="text-primary dark:text-primary-light fill-primary/10" />
        </div>

        {/* Card */}
        <div className="p-5 rounded-2xl border border-border-color bg-bg-color/50 dark:bg-bg-secondary/30 hover:border-primary/20 hover:shadow-md transition-all duration-300">
          <span className="inline-block text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-wider mb-0.5">
            {parseMarkdown(parsed.title)}
          </span>
          <p className="text-xs text-text-secondary font-bold mb-2">
            {parseMarkdown(parsed.inst)}
          </p>
          {parsed.details && (
            <p className="text-xs text-text-secondary leading-relaxed font-normal whitespace-pre-line">
              {parseMarkdown(parsed.details)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const getImageUrl = (url) => {
    if (!url) return "/Final.webp";
    url = url.replace('localost', 'localhost');
    if (url.startsWith("/uploads")) {
      return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }
    return url;
  };

  return (
    <section id="about-founder" className="relative py-24 bg-bg-color/50 dark:bg-[#0B1221]/50 border-t border-border-color text-text-primary overflow-hidden text-left">

      {/* Decorative math grids */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="about-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#about-grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Award size={14} className="animate-pulse" /> {data.badge}
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-gray-900 dark:text-text-primary mb-4">
            {data.heading}
            <span className="block mt-1 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              {data.heading_gradient}
            </span>
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-primary to-primary-dark rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT COLUMN: Portrait & Personal Details */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">

            {/* Elegant Portrait Box */}
          <div className="relative w-full max-w-[390px] rounded-[20px] bg-gradient-to-b from-blue-50/80 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/60 dark:border-slate-800 mb-20 flex justify-center items-end h-[440px] shadow-lg">
                <img
                  src={getImageUrl(data.image_url)}
                  alt={data.heading}
                  className="w-full h-full object-cover object-bottom transition-transform duration-700 group-hover/portrait:scale-105"
                  onError={(e) => {
                    e.target.src = "/Final.webp";
                  }}
                />

                {/* Glowing Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                {/* Frosted Floating Info Panel */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-left z-20 shadow-lg transition-transform duration-300 group-hover/portrait:translate-y-[-2px]">
                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-primary-light mb-1 select-none">Founder & Instructor</p>
                  <h4 className="font-display font-black text-base !text-white leading-tight mb-0.5" style={{ color: '#ffffff' }}>{data.heading}</h4>
                  <p className="text-[11px] text-slate-300 font-semibold">{data.heading_gradient}</p>
                </div>
            </div>

            {/* Instructor Details Card */}
            <div className="p-6 rounded-[32px] border border-border-color bg-bg-color/60 dark:bg-bg-secondary/40 backdrop-blur-md shadow-md flex flex-col gap-4 text-left border-t-4 border-t-primary">
              <h5 className="font-display font-extrabold text-xs uppercase tracking-wider text-primary border-b border-border-color pb-2.5 mb-1 flex items-center gap-2">
                <User size={14} /> Profile Overview
              </h5>
              <div className="flex flex-col gap-10 text-xs">
                <div className="flex items-start gap-3 p-3 bg-bg-secondary/50 dark:bg-bg-tertiary/20 rounded-2xl border border-border-color/30 hover:border-primary/20 transition-all duration-200">
                  <Mail size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-secondary block font-bold uppercase tracking-wider mb-0.5">Email Contact</span>
                    <span className="text-text-primary font-bold break-all block">{data.personal_email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-bg-secondary/50 dark:bg-bg-tertiary/20 rounded-2xl border border-border-color/30 hover:border-primary/20 transition-all duration-200">
                  <Heart size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-secondary block font-bold uppercase tracking-wider mb-0.5">Hobbies & Interests</span>
                    <span className="text-text-primary font-medium leading-relaxed block">{data.personal_hobbies}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Tabs & Content */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">

            {/* Tab Selectors */}
            <div className="flex flex-wrap gap-2 border-b border-border-color pb-3 overflow-x-auto select-none">
              {[
                { id: 'profile', label: 'Profile Bio', icon: User },
                { id: 'education', label: 'Education', icon: GraduationCap },
                { id: 'experience', label: 'Teaching Experience', icon: Briefcase },
                { id: 'skills', label: 'Skills & Tools', icon: Code }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-0 cursor-pointer ${activeTab === tab.id
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-bg-secondary hover:bg-slate-200 dark:bg-bg-tertiary dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Container */}
            <div className="p-8 rounded-[32px] border border-border-color bg-bg-color dark:bg-bg-secondary shadow-xl min-h-[400px] flex flex-col text-left">

              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <h4 className="font-display font-extrabold text-xl text-primary flex items-center gap-2">
                    <User size={20} /> Professional Objective
                  </h4>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal whitespace-pre-line">
                    {parseMarkdown(data.profile_description)}
                  </p>
                  <div className="mt-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col gap-3">
                    <h5 className="font-bold text-sm text-primary uppercase tracking-wider">Mission Statement</h5>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      "To make mathematics accessible, intuitive, and engaging by bridging the gap between abstract theories and clear, practical understanding. Dedicated to lifting math anxiety and preparing students for success in both school boards and academic research."
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Education */}
              {activeTab === 'education' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <h4 className="font-display font-extrabold text-xl text-primary flex items-center gap-2 mb-2">
                    <GraduationCap size={20} /> Academic Qualifications
                  </h4>

                  {/* Timeline */}
                  <div className="flex flex-col gap-8 pl-4 border-l border-primary/20 relative">
                    {/* PhD Degree */}
                    {renderEducationItem(data.education_phd || '', "PhD Mathematics (Cont.)", "National University of Modern Languages (2025 – Present)")}

                    {/* MS Degree */}
                    {renderEducationItem(data.education_ms, "MS Mathematics", "National University of Modern Languages (2020 – 2024)")}

                    {/* MSc Degree */}
                    {renderEducationItem(data.education_msc, "MSc Mathematics", "Allama Iqbal Open University (2018 – 2020)")}

                    {/* BSc Degree */}
                    {renderEducationItem(data.education_bsc, "BSc Mathematics", "University of the Punjab (2015 – 2018)")}

                    {/* BEd Degree */}
                    {renderEducationItem(data.education_bed, "B.Ed. Education", "Virtual University of Pakistan (2021 – 2022)")}
                  </div>
                </div>
              )}

              {/* Tab: Experience */}
              {activeTab === 'experience' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <h4 className="font-display font-extrabold text-xl text-primary flex items-center gap-2 mb-2">
                    <Briefcase size={20} /> Professional Career
                  </h4>

                  {/* Timeline */}
                  <div className="flex flex-col gap-8 pl-4 border-l border-primary/20 relative">
                    {/* Experience 1 */}
                    {renderExperienceItem(data.experience_ssms || '', "School Teacher", "FGEI (2023 – Present)")}

                    {/* Experience 2 */}
                    {renderExperienceItem(data.experience_aps, "HSSC Mathematics & HOD", "Army Public School and College (2020 – 2023)")}

                    {/* Experience 3 */}
                    {renderExperienceItem(data.experience_oxford, "Lecturer in Mathematics", "Oxford Girls Degree College (2019 – 2020)")}

                    {/* Experience 4 */}
                    {renderExperienceItem(data.experience_potohar, "Lecturer in Mathematics", "Potohar College of Science & Commerce (2018 – 2019)")}
                  </div>
                </div>
              )}

              {/* Tab: Skills */}
              {activeTab === 'skills' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <h4 className="font-display font-extrabold text-xl text-primary flex items-center gap-2 mb-2">
                    <Code size={20} /> Software & Tools Competence
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">

                    {/* Skill: MS Office */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center">
                          <span className="text-text-primary uppercase tracking-wide">MS Word, Excel, PowerPoint</span>
                          <span className="text-primary text-[9px] font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full ml-2 select-none">
                            {getSkillLabel(data.skill_office)}
                          </span>
                        </div>
                        <span className="text-primary">{data.skill_office}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${data.skill_office}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skill: C++ */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center">
                          <span className="text-text-primary uppercase tracking-wide">C++ Programming</span>
                          <span className="text-primary text-[9px] font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full ml-2 select-none">
                            {getSkillLabel(data.skill_cpp)}
                          </span>
                        </div>
                        <span className="text-primary">{data.skill_cpp}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${data.skill_cpp}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skill: Maple */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center">
                          <span className="text-text-primary uppercase tracking-wide">Maple (Mathematical Computing)</span>
                          <span className="text-primary text-[9px] font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full ml-2 select-none">
                            {getSkillLabel(data.skill_maple)}
                          </span>
                        </div>
                        <span className="text-primary">{data.skill_maple}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${data.skill_maple}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skill: MathType */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center">
                          <span className="text-text-primary uppercase tracking-wide">MathType Editor</span>
                          <span className="text-primary text-[9px] font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full ml-2 select-none">
                            {getSkillLabel(data.skill_mathtype)}
                          </span>
                        </div>
                        <span className="text-primary">{data.skill_mathtype}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${data.skill_mathtype}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  <div className="mt-8 p-6 bg-bg-secondary dark:bg-bg-tertiary rounded-2xl border border-border-color">
                    <h5 className="font-bold text-sm text-text-primary mb-2">Technical Summary</h5>
                    <p className="text-xs text-text-secondary leading-relaxed leading-6 font-normal">
                      Deep expertise in mathematical formulation software (MathType), computation frameworks (Maple), and standard object-oriented languages (C++). Capable of performing hyperbolic stability analysis, designing numerical models, and rendering complex formulas for research-ready educational documents.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Philosophy & Methodology Card to fill empty space */}
            <div className="p-8 rounded-[32px] border border-border-color bg-gradient-to-br from-primary/[0.02] to-primary-dark/[0.02] dark:from-primary/[0.04] dark:to-primary-dark/[0.04] shadow-md flex flex-col gap-6 text-left relative overflow-hidden group/philosophy">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-bl-[100px] pointer-events-none transition-transform duration-500 group-hover/philosophy:scale-110"></div>

              <h5 className="font-display font-extrabold text-sm uppercase tracking-wider text-primary border-b border-border-color/60 pb-2 mb-1 flex items-center gap-2">
                <Layers size={16} /> Teaching Philosophy & Methodology
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-bg-color/50 dark:bg-bg-secondary/20 border border-border-color/30 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <span className="font-bold text-xs text-text-primary uppercase tracking-wide">Concept-First Pedagogy</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-normal">
                    Every topic is introduced through visual intuition and geometry before diving into complex equations.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-bg-color/50 dark:bg-bg-secondary/20 border border-border-color/30 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <span className="font-bold text-xs text-text-primary uppercase tracking-wide">Board Exam Strategy</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-normal">
                    Curated worksheets and past-paper patterns aligned with HSSC, BSc, and competitive standards to build exam-day confidence.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-bg-color/50 dark:bg-bg-secondary/20 border border-border-color/30 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <span className="font-bold text-xs text-text-primary uppercase tracking-wide">Tech Integration</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-normal">
                    Utilizing computational systems like Maple and MathType to animate coordinates and create publishing-grade lecture notes.
                  </p>
                </div>

              </div>

              <div className="p-4 bg-bg-color/80 dark:bg-[#0B1221]/80 rounded-2xl border border-border-color/40 italic text-[10.5px] text-text-secondary leading-relaxed text-center font-medium shadow-inner">
                "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding." — William Paul Thurston
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
