import { useState, useEffect } from 'react';
import { Trophy, Award, Search, CheckCircle } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';

const ManageLeaderboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useDialog();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/courses');
        if (res.data?.success && Array.isArray(res.data.data)) {
          // Only courses with quizzes
          const quizCourses = res.data.data.filter(c => c.quiz_required === 1);
          setCourses(quizCourses);
          if (quizCourses.length > 0) {
            setSelectedCourse(quizCourses[0].id);
          }
        }
      } catch (err) {
        showToast('Failed to load courses', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedCourse) return;
      try {
        setLoading(true);
        // We'll create this backend endpoint next
        const res = await api.get(`/admin/courses/${selectedCourse}/leaderboard`);
        if (res.data?.success) {
          setLeaderboard(res.data.data);
        }
      } catch (err) {
        showToast('Failed to load leaderboard', 'error');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedCourse]);

  const awardBadge = async (userId) => {
    try {
      // Endpoint to manually award gold badge for this course
      const res = await api.post(`/admin/courses/${selectedCourse}/award-badge`, { userId });
      if (res.data?.success) {
        showToast('Gold badge awarded successfully!', 'success');
        // refresh leaderboard
        const lbRes = await api.get(`/admin/courses/${selectedCourse}/leaderboard`);
        setLeaderboard(lbRes.data.data);
      }
    } catch (err) {
      showToast('Failed to award badge', 'error');
    }
  };

  if (loading && courses.length === 0) return <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary">Course Leaderboards</h2>
        <p className="text-text-secondary text-xs md:text-sm">View top scorers for each course and award Gold Badges.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-bg-color rounded-2xl border border-border-color shadow-sm p-12 text-center text-text-secondary">
          <p>No courses with quizzes found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm border-0 cursor-pointer whitespace-nowrap transition-all ${
                  selectedCourse === course.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-bg-color border border-border-color text-text-secondary hover:bg-slate-50'
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>

          <div className="bg-bg-color rounded-2xl border border-border-color shadow-sm overflow-hidden">
            {leaderboard.length === 0 && !loading ? (
              <div className="p-12 text-center text-text-secondary">
                <Trophy size={48} className="text-slate-300 mx-auto mb-3" />
                <p>No quiz attempts for this course yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-color text-xs uppercase text-text-secondary font-bold tracking-wider">
                    <th className="p-4 pl-6">Rank</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Score</th>
                    <th className="p-4 pr-6 text-right">Award Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-lg text-primary">
                        #{idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-text-primary">{entry.userName}</span>
                          <span className="text-xs text-text-secondary">{entry.userEmail}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-lg text-emerald-600">{entry.score}%</span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {entry.hasBadge ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 font-bold text-xs rounded-full border border-amber-200">
                            <Award size={14} /> Gold Badge Awarded
                          </span>
                        ) : (
                          <button
                            onClick={() => awardBadge(entry.userId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-lg transition-colors border-0 cursor-pointer"
                          >
                            <Award size={14} /> Award Badge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeaderboard;
