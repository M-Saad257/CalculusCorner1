import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Medal, Sparkles, Clock, CheckCircle, GraduationCap, X, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';

const AchievementTab = ({
  activeTab,
  analyticsLoading,
  analyticsData,
  earnedBadges,
  badgesLoading,
  fetchAnalytics,
  fetchBadges
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'performance' && !analyticsData) {
      fetchAnalytics();
    } else if (activeTab === 'badges' && earnedBadges.length === 0) {
      fetchBadges();
    }
  }, [activeTab]);

  if (activeTab === 'performance') {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="animate-spin text-primary" size={24} />
            <p className="text-text-secondary font-medium text-xs">Loading analytics data...</p>
          </div>
        ) : !analyticsData || analyticsData.analytics.totalQuizzes === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-border-color rounded-3xl text-text-secondary text-sm flex flex-col items-center justify-center gap-4 max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-text-tertiary">
              <BarChart size={24} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-text-primary m-0">No performance data yet.</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Complete your first quiz to generate analytics and reports.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                navigate('/', { state: { scrollTo: 'practice' } });
              }}
              className="px-6 py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer"
            >
              Start Practice Quiz
            </Button>
          </div>
        ) : (
          <>
            {/* Analytics KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm">
                <span className="text-xxs font-extrabold text-text-tertiary uppercase">Quizzes Attempted</span>
                <p className="font-display font-black text-2xl text-primary mt-1">{analyticsData.analytics.totalQuizzes}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm">
                <span className="text-xxs font-extrabold text-text-tertiary uppercase">Average Score</span>
                <p className="font-display font-black text-2xl text-indigo-600 mt-1">{analyticsData.analytics.averageScore}%</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm">
                <span className="text-xxs font-extrabold text-text-tertiary uppercase">Best Score</span>
                <p className="font-display font-black text-2xl text-emerald-500 mt-1">{analyticsData.analytics.bestScore}%</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm">
                <span className="text-xxs font-extrabold text-text-tertiary uppercase">Accuracy</span>
                <p className="font-display font-black text-2xl text-amber-500 mt-1">{analyticsData.analytics.accuracy}%</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Trend Card */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm flex flex-col gap-4">
                <h3 className="font-display font-bold text-base text-text-primary m-0">Quiz Score Trend</h3>
                <div className="w-full flex items-center justify-center min-h-[220px]">
                  {(() => {
                    const trendAttempts = analyticsData.scoreTrend || [];
                    const scores = trendAttempts.map(s => s.percentage);
                    return (
                      <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="170" x2="500" y2="170" stroke="#f1f5f9" strokeWidth="1" />

                        <text x="-25" y="24" className="text-[9px] fill-text-tertiary font-bold">100%</text>
                        <text x="-25" y="124" className="text-[9px] fill-text-tertiary font-bold">50%</text>
                        <text x="-25" y="174" className="text-[9px] fill-text-tertiary font-bold">0%</text>

                        {scores.length > 0 ? (
                          <>
                            {(() => {
                              const width = 500;
                              const stepX = scores.length > 1 ? width / (scores.length - 1) : width;
                              const points = scores.map((s, idx) => {
                                const x = scores.length > 1 ? idx * stepX : width / 2;
                                const y = 170 - (s / 100) * 150;
                                return { x, y, score: s };
                              });

                              const pathData = scores.length > 1
                                ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                                : `M 0 ${points[0].y} L 500 ${points[0].y}`;

                              const areaData = scores.length > 1
                                ? `${pathData} L ${points[points.length - 1].x} 170 L 0 170 Z`
                                : `M 0 ${points[0].y} L 500 ${points[0].y} L 500 170 L 0 170 Z`;

                              return (
                                <>
                                  <path d={areaData} fill="url(#score-gradient)" opacity="0.1" />
                                  <path d={pathData} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
                                  {points.map((p, idx) => (
                                    <g key={idx} className="group cursor-pointer">
                                      <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="var(--color-primary)" strokeWidth="2.5" />
                                      <circle cx={p.x} cy={p.y} r="8" fill="var(--color-primary)" opacity="0" className="hover:opacity-20 transition-opacity" />
                                      <foreignObject x={p.x - 25} y={p.y - 30} width="50" height="25" className="overflow-visible pointer-events-none">
                                        <div className="bg-text-primary text-bg-color text-[9px] font-black px-1.5 py-0.5 rounded text-center shadow whitespace-nowrap">
                                          {p.score}%
                                        </div>
                                      </foreignObject>
                                    </g>
                                  ))}
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <text x="250" y="100" textAnchor="middle" className="text-xs fill-text-tertiary font-bold">
                            No score trend available yet.
                          </text>
                        )}
                        <defs>
                          <linearGradient id="score-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Weekly Activity Card */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm flex flex-col gap-4">
                <h3 className="font-display font-bold text-base text-text-primary m-0">Weekly Practice Activity</h3>
                <div className="w-full flex flex-col justify-end min-h-[220px]">
                  {(() => {
                    const last7Days = [];
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      last7Days.push(d.toISOString().slice(0, 10));
                    }
                    const maxCount = Math.max(...(analyticsData.weeklyActivity || []).map(w => w.count), 1);
                    return (
                      <div className="flex items-end justify-between h-40 pt-4 px-2 border-b border-l border-border-color/60">
                        {last7Days.map(date => {
                          const match = (analyticsData.weeklyActivity || []).find(w => w.date === date);
                          const count = match ? match.count : 0;
                          const heightPercent = (count / maxCount) * 100;
                          const dayLabel = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
                          return (
                            <div key={date} className="flex flex-col items-center gap-2 grow group">
                              <div className="w-full max-w-[20px] bg-bg-tertiary rounded-t-md relative h-32 flex items-end">
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className="w-full bg-primary rounded-t-md relative group-hover:bg-primary-dark transition-all duration-300"
                                />
                                <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-10">
                                  {count} quizzes
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-text-secondary">{dayLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Bottom Layout - Topics Accuracy and Topic Breakdown Table */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6">
              {/* Topic Accuracy Bar chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm flex flex-col gap-5">
                <h3 className="font-display font-bold text-base text-text-primary m-0">Topic Performance</h3>
                {analyticsData.topicBreakdown.length === 0 ? (
                  <p className="text-xs text-text-secondary">No topic tests completed yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {analyticsData.topicBreakdown.map(tb => (
                      <div key={tb.topic} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-bold text-text-secondary">
                          <span>{tb.topic} ({tb.attempts} attempts)</span>
                          <span>{tb.accuracy}% Accuracy</span>
                        </div>
                        <div className="w-full bg-bg-tertiary h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${tb.accuracy}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Table */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-border-color shadow-sm flex flex-col gap-4">
                <h3 className="font-display font-bold text-base text-text-primary m-0">Topic Analysis Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg-secondary/60 border-b border-border-color text-left">
                        <th className="px-4 py-3 font-bold text-text-secondary uppercase">Topic Name</th>
                        <th className="px-4 py-3 font-bold text-text-secondary uppercase w-20">Attempts</th>
                        <th className="px-4 py-3 font-bold text-text-secondary uppercase w-24">Avg Score</th>
                        <th className="px-4 py-3 font-bold text-text-secondary uppercase w-24">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/60">
                      {analyticsData.topicBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-text-secondary">No topic data available.</td>
                        </tr>
                      ) : (
                        analyticsData.topicBreakdown.map(tb => (
                          <tr key={tb.topic} className="hover:bg-bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-bold text-text-primary">{tb.topic}</td>
                            <td className="px-4 py-3 text-text-secondary font-semibold">{tb.attempts}</td>
                            <td className="px-4 py-3 text-text-secondary font-semibold">{tb.averageScore}%</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] border ${tb.accuracy >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  tb.accuracy >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                {tb.accuracy}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Badges view
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left animate-fadeIn">
      <div>
        <h2 className="font-display font-black text-2xl text-text-primary">Achievement Badges</h2>
        <p className="text-text-secondary text-sm mt-1">Unlock badges as you complete challenges and improve your scores!</p>
      </div>

      {badgesLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-text-secondary font-medium text-xs">Syncing your achievements...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {earnedBadges.length === 0 && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs md:text-sm font-semibold flex items-start gap-3">
              <div className="p-1 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                <Medal size={16} />
              </div>
              <div>
                <p className="font-bold text-amber-900">No badges earned yet.</p>
                <p className="font-medium text-amber-700/90 mt-0.5">Complete quizzes and achieve milestones to unlock badges.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                name: 'First Attempt',
                desc: 'Awarded after completing your first quiz attempt!',
                icon: Medal,
                badgeClass: 'from-blue-500 to-indigo-600'
              },
              {
                name: 'Quiz Master',
                desc: 'Scored 80% or higher on a quiz!',
                icon: Sparkles,
                badgeClass: 'from-amber-400 to-yellow-500'
              },
              {
                name: 'Speed Solver',
                desc: 'Finished a quiz with more than 50% time remaining and at least 60% score!',
                icon: Clock,
                badgeClass: 'from-rose-500 to-red-600'
              },
              {
                name: 'Consistency Badge',
                desc: 'Completed 5 quiz assessments!',
                icon: CheckCircle,
                badgeClass: 'from-emerald-500 to-teal-600'
              },
              {
                name: 'Calculus Champion',
                desc: 'Completed 10 high-scoring quizzes (80% or higher)!',
                icon: GraduationCap,
                badgeClass: 'from-purple-500 to-indigo-700'
              }
            ].map(badge => {
              const earned = earnedBadges.find(b => b.badgeName === badge.name);
              const IconComp = badge.icon;

              return (
                <div
                  key={badge.name}
                  className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center justify-between transition-all duration-300 relative overflow-hidden ${earned ? 'border-primary/20 hover:shadow-md' : 'opacity-55 grayscale border-border-color'
                    }`}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-primary-dark opacity-10"></div>

                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative ${earned ? 'bg-gradient-to-tr ' + badge.badgeClass + ' text-white' : 'bg-bg-tertiary text-text-tertiary'
                      }`}>
                      <IconComp size={30} />
                      {!earned && (
                        <div className="absolute bottom-[-6px] right-[-6px] bg-slate-400 text-white rounded-full p-1 border-2 border-white shadow-sm flex items-center justify-center">
                          <X size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-text-primary m-0">{badge.name}</h4>
                      <p className="text-xxs text-text-secondary font-medium mt-1 px-2 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="w-full mt-6 pt-4 border-t border-border-color/60 text-xxs font-extrabold tracking-wider">
                    {earned ? (
                      <span className="text-emerald-500 uppercase flex items-center justify-center gap-1">
                        Earned {new Date(earned.earnedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
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
    </div>
  );
};

export default AchievementTab;
