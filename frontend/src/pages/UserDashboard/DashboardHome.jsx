import React from 'react';
import { Play, BrainCircuit, Download, Edit3, PlayCircle, Flame, GraduationCap, BookOpen } from 'lucide-react';
import Button from '../../components/ui/Button';

const DashboardHome = ({ student, stats, videos, enrolledCourses = [], setActiveTab, setSelectedCourseForDetail }) => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
      {/* Welcome Row with Streak */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary-light/5 to-transparent p-6 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
            Welcome back, <span className="text-gradient">{student?.name || 'Student'}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Ready to master Calculus and ace your exams today?</p>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-2xl text-primary shadow-sm overflow-hidden shrink-0">
              {student?.avatar ? (
                <img src={student.avatar.startsWith('http') ? student.avatar : `${student.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                student?.name ? student.name.charAt(0).toUpperCase() : 'S'
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-text-primary">{student?.name || 'Student'}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-primary border border-indigo-100 rounded-full">Active Student</span>
            </div>
          </div>
          <p className="text-text-secondary text-xs mt-4 line-clamp-2 leading-relaxed">
            {student?.bio || 'No bio set. Customize your student profile page to get started.'}
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 border border-border-color bg-transparent hover:bg-bg-secondary text-text-secondary font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            <Edit3 size={14} /> My Profile
          </button>
        </div>



        {/* Circular Progress Gauge */}
        <div className="p-6 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-all duration-200">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-bg-tertiary"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary"
                strokeWidth="3.5"
                strokeDasharray={`${stats.completion}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-display font-black text-xl text-text-primary">{stats.completion}%</span>
              <span className="text-[9px] font-extrabold uppercase text-text-tertiary tracking-wider">Completed</span>
            </div>
          </div>
          <p className="text-center text-text-secondary text-xs font-semibold mt-3">Course Progress</p>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-col gap-4">
        <h3 className="font-display font-bold text-lg text-text-primary text-left">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('videos')}
            className="p-4 rounded-2xl bg-white hover:bg-primary-light/5 border border-border-color hover:border-primary-light flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
              <Play size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Resume Last Lesson</h4>
              <p className="text-text-tertiary text-xxs font-medium mt-0.5">Jump back into video lectures</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('ai_helper')}
            className="p-4 rounded-2xl bg-white hover:bg-primary-light/5 border border-border-color hover:border-primary-light flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Consult AI Tutor</h4>
              <p className="text-text-tertiary text-xxs font-medium mt-0.5">Ask questions and resolve steps</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className="p-4 rounded-2xl bg-white hover:bg-primary-light/5 border border-border-color hover:border-primary-light flex items-center gap-3.5 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
              <Download size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Formula Cheat Sheets</h4>
              <p className="text-text-tertiary text-xxs font-medium mt-0.5">Download exam-prep sheets</p>
            </div>
          </button>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            <h3 className="font-display font-bold text-lg text-text-primary">My Enrolled Courses</h3>
          </div>
        </div>
        {enrolledCourses.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-border-color rounded-2xl">
            <BookOpen size={32} className="text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary text-sm font-semibold">You are not enrolled in any course yet.</p>
            <button
              onClick={() => setActiveTab('courses')}
              className="mt-3 text-xs font-bold text-primary hover:underline border-0 bg-transparent cursor-pointer"
            >
              Browse available courses →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map(course => (
              <div key={course.id} className="p-5 rounded-2xl bg-white border border-border-color shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow group text-left overflow-hidden relative">
                {course.thumbnail && (
                  <div className="-mx-5 -mt-5 mb-1 h-28 overflow-hidden relative">
                    <img
                      src={course.thumbnail.startsWith('http') ? course.thumbnail : `${course.thumbnail}`}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                      {course.grade}
                    </span>
                    <h4 className="font-display font-bold text-base text-text-primary mt-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h4>
                    {course.description && (
                      <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-color/60">
                  {course.status === 'pending_payment' ? (
                    <>
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wide">● Pending</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs font-bold px-3 py-1 cursor-not-allowed opacity-50"
                      >
                        Awaiting Admin
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wide">● Active</span>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-bold px-3 py-1 border-0 cursor-pointer"
                        onClick={() => {
                          setSelectedCourseForDetail(course);
                          setActiveTab('course_detail');
                        }}
                      >
                        View Course
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended / Recently Added Videos */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-text-primary text-left">Latest Study Lectures</h3>
            <button onClick={() => setActiveTab('videos')} className="text-xs font-bold text-primary hover:underline border-0 bg-transparent cursor-pointer">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {videos.slice(0, 3).map(vid => (
              <div
                key={vid.id}
                onClick={() => window.open(vid.url, '_blank')}
                className="group cursor-pointer rounded-2xl bg-white border border-border-color p-3 hover:shadow-md hover:border-primary-light transition-all flex flex-col gap-2.5 text-left"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-secondary border border-border-color/40">
                  <img
                    src={vid.thumbnail || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                    alt={vid.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=60';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={32} className="text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-primary">{vid.category || 'Calculus'}</span>
                  <h4 className="font-bold text-xs text-text-primary line-clamp-1 mt-0.5 leading-snug group-hover:text-primary transition-colors" title={vid.title}>
                    {vid.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
