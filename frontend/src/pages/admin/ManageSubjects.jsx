import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, FunctionSquare, Shapes, TriangleRight, BarChart3, Infinity as InfinityIcon, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { useSocket } from '../../hooks/useSocket';

// Icon Map for dynamic rendering
export const iconMap = {
  'FunctionSquare': FunctionSquare,
  'Shapes': Shapes,
  'TriangleRight': TriangleRight,
  'BarChart3': BarChart3,
  'InfinityIcon': InfinityIcon,
  'GraduationCap': GraduationCap,
};

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    subtitle: '',
    badge: '',
    icon: 'FunctionSquare',
    bgColor: 'bg-blue-50 text-blue-600',
    seoTitle: '',
    seoDescription: '',
    overview: '',
    whyItMatters: '',
    topicsCovered: '', // Stored as comma-separated string in form, JSON in DB
    whoItIsFor: '',
    howWeHelp: '',
    learningOutcomes: '',
    examPrepTips: '',
    sidebarDifficulty: 'Medium',
    sidebarFocus: '',
    sidebarRecommendedGrade: '',
    sidebarStudyTime: '',
    relatedVideosCategory: '',
    relatedSubjects: ''
  });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.data || []);
    } catch (error) {
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchSubjects();
    socket.on('subject:create', refreshData);
    socket.on('subject:update', refreshData);
    socket.on('subject:delete', refreshData);
    return () => {
      socket.off('subject:create', refreshData);
      socket.off('subject:update', refreshData);
      socket.off('subject:delete', refreshData);
    };
  }, [socket]);

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        ...subject,
        topicsCovered: (subject.topicsCovered || []).join('\n'),
        learningOutcomes: (subject.learningOutcomes || []).join('\n'),
        examPrepTips: (subject.examPrepTips || []).join('\n'),
        relatedSubjects: (subject.relatedSubjects || []).join(', ')
      });
    } else {
      setEditingSubject(null);
      setFormData({
        slug: '', title: '', subtitle: '', badge: '', icon: 'FunctionSquare', bgColor: 'bg-blue-50 text-blue-600',
        seoTitle: '', seoDescription: '', overview: '', whyItMatters: '',
        topicsCovered: '', whoItIsFor: '', howWeHelp: '', learningOutcomes: '', examPrepTips: '',
        sidebarDifficulty: 'Medium', sidebarFocus: '', sidebarRecommendedGrade: '', sidebarStudyTime: '',
        relatedVideosCategory: '', relatedSubjects: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        topicsCovered: formData.topicsCovered.split('\n').map(t => t.trim()).filter(Boolean),
        learningOutcomes: formData.learningOutcomes.split('\n').map(t => t.trim()).filter(Boolean),
        examPrepTips: formData.examPrepTips.split('\n').map(t => t.trim()).filter(Boolean),
        relatedSubjects: formData.relatedSubjects.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject.id}`, payload);
      } else {
        await api.post('/admin/subjects', payload);
      }
      fetchSubjects();
      handleCloseModal();
    } catch (error) {
      alert('Error saving subject');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/admin/subjects/${id}`);
        fetchSubjects();
      } catch (error) {
      }
    }
  };

  const filteredSubjects = subjects.filter(sub =>
    sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Manage Subjects</h2>
          <p className="text-text-secondary">Add, edit, or remove subjects for the curriculum.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={18} /> Add Subject
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border-color p-6">
        <div className="flex items-center gap-4 mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-color rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-text-tertiary animate-pulse">Loading subjects...</div>
        ) : filteredSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color/60 text-xs uppercase tracking-wider text-text-tertiary">
                  <th className="pb-3 px-4 font-bold">Title</th>
                  <th className="pb-3 px-4 font-bold">Slug</th>
                  <th className="pb-3 px-4 font-bold">Badge</th>
                  <th className="pb-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(subject => (
                  <tr key={subject.id} className="border-b border-border-color/40 hover:bg-bg-secondary/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-text-primary">{subject.title}</td>
                    <td className="py-4 px-4 text-sm text-text-secondary">{subject.slug}</td>
                    <td className="py-4 px-4"><span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{subject.badge || 'N/A'}</span></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(subject)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(subject.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-text-tertiary">
            <p>No subjects found.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[99999999999999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-border-color flex items-center justify-between shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grow">
              <form id="subjectForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Basic Details */}
                <div className="col-span-1 md:col-span-2"><h4 className="font-bold text-primary border-b border-border-color pb-2 mb-2">Basic Details</h4></div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Slug * (e.g. algebra)</label>
                  <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Subtitle</label>
                  <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Badge (e.g. Core Foundation)</label>
                  <input type="text" name="badge" value={formData.badge} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Icon ID</label>
                  <select name="icon" value={formData.icon} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors">
                    {Object.keys(iconMap).map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Card Tailwind Colors (e.g. bg-blue-50 text-blue-600)</label>
                  <input type="text" name="bgColor" value={formData.bgColor} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>

                {/* SEO */}
                <div className="col-span-1 md:col-span-2"><h4 className="font-bold text-primary border-b border-border-color pb-2 mb-2 mt-4">SEO Details</h4></div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">SEO Title</label>
                  <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">SEO Description</label>
                  <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[80px]" />
                </div>

                {/* Content */}
                <div className="col-span-1 md:col-span-2"><h4 className="font-bold text-primary border-b border-border-color pb-2 mb-2 mt-4">Content & Explanations</h4></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">Overview</label>
                  <textarea name="overview" value={formData.overview} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[100px]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">Why It Matters</label>
                  <textarea name="whyItMatters" value={formData.whyItMatters} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[100px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Who It Is For</label>
                  <textarea name="whoItIsFor" value={formData.whoItIsFor} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[80px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">How We Help</label>
                  <textarea name="howWeHelp" value={formData.howWeHelp} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[80px]" />
                </div>

                {/* Lists */}
                <div className="col-span-1 md:col-span-2"><h4 className="font-bold text-primary border-b border-border-color pb-2 mb-2 mt-4">Lists (One per line)</h4></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">Topics Covered</label>
                  <textarea name="topicsCovered" placeholder="Topic 1&#10;Topic 2" value={formData.topicsCovered} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[120px]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">Learning Outcomes</label>
                  <textarea name="learningOutcomes" placeholder="Outcome 1&#10;Outcome 2" value={formData.learningOutcomes} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[120px]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-primary mb-1">Exam Prep Tips</label>
                  <textarea name="examPrepTips" placeholder="Tip 1&#10;Tip 2" value={formData.examPrepTips} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors min-h-[120px]" />
                </div>

                {/* Sidebar & Relations */}
                <div className="col-span-1 md:col-span-2"><h4 className="font-bold text-primary border-b border-border-color pb-2 mb-2 mt-4">Sidebar & Relations</h4></div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Sidebar Difficulty</label>
                  <select name="sidebarDifficulty" value={formData.sidebarDifficulty} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Medium-Hard">Medium-Hard</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Sidebar Focus</label>
                  <input type="text" name="sidebarFocus" value={formData.sidebarFocus} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Recommended Grade</label>
                  <input type="text" name="sidebarRecommendedGrade" value={formData.sidebarRecommendedGrade} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Study Time</label>
                  <input type="text" name="sidebarStudyTime" value={formData.sidebarStudyTime} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Related Videos Category</label>
                  <input type="text" name="relatedVideosCategory" value={formData.relatedVideosCategory} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Related Subject Slugs (comma-separated)</label>
                  <input type="text" name="relatedSubjects" value={formData.relatedSubjects} onChange={handleChange} className="w-full px-4 py-2 border border-border-color rounded-xl focus:border-primary bg-bg-secondary focus:bg-white transition-colors" />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-border-color bg-bg-secondary flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button variant="primary" type="submit" form="subjectForm">Save Subject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;
