import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Play, Eye, Download, Library, TrendingUp, Sparkles, Video, BookMarked, BarChart3, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('videos'); // 'videos' | 'notes' | 'books'

  const { adminStats, activeUsers, socket } = useSocket();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Sync real-time updates
  useEffect(() => {
    if (adminStats) {
      setStats(prev => ({
        ...prev,
        ...adminStats
      }));
    }
  }, [adminStats]);

  // Real-time auto-refresh when views, downloads, or video progress change
  useEffect(() => {
    if (!socket) return;
    const handleAnalyticsUpdate = () => {
      api.get('/admin/analytics').then(res => {
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      }).catch(err => console.error('Silent analytics refresh failed:', err));
    };

    socket.on('admin:analytics:update', handleAnalyticsUpdate);
    socket.on('analytics:update', handleAnalyticsUpdate);

    return () => {
      socket.off('admin:analytics:update', handleAnalyticsUpdate);
      socket.off('analytics:update', handleAnalyticsUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader />
        <p className="mt-4 text-xs font-bold text-text-tertiary">Loading Detailed Analytics...</p>
      </div>
    );
  }

  // Filter items so ONLY items with views > 0 or downloads > 0 are displayed
  const filteredVideos = (stats?.topVideos || []).filter(v => (parseInt(v.views) || 0) > 0);
  const filteredNotes = (stats?.topResources || []).filter(r => (parseInt(r.views) || 0) > 0 || (parseInt(r.downloads) || 0) > 0);
  const filteredBooks = (stats?.topBooks || []).filter(b => (parseInt(b.views) || 0) > 0 || (parseInt(b.downloads) || 0) > 0);

  const kpis = [
    {
      title: 'Total Platform Views',
      value: stats?.viewsCount || 0,
      icon: Eye,
      color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
      description: 'Combined views on videos & documents'
    },
    {
      title: 'Total Downloads',
      value: stats?.downloadsCount || 0,
      icon: Download,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40',
      description: 'PDF sheets and book downloads'
    },
    {
      title: 'Total Students',
      value: stats?.studentsCount || 0,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/40',
      description: 'Active registered student accounts'
    },
    {
      title: 'Lecture Videos',
      value: stats?.videosCount || 0,
      icon: Play,
      color: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40',
      description: 'Published video walkthroughs'
    },
    {
      title: 'Active Online',
      value: stats?.activeUsersCount !== undefined ? stats.activeUsersCount : (activeUsers?.length || 0),
      icon: TrendingUp,
      color: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40',
      description: 'Students browsing live right now'
    }
  ];

  const subTabs = [
    { id: 'videos', label: 'Lecture Videos Analytics', icon: Video, count: filteredVideos.length },
    { id: 'notes', label: 'Formula Sheets & Notes Analytics', icon: BookMarked, count: filteredNotes.length },
    { id: 'books', label: 'Books Library Analytics', icon: Library, count: filteredBooks.length }
  ];

  return (
    <div className="flex flex-col gap-8 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BarChart3 size={20} />
            </span>
            <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
              Platform Analytics
            </h1>
          </div>
          <p className="text-text-tertiary text-xs md:text-sm mt-1">
            Showing content with active views (&gt; 0) or downloads (&gt; 0).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Live Stats Active
          </span>
        </div>
      </div>

      {/* Top High-level Total KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border ${kpi.color} flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-1`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{kpi.title}</p>
                  <p className="text-2xl font-black font-display mt-1">{kpi.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 shadow-xs">
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-[11px] opacity-75 mt-3 leading-snug">{kpi.description}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Sub-Tabs Container */}
      <div className="bg-bg-color border border-border-color rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 p-1.5 max-w-full bg-bg-secondary rounded-2xl border border-border-color/60 overflow-x-auto">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2.5 px-8.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 shrink-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-border-color text-text-tertiary'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Tab Content: Lecture Videos */}
        {activeSubTab === 'videos' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
                  <Video size={18} className="text-emerald-500" /> Lecture Video Engagement
                </h3>
                <p className="text-text-tertiary text-xs mt-0.5">Videos with views &gt; 0 sorted by total watch count.</p>
              </div>
            </div>

            {filteredVideos.length > 0 ? (
              <div className="divide-y divide-border-color/60 border border-border-color rounded-2xl overflow-hidden bg-bg-secondary">
                {filteredVideos.map((item, idx) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-bg-color transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 text-left">
                        <h4 className="font-bold text-xs text-text-primary truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {item.category || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-text-primary block">{item.views || 0}</span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Total Views</span>
                      </div>
                      <button
                        onClick={() => window.open(`/viewer/video/${item.id}`, '_blank')}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border-0 cursor-pointer"
                        title="Open in Viewer"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-tertiary text-xs italic border-2 border-dashed border-border-color rounded-2xl">
                No videos with views &gt; 0 recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab Content: Formula Sheets & Notes */}
        {activeSubTab === 'notes' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
                  <BookMarked size={18} className="text-amber-500" /> Formula Sheets & Notes Engagement
                </h3>
                <p className="text-text-tertiary text-xs mt-0.5">Formula sheets with views &gt; 0 or downloads &gt; 0.</p>
              </div>
            </div>

            {filteredNotes.length > 0 ? (
              <div className="divide-y divide-border-color/60 border border-border-color rounded-2xl overflow-hidden bg-bg-secondary">
                {filteredNotes.map((item, idx) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-bg-color transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 text-left">
                        <h4 className="font-bold text-xs text-text-primary truncate">{item.title}</h4>
                        <span className="text-[10px] text-text-tertiary block mt-0.5">PDF Formula Sheet</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-text-primary block">{item.views || 0} Views</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{item.downloads || 0} Downloads</span>
                      </div>
                      <button
                        onClick={() => window.open(`/viewer/resource/${item.id}`, '_blank')}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border-0 cursor-pointer"
                        title="Open in Viewer"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-tertiary text-xs italic border-2 border-dashed border-border-color rounded-2xl">
                No formula sheets with views &gt; 0 or downloads &gt; 0 recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab Content: Books Library */}
        {activeSubTab === 'books' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
                  <Library size={18} className="text-purple-500" /> Books Library Engagement
                </h3>
                <p className="text-text-tertiary text-xs mt-0.5">Reference books with views &gt; 0 or downloads &gt; 0.</p>
              </div>
            </div>

            {filteredBooks.length > 0 ? (
              <div className="divide-y divide-border-color/60 border border-border-color rounded-2xl overflow-hidden bg-bg-secondary">
                {filteredBooks.map((item, idx) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-bg-color transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 text-left">
                        <h4 className="font-bold text-xs text-text-primary truncate">{item.title}</h4>
                        <span className="text-[10px] text-text-tertiary block mt-0.5">Reference Textbook</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-text-primary block">{item.views || 0} Views</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{item.downloads || 0} Downloads</span>
                      </div>
                      <button
                        onClick={() => window.open(`/viewer/book/${item.id}`, '_blank')}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border-0 cursor-pointer"
                        title="Open in Viewer"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-tertiary text-xs italic border-2 border-dashed border-border-color rounded-2xl">
                No books with views &gt; 0 or downloads &gt; 0 recorded yet.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsDashboard;