import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const CourseQuizBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [questions, setQuestions] = useState([]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  const { socket } = useSocket();

  const fetchCourseAndQuiz = useCallback(async () => {
    try {
      setLoading(true);
        // We only need the title, but we can fetch the whole course details
        const courseRes = await api.get('/admin/courses');
        const courses = courseRes.data?.data || [];
        const course = courses.find(c => c.id.toString() === id);
        if (course) {
          setCourseTitle(course.title);
        }

        const quizRes = await api.get(`/admin/courses/${id}/quiz`);
        if (quizRes.data?.success && Array.isArray(quizRes.data.data)) {
          setQuestions(quizRes.data.data);
        }
      } catch (err) {
        showToast('Failed to load quiz data', 'error');
      } finally {
        setLoading(false);
      }
    }, [id, showToast]);

  useEffect(() => {
    fetchCourseAndQuiz();
  }, [fetchCourseAndQuiz]);

  useEffect(() => {
    if (!socket) return;
    const handleQuizUpdate = (data) => {
      if (data && data.courseId && data.courseId.toString() === id) {
        fetchCourseAndQuiz();
      }
    };
    socket.on('quiz:update', handleQuizUpdate);
    return () => socket.off('quiz:update', handleQuizUpdate);
  }, [socket, id, fetchCourseAndQuiz]);

  const handleSaveQuiz = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/admin/courses/${id}/quiz`, { questions });
      if (res.data?.success) {
        showToast('Quiz saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save quiz', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenForm = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setQuestionForm({ ...questions[index] });
    } else {
      setEditingIndex('new');
      setQuestionForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: ''
      });
    }
  };

  const handleCloseForm = () => {
    setEditingIndex(null);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!questionForm.question || questionForm.options.some(o => !o) || !questionForm.correctAnswer) {
      showToast('Please fill all fields and select a correct answer.', 'error');
      return;
    }

    const newQuestions = [...questions];
    if (editingIndex === 'new') {
      newQuestions.push(questionForm);
    } else {
      newQuestions[editingIndex] = questionForm;
    }
    setQuestions(newQuestions);
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = questions.filter((_, idx) => idx !== index);
    setQuestions(newQuestions);
  };

  if (loading) return <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">Loading quiz data...</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Mobile layout (hidden on md+) */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Row 1: Arrow + Title */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/admin/courses')} className="p-2 bg-bg-color border border-border-color rounded-xl hover:bg-slate-50 cursor-pointer shrink-0 mt-0.5">
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary m-0">Quiz Builder</h2>
            <p className="text-text-secondary text-xs m-0 mt-0.5">Manage questions for course: <span className="font-semibold">{courseTitle}</span></p>
          </div>
        </div>
        {/* Row 2: Buttons centered */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-color text-primary border border-primary font-semibold text-sm rounded-lg hover:bg-primary-50 cursor-pointer shadow-sm transition-all"
          >
            <Plus size={16} /> Add Question
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer disabled:opacity-50 shadow-sm transition-all"
          >
            {saving ? 'Saving...' : <><Save size={16} /> Save Quiz</>}
          </button>
        </div>
      </div>

      {/* Desktop layout (hidden below md) */}
      <div className="hidden md:flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/courses')} className="p-2 bg-bg-color border border-border-color rounded-xl hover:bg-slate-50 cursor-pointer">
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary m-0">Quiz Builder</h2>
            <p className="text-text-secondary text-sm m-0 mt-0.5">Manage questions for course: <span className="font-semibold">{courseTitle}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 bg-bg-color text-primary border border-primary font-semibold text-sm rounded-lg hover:bg-primary-50 cursor-pointer shadow-sm transition-all"
          >
            <Plus size={16} /> Add Question
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer disabled:opacity-50 shadow-sm transition-all"
          >
            {saving ? 'Saving...' : <><Save size={16} /> Save Quiz</>}
          </button>
        </div>
      </div>

      <div className="bg-bg-color rounded-2xl border border-border-color shadow-sm p-6">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>No questions added yet. Click "Add Question" to begin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 border border-border-color rounded-xl bg-bg-secondary/30 relative flex flex-col gap-3">
                <div className="flex justify-between gap-4">
                  <h4 className="font-semibold text-text-primary m-0 text-sm">
                    {idx + 1}. {q.question}
                  </h4>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleOpenForm(idx)} className="p-1.5 text-primary hover:bg-primary-50 rounded cursor-pointer border-0 bg-transparent">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteQuestion(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer border-0 bg-transparent">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`p-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-bg-color border-border-color text-text-secondary'}`}>
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-bg-color rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">
            <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary m-0">
                {editingIndex === 'new' ? 'Add Question' : 'Edit Question'}
              </h3>
              <button onClick={handleCloseForm} className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="grow flex flex-col overflow-hidden">
              <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Question Text</label>
                  <textarea
                    value={questionForm.question}
                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Enter the question here..."
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all min-h-[80px]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <label className="text-xs font-bold text-text-secondary uppercase mb-[-4px]">Options</label>
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-bg-secondary text-text-secondary text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...questionForm.options];
                          newOpts[idx] = e.target.value;
                          // If this option was the correct answer, update the correct answer text if it matches
                          // To avoid bugs with renaming the correct option, let's keep it simple: 
                          // the user has to re-select the correct answer if they change the text.
                          setQuestionForm({ ...questionForm, options: newOpts, correctAnswer: questionForm.correctAnswer === opt ? e.target.value : questionForm.correctAnswer });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="grow p-2.5 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        required
                      />
                      <label className="flex items-center gap-1.5 shrink-0 cursor-pointer text-xs font-semibold select-none">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={questionForm.correctAnswer === opt && opt !== ''}
                          onChange={() => setQuestionForm({ ...questionForm, correctAnswer: opt })}
                          disabled={!opt}
                          required
                          className="w-4 h-4 text-primary focus:ring-primary border-border-color"
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all">
                  <Save size={16} /> Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQuizBuilder;
