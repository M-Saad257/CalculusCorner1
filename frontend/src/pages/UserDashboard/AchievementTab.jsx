import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Award, Trophy, Download, GraduationCap, CheckCircle2, ArrowRight, Copy, ShieldCheck, Eye, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const AchievementTab = ({
  activeTab,
  analyticsLoading,
  analyticsData,
  earnedBadges,
  badgesLoading,
  fetchAnalytics,
  fetchBadges,
  videos = [],
  studentClass = 'All',
  setActiveTab
}) => {
  const navigate = useNavigate();
  const [downloadingBadge, setDownloadingBadge] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  // View Certificate modal state
  const [viewCert, setViewCert] = useState(null); // { badgeName, blobUrl }
  const [loadingCert, setLoadingCert] = useState(null);

  const handleViewCertificate = async (badgeName) => {
    try {
      setLoadingCert(badgeName);
      const shortName = badgeName.split(' ')[0];
      const response = await api.get(`/student/certificate/milestone/${shortName}`, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
      setViewCert({ badgeName, blobUrl, shortName });
    } catch (err) {
      console.error('Failed to load certificate:', err);
      alert('Could not load certificate. Please try again.');
    } finally {
      setLoadingCert(null);
    }
  };

  const handleModalDownload = () => {
    if (!viewCert) return;
    const link = document.createElement('a');
    link.href = viewCert.blobUrl;
    link.setAttribute('download', `CalculusCorner_${viewCert.shortName}_Certificate.png`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleCopyCertId = (certId, badgeName) => {
    if (!certId) return;
    navigator.clipboard.writeText(certId);
    setCopiedId(badgeName);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCertificate = async (milestoneName) => {
    try {
      const shortName = milestoneName.split(' ')[0]; // 'Bronze', 'Silver', 'Gold', 'Master'
      setDownloadingBadge(milestoneName);

      const response = await api.get(`/student/certificate/milestone/${shortName}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CalculusCorner_${shortName}_Certificate.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Could not download certificate. Please try again.');
    } finally {
      setDownloadingBadge(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'performance' && !analyticsData) {
      fetchAnalytics();
    } else if (activeTab === 'badges' && earnedBadges.length === 0) {
      fetchBadges();
    }
  }, [activeTab]);

  // Class Matching Memo Filters
  const classVideos = useMemo(() => {
    if (!studentClass || studentClass === 'All') return videos || [];
    const target = studentClass.trim().toLowerCase();
    const matched = (videos || []).filter(v => {
      const cat = (v.category || '').trim().toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matched.length > 0 ? matched : (videos || []);
  }, [videos, studentClass]);

  const hasMatchedVideos = useMemo(() => {
    if (!studentClass || studentClass === 'All') return true;
    const target = studentClass.trim().toLowerCase();
    return (videos || []).some(v => {
      const cat = (v.category || '').trim().toLowerCase();
      return cat === target || cat.includes(target) || target.includes(cat);
    });
  }, [videos, studentClass]);

  const totalClassVideosCount = classVideos.length;
  const inProgressOrCompletedClassVideos = classVideos.filter(v => v.isCompleted === 1 || v.is_completed === 1 || parseFloat(v.progressPercent || v.progress_percent || v.progress || 0) > 0 || (v.last_position && parseFloat(v.last_position) > 0));
  const watchedClassVideosCount = inProgressOrCompletedClassVideos.length;

  const classVideosProgressPercent =
    totalClassVideosCount > 0
      ? (watchedClassVideosCount / totalClassVideosCount) * 100
      : 0;

  // Milestone Progression (Bronze, Silver, Gold, Master) based on total watched/in-progress videos
  const completedCount = Array.isArray(videos) && videos.length > 0
    ? videos.filter(v => v.isCompleted === 1 || v.is_completed === 1 || parseFloat(v.progressPercent || v.progress_percent || v.progress || 0) > 0 || (v.last_position && parseFloat(v.last_position) > 0)).length
    : 0;

  let currentMilestoneInfo = {
    statusText: '',
    statusSubtext: '',
    progressPct: 0
  };

  if (completedCount < 5) {
    const remaining = 5 - completedCount;
    currentMilestoneInfo = {
      statusText: `${completedCount} completed, ${remaining} video${remaining > 1 ? 's' : ''} to go to unlock Bronze Certificate!`,
      statusSubtext: 'Watch 5 Calculus video lessons to earn your first official Bronze Certificate.',
      progressPct: (completedCount / 5) * 100
    };
  } else if (completedCount < 15) {
    const remaining = 15 - completedCount;
    currentMilestoneInfo = {
      statusText: `Bronze Milestone Completed! 🎉 ${completedCount} completed, ${remaining} more to go to unlock Silver Certificate!`,
      statusSubtext: 'Awesome work! Keep watching to reach the 15-video Silver Milestone.',
      progressPct: ((completedCount - 5) / 10) * 100
    };
  } else if (completedCount < 30) {
    const remaining = 30 - completedCount;
    currentMilestoneInfo = {
      statusText: `Silver Milestone Completed! 🎉 ${completedCount} completed, ${remaining} more to go to unlock Gold Certificate!`,
      statusSubtext: 'You are on fire! Reach 30 completed videos to claim the Gold Certificate.',
      progressPct: ((completedCount - 15) / 15) * 100
    };
  } else if (completedCount < 50) {
    const remaining = 50 - completedCount;
    currentMilestoneInfo = {
      statusText: `Gold Milestone Completed! 🎉 ${completedCount} completed, ${remaining} more to go to unlock Master Certificate!`,
      statusSubtext: 'Final stretch! Reach 50 completed videos for the ultimate Master Certificate.',
      progressPct: ((completedCount - 30) / 20) * 100
    };
  } else {
    currentMilestoneInfo = {
      statusText: 'Master Milestone Achieved! 🏆 All 50 Video Milestones Completed!',
      statusSubtext: 'Outstanding achievement! You have unlocked all official video certificates.',
      progressPct: 100
    };
  }

  const unlockedMilestonesList = [];
  if (completedCount >= 5) unlockedMilestonesList.push('Bronze Milestone');
  if (completedCount >= 15) unlockedMilestonesList.push('Silver Milestone');
  if (completedCount >= 30) unlockedMilestonesList.push('Gold Milestone');
  if (completedCount >= 50) unlockedMilestonesList.push('Master Milestone');

  if (activeTab === 'performance') {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
        {/* Header */}
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Performance & Learning Analytics</h2>
          <p className="text-text-secondary text-sm mt-1">Track your course progression, video milestones, and download official certificates.</p>
        </div>

        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-text-secondary font-medium text-xs">Loading analytics data...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* 1. Class Video Lectures Progress Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-border-color shadow-sm flex flex-col gap-6 text-left transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">
                    {hasMatchedVideos ? `${studentClass} Syllabus Progression` : 'Syllabus Progression'}
                  </h3>
                  <p className="text-text-tertiary text-xs mt-0.5">
                    {hasMatchedVideos
                      ? 'Watch and complete all recommended video lessons to master your syllabus.'
                      : 'No specific videos found for your class yet. Displaying progress across all lessons.'
                    }
                  </p>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                  <span className="bg-bg-secondary px-2.5 py-1 rounded-lg border border-border-color text-text-secondary">
                    {watchedClassVideosCount} of {totalClassVideosCount} lectures completed
                  </span>
                  <span className="text-primary font-black text-sm">{Math.round(classVideosProgressPercent)}% Complete</span>
                </div>
                <div className="w-full bg-bg-secondary border border-border-color/60 rounded-full h-3.5 p-0.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, classVideosProgressPercent)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab ? setActiveTab('videos') : navigate('/dashboard?tab=videos')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary border-0 cursor-pointer bg-transparent"
                >
                  Go to Video Lectures <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            {/* 2. Video Milestone Progression Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-border-color shadow-sm flex flex-col gap-6 text-left transition-all">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-color/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-text-primary">
                      Video Milestone Progression
                    </h3>
                    <p className="text-text-tertiary text-xs mt-0.5">
                      {currentMilestoneInfo.statusSubtext}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    {completedCount} Watched
                  </span>
                </div>
              </div>

              {/* Milestone Steps Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xxs font-extrabold">
                {[
                  { name: 'Bronze', target: 5, color: 'from-amber-700 to-amber-900' },
                  { name: 'Silver', target: 15, color: 'from-slate-400 to-slate-650' },
                  { name: 'Gold', target: 30, color: 'from-amber-400 to-yellow-600' },
                  { name: 'Master', target: 50, color: 'from-purple-600 to-pink-600' }
                ].map(m => {
                  const isEarned = completedCount >= m.target;
                  return (
                    <div key={m.name} className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${isEarned ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-bg-secondary border-border-color/60 text-text-tertiary opacity-70'
                      }`}>
                      {isEarned ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Award size={16} />}
                      <span className="truncate font-bold">{m.name} ({m.target})</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                  <span>{currentMilestoneInfo.statusText}</span>
                  <span className="text-primary font-black">{Math.round(currentMilestoneInfo.progressPct)}%</span>
                </div>
                <div className="w-full bg-bg-secondary border border-border-color/60 rounded-full h-3.5 p-0.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-indigo-600 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, currentMilestoneInfo.progressPct)}%` }}
                  />
                </div>
              </div>

              {/* Instant Certificate Download Cards for Unlocked Milestones */}
              {unlockedMilestonesList.length > 0 && (
                <div className="mt-1 flex flex-col gap-3 pt-4 border-t border-border-color/60 animate-fadeIn">
                  <p className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" /> Earned Milestone Certificates Ready to Download:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unlockedMilestonesList.map(mName => (
                      <div key={mName} className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                            <Trophy size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-text-primary m-0">{mName}</h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">Ready to Download</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadCertificate(mName)}
                          disabled={downloadingBadge === mName}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark disabled:bg-slate-400 text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-sm transition-all shrink-0"
                        >
                          <Download size={13} />
                          {downloadingBadge === mName ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // BADGES TAB PANEL (Achievement Badges)
  if (activeTab === 'badges') {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Achievement Badges</h2>
          <p className="text-text-secondary text-sm mt-1">Unlock badges by watching lectures, completing homework quizzes, and scoring high marks.</p>
        </div>

        {badgesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-text-secondary font-medium text-xs">Loading badges...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  name: 'Welcome Badge',
                  desc: 'First successful login to the platform!',
                  icon: Sparkles,
                  badgeClass: 'from-blue-500 to-indigo-650'
                },
                {
                  name: 'Fast Starter',
                  desc: 'Started watching your first lecture video!',
                  icon: Trophy,
                  badgeClass: 'from-amber-400 to-orange-600'
                },
                {
                  name: 'Consistency Badge',
                  desc: 'Completed 5 quiz assessments!',
                  icon: CheckCircle2,
                  badgeClass: 'from-emerald-500 to-teal-650'
                },
                {
                  name: 'Calculus Champion',
                  desc: 'Completed 10 high-scoring quizzes (80% or higher)!',
                  icon: GraduationCap,
                  badgeClass: 'from-purple-500 to-indigo-700'
                },
                {
                  name: 'Bronze Milestone',
                  desc: 'Completed 5 Calculus video lessons!',
                  icon: Award,
                  badgeClass: 'from-amber-700 to-amber-900',
                  isMilestone: true
                },
                {
                  name: 'Silver Milestone',
                  desc: 'Completed 15 Calculus video lessons!',
                  icon: Award,
                  badgeClass: 'from-slate-400 to-slate-600',
                  isMilestone: true
                },
                {
                  name: 'Gold Milestone',
                  desc: 'Completed 30 Calculus video lessons!',
                  icon: Trophy,
                  badgeClass: 'from-amber-400 to-yellow-600',
                  isMilestone: true
                },
                {
                  name: 'Master Milestone',
                  desc: 'Completed 50 Calculus video lessons!',
                  icon: Trophy,
                  badgeClass: 'from-purple-600 to-pink-600',
                  isMilestone: true
                }
              ].map(badge => {
                const shortName = badge.name.split(' ')[0];
                console.log("earnedBadges:", earnedBadges);
                const earned = earnedBadges.find(b =>
                  (b.badgeName || '').toLowerCase().includes(shortName.toLowerCase()) ||
                  (b.badgeName || '').toLowerCase() === badge.name.toLowerCase()
                );
                const IconComp = badge.icon;

                return (
                  <div
                    key={badge.name}
                    className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center justify-between transition-all duration-300 relative overflow-hidden ${earned ? 'border-primary/20 hover:shadow-md animate-scaleIn' : 'opacity-55 grayscale border-border-color'
                      }`}
                  >
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-primary-dark opacity-10"></div>

                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative ${earned ? 'bg-gradient-to-tr ' + badge.badgeClass + ' text-white' : 'bg-bg-tertiary text-text-tertiary'
                        }`}>
                        <IconComp size={30} />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-text-primary m-0">{badge.name}</h4>
                        <p className="text-xxs text-text-secondary font-medium mt-1 px-2 leading-relaxed">{badge.desc}</p>
                      </div>
                    </div>

                    <div className="w-full mt-6 pt-4 border-t border-border-color/60 text-xxs font-extrabold tracking-wider flex flex-col items-center gap-2">
                      {earned ? (
                        <>
                          <span className="text-emerald-500 uppercase flex items-center justify-center gap-1">
                            Earned {new Date(earned.earnedAt || earned.earned_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          {/* Certificate ID */}
                          {earned.certificate_id && (
                            <div className="w-full flex items-center justify-between gap-1 bg-bg-tertiary/60 rounded-lg px-2 py-1.5">
                              <span className="font-mono text-[10px] text-text-secondary tracking-widest truncate">{earned.certificate_id}</span>
                              <button
                                onClick={() => handleCopyCertId(earned.certificate_id, badge.name)}
                                title="Copy Certificate ID"
                                className="p-1 rounded-lg hover:bg-bg-color text-text-tertiary hover:text-primary transition-all cursor-pointer border-0 bg-transparent shrink-0"
                              >
                                {copiedId === badge.name ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                          {/* View + Verify row */}
                          <div className="w-full flex gap-1.5">
                            <button
                              onClick={() => handleViewCertificate(badge.name)}
                              disabled={loadingCert === badge.name}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold cursor-pointer transition-all border-0 shadow-sm text-[10px]"
                            >
                              {loadingCert === badge.name
                                ? <Loader2 size={10} className="animate-spin" />
                                : <Eye size={10} />}
                              {loadingCert === badge.name ? 'Wait...' : 'View'}
                            </button>
                            {earned.certificate_id && (
                              <button
                                onClick={() => navigate(`/verify-certificate?id=${earned.certificate_id}`)}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 border border-emerald-400 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl font-bold cursor-pointer transition-all bg-transparent text-[10px]"
                                title="Verify Certificate"
                              >
                                <ShieldCheck size={10} /> Verify
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-text-tertiary uppercase">LOCKED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Certificate Preview Modal ── */}
        {viewCert && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={() => setViewCert(null)}
          >
            <div
              className="relative bg-bg-secondary mt-18 ml-6 border border-border-color rounded-3xl shadow-2xl max-w-3xl w-full max-h-[83vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-color shrink-0">
                <div>
                  <h3 className="font-display font-black text-base text-text-primary">{viewCert.badgeName} — Certificate</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">Issued by Calculus Corner</p>
                </div>
                <button
                  onClick={() => setViewCert(null)}
                  className="p-2 rounded-xl border border-border-color bg-bg-color hover:bg-bg-tertiary text-text-secondary cursor-pointer transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Certificate Image */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-bg-color/50">
                <img
                  src={viewCert.blobUrl}
                  alt={`${viewCert.badgeName} Certificate`}
                  className="max-w-full max-h-[55vh] rounded-2xl mt-10 shadow-xl border border-border-color object-contain"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-border-color flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>This certificate is permanently recorded in our system.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleModalDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs cursor-pointer transition-all border-0 shadow-md"
                  >
                    <Download size={13} /> Download Certificate
                  </button>
                  <button
                    onClick={() => setViewCert(null)}
                    className="px-4 py-2 border border-border-color bg-transparent hover:bg-bg-tertiary text-text-secondary rounded-xl font-bold text-xs cursor-pointer transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AchievementTab;
