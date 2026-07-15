import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Users, BookOpen, FileText, Play, Eye, Loader2, Sparkles, TrendingUp, Bell } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const { adminStats, activeUsers } = useSocket();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Sync stats in real-time on socket updates
  useEffect(() => {
    if (adminStats) {
      setStats(prev => ({
        ...prev,
        ...adminStats
      }));
    }
  }, [adminStats]);

  // -----------------------
  // Scale helper utilities
  // -----------------------
  const generateScale = (maxValue) => {
    // Returns array of 3 numeric scale points: [max, max/2, 0]
    const max = Number(maxValue) || 0;
    if (max <= 0) return [0, 0, 0];
    const mid = max / 2;
    // Preserve decimals for halves (e.g., 2.5, 0.5)
    const top = Math.round(max * 100) / 100;
    const middle = Math.round(mid * 100) / 100;
    return [top, middle, 0];
  };

  const formatLabel = (num) => {
    // Keep integer formatting for integer-like values, otherwise one decimal
    if (Number.isInteger(num)) return String(num);
    if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num));
    return String(num);
  };

  // Refs and measurement state for aligning labels to bars
  const chartContainerRef = useRef(null);
  const barRefs = useRef([]);
  const [labelPositions, setLabelPositions] = useState([]);

  const kpis = [
    {
      title: 'Total Students',
      value: stats?.studentsCount || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      description: 'Active learning student registrations'
    },
    {
      title: 'Active Courses',
      value: stats?.coursesCount || 0,
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50',
      description: 'Calculus and math syllabuses'
    },
    {
      title: 'Soft Resources',
      value: stats?.resourcesCount || 0,
      icon: FileText,
      color: 'text-amber-600 bg-amber-50',
      description: 'Reference files available'
    },
    {
      title: 'Lecture Videos',
      value: stats?.videosCount || 0,
      icon: Play,
      color: 'text-emerald-600 bg-emerald-50',
      description: 'Embedded video walkthroughs'
    },
    {
      title: 'Active Online Users',
      value: stats?.activeUsersCount !== undefined ? stats.activeUsersCount : activeUsers.length,
      icon: Eye,
      color: 'text-rose-600 bg-rose-50',
      description: 'Students currently browsing platform'
    },
    {
      title: 'Announcements',
      value: stats?.announcementsCount || 0,
      icon: Bell,
      color: 'text-indigo-600 bg-indigo-50',
      description: 'Platform wide alerts'
    }
  ];

  const chartData = [
    { label: 'Students', value: stats?.studentsCount || 0, color: 'bg-blue-600' },
    { label: 'Courses', value: stats?.coursesCount || 0, color: 'bg-indigo-600' },
    { label: 'PDFs', value: stats?.resourcesCount || 0, color: 'bg-amber-500' },
    { label: 'Videos', value: stats?.videosCount || 0, color: 'bg-emerald-500' },
    { label: 'Online', value: stats?.activeUsersCount !== undefined ? stats.activeUsersCount : activeUsers.length, color: 'bg-rose-500' },
    { label: 'Alerts', value: stats?.announcementsCount || 0, color: 'bg-indigo-600' },
  ];

  // Measure bar wrappers and compute label coordinates whenever stats change or layout resizes
  useLayoutEffect(() => {
    const computePositions = () => {
      const container = chartContainerRef.current;
      if (!container) return setLabelPositions([]);
      const containerRect = container.getBoundingClientRect();
      const newPositions = chartData.map((item, idx) => {
        const wrapper = barRefs.current[idx];
        if (!wrapper) return { left: 0, points: [] };
        const wrapRect = wrapper.getBoundingClientRect();
        const relativeLeft = wrapRect.left - containerRect.left; // relative to chart container
        const height = wrapRect.height;
        const topBase = wrapRect.top - containerRect.top; // top of wrapper relative
        const max = Number(item.value) || 0;
        const points = generateScale(max).map((val) => {
          const pct = max > 0 ? (val / max) : 0; // 0..1
          const y = topBase + (1 - pct) * height; // px from container top
          return { value: val, top: y };
        });
        return { left: relativeLeft, points };
      });
      setLabelPositions(newPositions);
    };

    computePositions();
    const ro = new ResizeObserver(() => computePositions());
    if (chartContainerRef.current) ro.observe(chartContainerRef.current);
    window.addEventListener('resize', computePositions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computePositions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, adminStats]);

  if (loading) {
    return <Loader text="Aggregating platform metrics..." />;
  }



  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left">
      <div>
        <h2 className="font-display font-black text-3xl text-text-primary">
          Welcome to the CMS Dashboard
        </h2>
        <p className="text-text-secondary text-sm md:text-base mt-1">
          Monitor registrations, content counts, and active modules for Calculus Corner.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 px-5 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden glass group"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xxs font-extrabold uppercase tracking-wider text-text-tertiary">
                    {kpi.title}
                  </span>
                  <span className="text-2.5xl font-display font-black text-text-primary mt-1 group-hover:text-primary transition-colors">
                    {kpi.value}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistics Bar Chart Panel */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center gap-3">
            <h3 className="font-display font-bold text-base text-text-primary">Platform Statistics Overview</h3>
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
              <TrendingUp size={12} /> Live Metrics
            </span>
          </div>

          <div ref={chartContainerRef} className="h-48 pt-6 px-4 flex items-end justify-between border-b border-l border-border-color/60 bg-bg-secondary/20 rounded-xl relative">
            {/* Overlay for dynamic left-side scale labels */}
            <div className="absolute inset-0 pointer-events-none">
              {labelPositions.map((pos, i) => (
                pos.points.map((p, pi) => (
                  <div
                    key={`${i}-${pi}`}
                    style={{ left: (pos.left - 25) + 'px',
                      top: (p.top - 8) + 'px',
                      position: 'absolute' }}
                    className="hidden lg:block text-[11px] font-extrabold text-text-secondary whitespace-nowrap"
                  >
                    {formatLabel(p.value)} 
                  </div>
                ))
              ))}
            </div>

            {(() => {
              const maxVal = Math.max(...chartData.map(c => c.value), 1);
              return chartData.map((item, idx) => {
                const heightPercent = (item.value / maxVal) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 grow group select-none">
                    <div ref={el => barRefs.current[idx] = el} className="w-full max-w-[28px] bg-bg-tertiary rounded-t-md relative h-32 flex items-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full ${item.color} rounded-t-md relative group-hover:opacity-85 transition-all duration-300`}
                      />
                      <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-10">
                        {item.value} {item.label.toLowerCase()}
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold text-text-secondary whitespace-nowrap uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Live Active Student Sessions */}
        <div className="p-6 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-text-primary">Live Student Activity</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{activeUsers.length} Online</span>
            </span>
          </div>

          <div className="grow max-h-48 overflow-y-auto flex flex-col gap-2.5">
            {activeUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-tertiary font-semibold">
                No students online.
              </div>
            ) : (
              activeUsers.map(user => (
                <div key={user.id} className="p-2.5 bg-bg-secondary/50 border border-border-color/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-bold text-text-primary leading-tight">{(user.name || user.username).replace(/[0-9]/g, '').toUpperCase()}</span>
                    <span className="text-[10px] text-text-tertiary">{user.email}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-extrabold text-primary rounded-full uppercase">
                      {user.currentTab ? user.currentTab.replace('_', ' ') : 'Courses'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
