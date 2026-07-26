import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, ImagePlus, Loader2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../../context/DialogContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const { showToast } = useDialog();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    grade: '',
    title: '',
    description: '',
    features: [],
    price: '',
    popular: false,
    thumbnail: null,
    external_drive_links: [],
    certificate_price: '0',
    quiz_required: false
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/courses');
      if (res.data && Array.isArray(res.data.data)) {
        setCourses(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchCourses();
    socket.on('course:create', refreshData);
    socket.on('course:update', refreshData);
    socket.on('course:delete', refreshData);
    return () => {
      socket.off('course:create', refreshData);
      socket.off('course:update', refreshData);
      socket.off('course:delete', refreshData);
    };
  }, [socket]);

  const handleEdit = (course) => {
    let featuresArray = [];
    if (Array.isArray(course.features)) {
      featuresArray = course.features;
    } else if (typeof course.features === 'string') {
      try {
        featuresArray = JSON.parse(course.features);
      } catch (e) {
        featuresArray = course.features.split(',').map(f => f.trim()).filter(f => f);
      }
    }
    let driveLinksArray = [];
    if (Array.isArray(course.external_drive_links)) {
      driveLinksArray = course.external_drive_links;
    } else if (typeof course.external_drive_links === 'string') {
      try {
        driveLinksArray = JSON.parse(course.external_drive_links);
      } catch (e) {
        driveLinksArray = course.external_drive_links.split(',').map(f => f.trim()).filter(f => f);
      }
    }

    setEditingId(course.id);
    setFormData({
      grade: course.grade,
      title: course.title,
      description: course.description,
      features: featuresArray,
      price: course.price,
      popular: course.popular === 1,
      thumbnail: course.thumbnail || null,
      external_drive_links: driveLinksArray,
      certificate_price: course.certificate_price || '0',
      quiz_required: course.quiz_required === 1
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleDelete = (course) => {
    setDeleteConfirmId(course.id);
    setDeleteConfirmName(course.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/courses/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        showToast('Course deleted successfully.', 'success');
        fetchCourses();
      }
    } catch (err) {
      showToast('Failed to delete course. Please try again.', 'error');
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let thumbnailUrl = formData.thumbnail || null;

    // Upload thumbnail first if a new file was selected
    if (thumbnailFile) {
      try {
        setThumbnailUploading(true);
        const imgData = new FormData();
        imgData.append('image', thumbnailFile);
        const imgRes = await api.post('/content/upload-image', imgData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (imgRes.data?.success) {
          thumbnailUrl = imgRes.data.data.url;
        }
      } catch (err) {
        showToast('Failed to upload thumbnail image. Please try again.', 'error');
        setThumbnailUploading(false);
        return;
      } finally {
        setThumbnailUploading(false);
      }
    }

    const payload = {
      ...formData,
      features: formData.features.map(f => f.trim()).filter(f => f),
      popular: formData.popular ? 1 : 0,
      thumbnail: thumbnailUrl,
      external_drive_links: formData.external_drive_links.map(l => l.trim()).filter(l => l),
      quiz_required: formData.quiz_required ? 1 : 0
    };

    try {
      if (editingId === 'new') {
        await api.post('/admin/courses', payload);
        showToast('Course added successfully.', 'success');
      } else {
        await api.put(`/admin/courses/${editingId}`, payload);
        showToast('Course updated successfully.', 'success');
      }
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const addNew = () => {
    setEditingId('new');
    setFormData({ grade: '', title: '', description: '', features: [], price: '', popular: false, thumbnail: null, external_drive_links: [], certificate_price: '0', quiz_required: false });
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };
  if (loading) return <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">Loading courses...</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Manage Courses</h2>
          <p className="text-text-secondary text-xs md:text-sm">Create, edit, or delete syllabus modules for students.</p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition-all shadow-sm" 
          onClick={addNew}
        >
          <Plus size={18} /> Add New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="p-6 rounded-2xl bg-bg-color border border-border-color shadow-sm flex flex-col gap-3 relative hover:shadow-md transition-shadow text-left overflow-hidden">
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="-mx-6 -mt-6 mb-3 h-36 overflow-hidden">
                <img
                  src={course.thumbnail.startsWith('http') ? course.thumbnail : `${course.thumbnail}`}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
            {course.popular === 1 && (
              <span className="absolute top-3 right-3 bg-accent z-50 text-text-primary px-3 py-1 rounded-full text-xxs font-extrabold shadow-sm border border-amber-200">
                Popular
              </span>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary text-xs md:text-sm">{course.grade}</span>
              <span className="font-semibold text-text-secondary bg-bg-secondary px-2 py-0.5 rounded text-xs">{course.price}</span>
            </div>
            <h3 className="font-display font-bold text-lg text-text-primary m-0">{course.title}</h3>
            <p className="text-text-secondary text-xs md:text-sm grow leading-relaxed">{course.description}</p>
            <div className="flex gap-2 mt-4 pt-4 border-t border-border-color">
              <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-secondary text-primary font-bold text-xs rounded-lg hover:bg-primary-light hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleEdit(course)}>
                <Edit2 size={14} /> Edit
              </button>
              {course.quiz_required === 1 && (
                <button 
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg hover:bg-emerald-500 hover:text-white transition-all border-0 grow cursor-pointer" 
                  onClick={() => navigate(`/admin/courses/${course.id}/quiz`)}
                >
                  <HelpCircle size={14} /> Quiz
                </button>
              )}
              <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 font-bold text-xs rounded-lg hover:bg-red-500 hover:text-white transition-all border-0 grow cursor-pointer" onClick={() => handleDelete(course)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog for Add/Edit Form */}
      {editingId !== null && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-bg-color rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">
            
            {/* Header: Sticky */}
            <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary m-0">
                {editingId === 'new' ? 'Add New Course' : 'Edit Course'}
              </h3>
              <button 
                onClick={() => setEditingId(null)}
                className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Form Body: Scrollable */}
            <form onSubmit={handleSubmit} className="grow flex flex-col overflow-hidden">
              <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">
                
                {/* Level and Price side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Grade / Level</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Grade 12" 
                      value={formData.grade} 
                      onChange={e => setFormData({...formData, grade: e.target.value})} 
                      required 
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Price</label>
                    <input 
                      type="text" 
                      placeholder="Price (e.g. Rs. 2,500/mo)" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      required 
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Course Title</label>
                  <input 
                    type="text" 
                    placeholder="Course Title" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Description</label>
                  <textarea 
                    placeholder="Description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    required 
                    rows={3} 
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Course Features</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={feature}
                          onChange={e => {
                            const newFeatures = [...formData.features];
                            newFeatures[index] = e.target.value;
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          placeholder="e.g. Video Lectures"
                          className="grow p-2.5 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.features.filter((_, idx) => idx !== index);
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="p-2.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all border-0 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, features: [...formData.features, ''] });
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-secondary text-primary font-bold text-xs rounded-lg hover:bg-primary-light hover:text-white transition-all border-0 cursor-pointer mt-1 self-start"
                  >
                    <Plus size={14} /> Add Feature
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Google Drive Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={Array.isArray(formData.external_drive_links) ? (formData.external_drive_links[0] || '') : (formData.external_drive_links || '')}
                    onChange={e => {
                      setFormData({ ...formData, external_drive_links: [e.target.value] });
                    }}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full p-2.5 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    required
                  />
                  <p className="text-[11px] text-text-tertiary">
                    This link will open directly when enrolled students click "Go to Video Lectures".
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Certificate Price</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 500" 
                      value={formData.certificate_price} 
                      onChange={e => setFormData({...formData, certificate_price: e.target.value})} 
                      required 
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer py-1 select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.quiz_required} 
                        onChange={e => setFormData({...formData, quiz_required: e.target.checked})} 
                        className="rounded border-border-color text-primary focus:ring-primary"
                      />
                      <span>Quiz Required to Complete Course?</span>
                    </label>
                  </div>
                </div>
                
                {/* Thumbnail Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Course Thumbnail</label>
                  <div
                    className="border-2 border-dashed border-border-color hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-colors bg-bg-secondary/40 relative cursor-pointer"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setThumbnailFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setThumbnailPreview(ev.target.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-28 object-cover rounded-xl" />
                    ) : formData.thumbnail ? (
                      <img
                        src={formData.thumbnail.startsWith('http') ? formData.thumbnail : `${formData.thumbnail}`}
                        alt="Current thumbnail"
                        className="w-full h-28 object-cover rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <>
                        <ImagePlus size={24} className="text-text-tertiary" />
                        <p className="text-xs text-text-secondary font-semibold">Click to upload a thumbnail image</p>
                        <p className="text-[10px] text-text-tertiary">PNG, JPG, GIF, WebP, SVG — up to 10 MB</p>
                      </>
                    )}
                    {(thumbnailPreview || formData.thumbnail) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setThumbnailFile(null); setThumbnailPreview(null); setFormData(prev => ({ ...prev, thumbnail: null })); }}
                        className="absolute top-2 right-2 p-1 bg-bg-color rounded-full shadow border border-border-color text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {thumbnailUploading && (
                    <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading thumbnail...</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer py-1 select-none">
                  <input 
                    type="checkbox" 
                    checked={formData.popular} 
                    onChange={e => setFormData({...formData, popular: e.target.checked})} 
                    className="rounded border-border-color text-primary focus:ring-primary"
                  />
                  <span>Mark as "Most Popular"</span>
                </label>
              </div>
              
              {/* Footer: Sticky */}
              <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all">
                  <Save size={16} /> Save
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 border-0 grow cursor-pointer" onClick={() => setEditingId(null)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-bg-color rounded-3xl p-6 md:p-8 shadow-2xl border border-border-color flex flex-col gap-4 text-left animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle size={24} />
            </div>
            
            <h3 className="font-display font-bold text-lg text-text-primary">
              Confirm Deletion
            </h3>
            
            <p className="text-text-secondary text-sm leading-relaxed">
              Are you sure you want to permanently delete the course <span className="font-semibold text-text-primary">"{deleteConfirmName}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleConfirmDelete} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
              >
                Delete Course
              </button>
              <button 
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary hover:bg-slate-200 text-text-secondary font-bold text-sm rounded-lg border-0 grow cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
