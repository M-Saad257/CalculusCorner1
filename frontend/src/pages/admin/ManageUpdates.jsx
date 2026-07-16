import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Bell, Loader2, Star, Calendar } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ManageUpdates = () => {
  const { showToast } = useDialog();
  const [activeSubTab, setActiveSubTab] = useState('news_updates'); // 'news_updates' | 'ticker_announcements'
  
  // --- NEWS & UPDATES CMS STATE ---
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updateEditingId, setUpdateEditingId] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    link: ''
  });
  const [updateDeleteId, setUpdateDeleteId] = useState(null);
  const [updateDeleteName, setUpdateDeleteName] = useState('');

  // --- TICKER ANNOUNCEMENTS STATE ---
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [annEditingId, setAnnEditingId] = useState(null);
  const [annFormData, setAnnFormData] = useState({
    title: '',
    text: '',
    link: '',
    active: true,
    priority: 0,
    start_date: '',
    end_date: '',
    display_order: 0
  });
  const [annDeleteId, setAnnDeleteId] = useState(null);
  const [annDeleteName, setAnnDeleteName] = useState('');

  // --- LOAD DATA HELPERS ---
  const fetchUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const res = await api.get('/updates');
      if (res.data && Array.isArray(res.data.data)) {
        setUpdates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const res = await api.get('/admin/announcements');
      if (res.data && Array.isArray(res.data.data)) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const loadAll = () => {
    fetchUpdates();
    fetchAnnouncements();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('update:create', fetchUpdates);
    socket.on('update:update', fetchUpdates);
    socket.on('update:delete', fetchUpdates);

    socket.on('announcement:create', fetchAnnouncements);
    socket.on('announcement:update', fetchAnnouncements);
    socket.on('announcement:delete', fetchAnnouncements);

    return () => {
      socket.off('update:create', fetchUpdates);
      socket.off('update:update', fetchUpdates);
      socket.off('update:delete', fetchUpdates);

      socket.off('announcement:create', fetchAnnouncements);
      socket.off('announcement:update', fetchAnnouncements);
      socket.off('announcement:delete', fetchAnnouncements);
    };
  }, [socket]);

  // --- NEWS & UPDATES CMS HANDLERS ---
  const handleAddNewUpdate = () => {
    setUpdateEditingId('new');
    setUpdateFormData({
      title: '',
      content: '',
      category: 'General',
      link: ''
    });
  };

  const handleEditUpdate = (item) => {
    setUpdateEditingId(item.id);
    setUpdateFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      link: item.link || ''
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateFormData.title || !updateFormData.content) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    try {
      const payload = {
        ...updateFormData,
        link: updateFormData.link?.trim() || null
      };
      if (updateEditingId === 'new') {
        await api.post('/updates/admin', payload);
        showToast('Update published successfully!', 'success');
      } else {
        await api.put(`/updates/admin/${updateEditingId}`, payload);
        showToast('Update modified successfully.', 'success');
      }
      setUpdateEditingId(null);
      fetchUpdates();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleDeleteUpdate = (item) => {
    setUpdateDeleteId(item.id);
    setUpdateDeleteName(item.title);
  };

  const handleConfirmDeleteUpdate = async () => {
    if (!updateDeleteId) return;
    try {
      await api.delete(`/updates/admin/${updateDeleteId}`);
      showToast('Update deleted successfully.', 'success');
      fetchUpdates();
    } catch (err) {
      showToast('Failed to delete update.', 'error');
    } finally {
      setUpdateDeleteId(null);
      setUpdateDeleteName('');
    }
  };

  // --- ANNOUNCEMENTS HANDLERS ---
  const formatDatetimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleAddNewAnnouncement = () => {
    setAnnEditingId('new');
    setAnnFormData({
      title: '',
      text: '',
      link: '',
      active: true,
      priority: 0,
      start_date: '',
      end_date: '',
      display_order: 0
    });
  };

  const handleEditAnnouncement = (ann) => {
    setAnnEditingId(ann.id);
    setAnnFormData({
      title: ann.title || '',
      text: ann.text || '',
      link: ann.link || '',
      active: ann.active === 1,
      priority: ann.priority || 0,
      start_date: ann.start_date ? formatDatetimeForInput(ann.start_date) : '',
      end_date: ann.end_date ? formatDatetimeForInput(ann.end_date) : '',
      display_order: ann.display_order || 0
    });
  };

  const handleAnnouncementToggleActive = async (ann) => {
    try {
      const updatedActive = ann.active === 1 ? 0 : 1;
      const res = await api.put(`/admin/announcements/${ann.id}`, {
        ...ann,
        active: updatedActive
      });
      if (res.data && res.data.success) {
        showToast('Announcement status updated!', 'success');
        fetchAnnouncements();
      }
    } catch (err) {
      showToast('Failed to toggle active state.', 'error');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!annFormData.text.trim()) {
      showToast('Announcement message is required.', 'error');
      return;
    }

    const payload = {
      title: annFormData.title.trim() || 'Notice',
      text: annFormData.text.trim(),
      link: annFormData.link ? annFormData.link.trim() : null,
      active: annFormData.active ? 1 : 0,
      priority: parseInt(annFormData.priority) || 0,
      start_date: annFormData.start_date ? new Date(annFormData.start_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      end_date: annFormData.end_date ? new Date(annFormData.end_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      display_order: parseInt(annFormData.display_order) || 0
    };

    try {
      if (annEditingId === 'new') {
        await api.post('/admin/announcements', payload);
        showToast('Announcement published successfully!', 'success');
      } else {
        await api.put(`/admin/announcements/${annEditingId}`, payload);
        showToast('Announcement updated successfully.', 'success');
      }
      setAnnEditingId(null);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = (ann) => {
    setAnnDeleteId(ann.id);
    setAnnDeleteName(ann.title || ann.text);
  };

  const handleConfirmDeleteAnnouncement = async () => {
    if (!annDeleteId) return;
    try {
      const res = await api.delete(`/admin/announcements/${annDeleteId}`);
      if (res.data && res.data.success) {
        showToast('Announcement deleted successfully.', 'success');
        fetchAnnouncements();
      }
    } catch (err) {
      showToast('Failed to delete announcement.', 'error');
    } finally {
      setAnnDeleteId(null);
      setAnnDeleteName('');
    }
  };

  // --- PRESENTATION HELPERS ---
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Board Updates': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Result Announcement': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'News & Events': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-bg-color p-6 rounded-2xl shadow-sm border border-border-color gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Updates & Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">
            {activeSubTab === 'news_updates' 
              ? 'Publish rich news feeds, board exam guides, and academic result sheets.' 
              : 'Configure home-page alert banner notices and scheduled ticker messages.'}
          </p>
        </div>
        <button 
          onClick={activeSubTab === 'news_updates' ? handleAddNewUpdate : handleAddNewAnnouncement}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus size={18} /> Add {activeSubTab === 'news_updates' ? 'News Feed' : 'Ticker Announcement'}
        </button>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="flex gap-2 border-b border-border-color pb-3">
        <button
          onClick={() => setActiveSubTab('news_updates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'news_updates'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-bg-color text-text-secondary border-border-color hover:bg-bg-tertiary'
          }`}
        >
          News & Board Feed
        </button>
        <button
          onClick={() => setActiveSubTab('ticker_announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'ticker_announcements'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-bg-color text-text-secondary border-border-color hover:bg-bg-tertiary'
          }`}
        >
          Ticker Banner Announcements
        </button>
      </div>

      {/* --- PANEL RENDERING --- */}
      {activeSubTab === 'news_updates' ? (
        updatesLoading ? (
          <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
            Loading news feed...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {updates.map(item => (
              <div key={item.id} className="p-5 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative text-left">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-text-tertiary font-bold">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-text-primary m-0 line-clamp-2">{item.title}</h3>
                  <p className="text-text-secondary text-xs line-clamp-3 leading-relaxed whitespace-pre-line">{item.content}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mt-1">
                       {item.link.length > 40 ? item.link.substring(0, 40) + '...' : item.link}
                    </a>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border-color/60">
                  <button 
                    onClick={() => handleEditUpdate(item)} 
                    className="p-2 text-text-tertiary hover:text-primary hover:bg-bg-tertiary rounded-xl transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteUpdate(item)} 
                    className="p-2 text-text-tertiary hover:text-red-500 hover:bg-bg-tertiary rounded-xl transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {updates.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-text-secondary gap-3 border-2 border-dashed border-border-color rounded-2xl bg-bg-color">
                <Bell size={48} className="text-text-tertiary" />
                <p className="font-medium text-sm">No updates published yet.</p>
              </div>
            )}
          </div>
        )
      ) : (
        announcementsLoading ? (
          <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
            Loading announcements...
          </div>
        ) : (
          <div className="bg-bg-color border border-border-color rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-color text-left">
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Announcement Text</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-24">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-24">Order</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-28">Active Bounds</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-28">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/60">
                  {announcements.map(ann => (
                    <tr key={ann.id} className="hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-text-primary">{ann.title || 'Notice'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-text-secondary line-clamp-2 max-w-sm leading-relaxed">{ann.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-primary border border-blue-100 dark:border-blue-900/50">
                          <Star size={10} className="fill-current text-primary" /> {ann.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-secondary">
                        {ann.display_order || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[10px] font-semibold text-text-secondary gap-0.5">
                          {ann.start_date || ann.end_date ? (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="text-text-tertiary font-bold">START:</span>
                                <span>{ann.start_date ? new Date(ann.start_date).toLocaleDateString() : 'Immediate'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-text-tertiary font-bold">END:</span>
                                <span>{ann.end_date ? new Date(ann.end_date).toLocaleDateString() : 'Never'}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-text-tertiary">Always Visible</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAnnouncementToggleActive(ann)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border cursor-pointer select-none ${ann.active === 1
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                            : 'bg-slate-50 dark:bg-slate-900 text-text-tertiary border-slate-200 dark:border-slate-800'
                            }`}
                        >
                          {ann.active === 1 ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditAnnouncement(ann)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-transparent border border-border-color hover:border-primary text-text-secondary hover:text-primary font-semibold text-xs rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-transparent border border-red-100 hover:border-red-500 text-text-tertiary hover:text-red-500 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {announcements.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-text-secondary gap-3 bg-bg-color">
                <Bell size={48} className="text-text-tertiary" />
                <p className="font-medium text-sm">No alert announcements banners configured.</p>
              </div>
            )}
          </div>
        )
      )}

      {/* --- NEWS & UPDATES CREATOR MODAL --- */}
      {updateEditingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto border border-border-color text-left">
            <div className="px-6 py-5 border-b border-border-color flex justify-between items-center bg-bg-secondary">
              <h3 className="font-display font-bold text-lg text-text-primary m-0">
                {updateEditingId === 'new' ? 'Publish New Board Update' : 'Edit Update Details'}
              </h3>
              <button 
                onClick={() => setUpdateEditingId(null)}
                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-full hover:bg-bg-tertiary transition-all cursor-pointer border-0 bg-transparent shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Category</label>
                <select
                  value={updateFormData.category}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, category: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary dark:bg-slate-900 cursor-pointer"
                  required
                >
                  <option value="General" className="bg-bg-color text-text-primary">General Notice</option>
                  <option value="Board Updates" className="bg-bg-color text-text-primary">Board Updates</option>
                  <option value="Result Announcement" className="bg-bg-color text-text-primary">Result Announcement</option>
                  <option value="News & Events" className="bg-bg-color text-text-primary">News & Events</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Title</label>
                <input
                  type="text"
                  value={updateFormData.title}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, title: e.target.value })}
                  placeholder="e.g. Board Examinations Schedule 2026"
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Link <span className="text-text-tertiary font-normal">(Optional)</span></label>
                <input
                  type="url"
                  value={updateFormData.link}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, link: e.target.value })}
                  placeholder="https://example.com/related-page"
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Notification Body Content</label>
                <textarea
                  value={updateFormData.content}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, content: e.target.value })}
                  placeholder="Write the updates description details here..."
                  rows={1}
                  className="px-4 py-3 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary resize-y"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button 
                  type="button" 
                  onClick={() => setUpdateEditingId(null)}
                  className="px-5 py-2.5 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white border-0 font-semibold text-sm hover:bg-primary-dark transition-colors cursor-pointer shadow-sm shadow-primary/20"
                >
                  <Save size={16} /> Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TICKER ANNOUNCEMENTS EDIT MODAL --- */}
      {annEditingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto border border-border-color text-left">
            <div className="px-6 py-5 border-b border-border-color flex justify-between items-center bg-bg-secondary">
              <h3 className="font-display font-bold text-lg text-text-primary m-0">
                {annEditingId === 'new' ? 'Add Notice Announcement' : 'Edit Announcement Banner'}
              </h3>
              <button 
                onClick={() => setAnnEditingId(null)}
                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-full hover:bg-bg-tertiary transition-all cursor-pointer border-0 bg-transparent shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="p-6 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Board Exams 2026"
                  value={annFormData.title}
                  onChange={e => setAnnFormData({ ...annFormData, title: e.target.value })}
                  required
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Notice Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={annFormData.link}
                  onChange={e => setAnnFormData({ ...annFormData, link: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-secondary">Notice Message</label>
                <textarea
                  placeholder="Notice description to show inside the top ticker..."
                  value={annFormData.text}
                  onChange={e => setAnnFormData({ ...annFormData, text: e.target.value })}
                  required
                  rows={3}
                  className="px-4 py-3 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Priority Index</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={annFormData.priority}
                    onChange={e => setAnnFormData({ ...annFormData, priority: e.target.value })}
                    required
                    className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Display Order</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={annFormData.display_order}
                    onChange={e => setAnnFormData({ ...annFormData, display_order: e.target.value })}
                    required
                    className="px-4 py-2.5 rounded-xl border border-border-color bg-bg-color text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center py-1">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={annFormData.active}
                    onChange={e => setAnnFormData({ ...annFormData, active: e.target.checked })}
                    className="rounded border-border-color text-primary focus:ring-primary"
                  />
                  <span className="text-text-primary">Active immediately</span>
                </label>
              </div>

              <div className="border-t border-border-color my-1 pt-3 flex flex-col gap-3">
                <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                  <Calendar size={13} /> OPTIONAL SCHEDULING (GMT/UTC)
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Start Date/Time</label>
                    <input
                      type="datetime-local"
                      value={annFormData.start_date}
                      onChange={e => setAnnFormData({ ...annFormData, start_date: e.target.value })}
                      className="px-4 py-2 border border-border-color bg-bg-color rounded-xl text-xs font-sans text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">End Date/Time</label>
                    <input
                      type="datetime-local"
                      value={annFormData.end_date}
                      onChange={e => setAnnFormData({ ...annFormData, end_date: e.target.value })}
                      className="px-4 py-2 border border-border-color bg-bg-color rounded-xl text-xs font-sans text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button 
                  type="button" 
                  onClick={() => setAnnEditingId(null)}
                  className="px-5 py-2.5 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white border-0 font-semibold text-sm hover:bg-primary-dark transition-colors cursor-pointer shadow-sm shadow-primary/20"
                >
                  <Save size={16} /> Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM NEWS DELETE MODAL --- */}
      {updateDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-bg-color rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-border-color text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg m-0">Delete Update</h3>
                <p className="text-text-secondary text-sm mt-1 mb-0 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary">"{updateDeleteName}"</span>? This will remove it from the public feed.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setUpdateDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDeleteUpdate}
                className="px-4 py-2 rounded-xl bg-red-600 text-white border-0 font-semibold text-sm hover:bg-red-700 transition-colors cursor-pointer shadow-sm shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM ANNOUNCEMENT DELETE MODAL --- */}
      {annDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-bg-color rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-border-color text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg m-0">Delete Announcement</h3>
                <p className="text-text-secondary text-sm mt-1 mb-0 leading-relaxed">
                  Are you sure you want to delete the notice <span className="font-semibold text-text-primary">"{annDeleteName}"</span>? This will remove the banner from the landing page.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setAnnDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-border-color text-text-secondary font-semibold text-sm hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-color"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDeleteAnnouncement}
                className="px-4 py-2 rounded-xl bg-red-600 text-white border-0 font-semibold text-sm hover:bg-red-700 transition-colors cursor-pointer shadow-sm shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUpdates;
