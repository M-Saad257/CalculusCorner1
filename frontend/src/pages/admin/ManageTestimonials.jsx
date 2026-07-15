import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Star, CheckCircle, XCircle } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const ManageTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const { confirm, showToast } = useDialog();
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5
  });
  const [activeTab, setActiveTab] = useState('approved');

  const fetchTestimonials = async () => {
    try {
      const res = await api.get('/testimonials');
      const data = res.data?.data;
      setTestimonials(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchTestimonials();
    socket.on('site:testimonial-update', refreshData);
    return () => socket.off('site:testimonial-update', refreshData);
  }, [socket]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm(
      'Delete Testimonial?',
      'Are you sure you want to delete this testimonial? This action cannot be undone.',
      { confirmLabel: 'Delete Testimonial', danger: true }
    );
    if (!isConfirmed) return;
    try {
      await api.delete(`/testimonials/${id}`);
      showToast('Testimonial deleted successfully.', 'success');
      fetchTestimonials();
    } catch (err) {
      showToast('Failed to delete testimonial. Please try again.', 'error');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/admin/testimonials/${id}/status`, { status });
      showToast(`Testimonial ${status} successfully.`, 'success');
      fetchTestimonials();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/testimonials', formData);
      setIsAdding(false);
      fetchTestimonials();
    } catch (err) {
    }
  };

  const addNew = () => {
    setIsAdding(true);
    setFormData({ name: '', role: '', text: '', rating: 5 });
  };

  if (loading) return <div className="flex justify-center items-center h-48 text-primary font-semibold">Loading testimonials...</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-display font-bold text-xl text-text-primary">Manage Reviews & Testimonials</h2>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition-all shadow-sm" 
          onClick={addNew} 
          disabled={isAdding}
        >
          <Plus size={18} /> Add New Review
        </button>
      </div>

      <div className="flex gap-4 border-b border-border-color mb-4">
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'approved' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Approved Reviews
          {activeTab === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Pending Requests ({testimonials.filter(t => t.status === 'pending').length})
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdding && (
          <div className="p-6 rounded-2xl bg-bg-color border-2 border-primary-light shadow-md flex flex-col gap-4 glass">
            <h3 className="font-display font-bold text-lg text-text-primary">Add New Review</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <input 
                type="text" 
                placeholder="Student Name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <input 
                type="text" 
                placeholder="Role (e.g. Grade 10 Student)" 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
                required 
                className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <textarea 
                placeholder="Review Text" 
                value={formData.text} 
                onChange={e => setFormData({...formData, text: e.target.value})} 
                required 
                rows={4} 
                className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-y"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-text-secondary">Rating (1-5):</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={formData.rating} 
                  onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} 
                  required 
                  className="w-20 p-2 border border-border-color rounded-lg font-sans text-sm text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-lg border-0 shadow-sm grow cursor-pointer transition-all">
                  <Save size={16} /> Save
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-bg-secondary text-text-secondary font-bold text-xs rounded-lg hover:bg-slate-200 transition-all border-0 grow cursor-pointer" onClick={() => setIsAdding(false)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {testimonials.filter(t => (t.status || 'approved') === activeTab).map(t => (
          <div key={t.id} className="p-6 rounded-2xl bg-bg-color border border-border-color shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <span className="font-bold text-primary text-xs md:text-sm">{t.name}</span>
              <span className="font-semibold text-text-secondary bg-bg-secondary px-2 py-0.5 rounded text-xs flex items-center gap-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" /> {t.rating}
              </span>
            </div>
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-text-secondary">{t.role}</h3>
            <p className="text-text-secondary italic text-sm m-0 line-clamp-4 leading-relaxed">"{t.text}"</p>
            {activeTab === 'pending' ? (
              <div className="flex gap-2 mt-auto pt-4 border-t border-border-color">
                <button
                  className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
                  onClick={() => handleStatusUpdate(t.id, 'approved')}
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                  onClick={() => handleDelete(t.id)}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            ) : (
              <button 
                className="mt-auto flex justify-center items-center gap-2 w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors cursor-pointer border-0"
                onClick={() => handleDelete(t.id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageTestimonials;
