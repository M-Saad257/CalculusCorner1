import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Handshake, X, Briefcase, Mail, User, ShieldAlert, Loader2, Sparkles, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { useDialog } from '../../context/DialogContext';
import Button from '../ui/Button';
import api from '../../services/api';
import { createPortal } from 'react-dom';
import { useSocket } from '../../hooks/useSocket';

// detailed card visual layout
const PartnerDetailCard = ({ collab }) => {
  return (
    <div className="w-full max-w-lg bg-bg-color dark:bg-slate-900 border border-border-color rounded-3xl p-6 md:p-8 text-left shadow-2xl flex flex-col gap-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      
      <div>
        <span className="font-display font-extrabold text-sm text-text-primary tracking-tight block relative">
          Our Active Partner
          <span className="absolute bottom-[-6px] left-0 w-8 h-[2px] bg-primary rounded-full" />
        </span>
      </div>

      <div className="flex gap-4 items-center mt-2">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-bg-secondary flex items-center justify-center border border-border-color/60 p-2 shrink-0 shadow-inner">
          <img
            src={
              collab.logoUrl
                ? (collab.logoUrl.startsWith('http')
                  ? collab.logoUrl
                  : `${import.meta.env.VITE_BACKEND_URL || ''}${collab.logoUrl}`)
                : '/Final.webp'
            }
            alt={collab.businessName}
            className="w-full h-full object-contain pointer-events-none"
            onError={(e) => { e.target.src = '/Final.webp'; }}
          />
        </div>
        <div className="grow text-left">
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="font-display font-bold text-base text-text-primary tracking-tight leading-none">{collab.businessName}</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wide">
              Active Partner
            </span>
          </div>
          <p className="text-[9px] font-extrabold text-primary uppercase tracking-widest mt-1">
            {collab.businessNiche}
          </p>
        </div>
      </div>

      <div className="text-xs text-text-secondary leading-relaxed bg-bg-secondary/40 p-4 border border-border-color/50 rounded-2xl">
        {collab.description || collab.message || `${collab.businessName} is our trusted partner, helping us enhance our learning experience and reach more learners worldwide.`}
      </div>
    </div>
  );
};

const Collaboration = () => {
  const { content } = useContent();
  const { showToast } = useDialog();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  // Slider State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const containerRef = useRef(null);
  const logoInputRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const collabSettings = content?.collaboration || {
    title: 'Work Together & Collaborate',
    subtitle: 'Collaboration & Partnerships',
    description: 'Interested in partnering with Calculus Corner? We collaborate with educational institutions, businesses, and content developers. Click below to submit your details and proposal.',
    buttonText: 'Want to Collaborate?'
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    businessName: '',
    businessNiche: '',
    message: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active visible collaborators
  const [collaborators, setCollaborators] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  const fetchActiveCollaborators = async () => {
    try {
      const res = await api.get('/collaborations');
      if (res.data && res.data.success) {
        setCollaborators(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load active collaborators:', err);
    } finally {
      setLoadingCollabs(false);
    }
  };

  useEffect(() => {
    fetchActiveCollaborators();
  }, []);

  // Listen to collaboration events
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchActiveCollaborators();
    };
    socket.on('collaboration:update', handleUpdate);
    socket.on('collaboration:delete', handleUpdate);
    socket.on('collaboration:create', handleUpdate);
    return () => {
      socket.off('collaboration:update', handleUpdate);
      socket.off('collaboration:delete', handleUpdate);
      socket.off('collaboration:create', handleUpdate);
    };
  }, [socket]);

  // Reset index if collaborators count changes
  useEffect(() => {
    if (currentIndex >= collaborators.length) {
      setCurrentIndex(0);
    }
  }, [collaborators]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Logo file size must not exceed 5MB.', 'error');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = () => {
    setForm({ name: '', email: '', businessName: '', businessNiche: '', message: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.businessName.trim() || !form.businessNiche.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    if (!logoFile) {
      showToast('Please upload a business logo.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formDataPayload = new FormData();
      formDataPayload.append('name', form.name);
      formDataPayload.append('email', form.email);
      formDataPayload.append('businessName', form.businessName);
      formDataPayload.append('businessNiche', form.businessNiche);
      formDataPayload.append('message', form.message);
      if (logoFile) {
        formDataPayload.append('logo', logoFile);
      }

      const res = await api.post('/collaborations', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        showToast('Collaboration request submitted successfully!', 'success');
        setIsOpen(false);
      } else {
        showToast(res.data?.message || 'Failed to submit request.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const paginate = (newDirection) => {
    if (collaborators.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = collaborators.length - 1;
      if (nextIndex >= collaborators.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 120 : -120,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 120 : -120,
      opacity: 0
    })
  };

  const hasCollaborators = collaborators.length > 0;

  return (
    <section 
      id="collaboration" 
      className="py-10 bg-bg-secondary/30 backdrop-blur-[2px] relative overflow-hidden px-4 md:px-12" 
      ref={containerRef}
    >
      {/* Decorative Background Glow */}
      {hasCollaborators && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      )}

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {!hasCollaborators ? (
          // Center layout if no active visible collaborators
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
              <Handshake size={24} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary">
                {collabSettings.subtitle}
              </span>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                {collabSettings.title}
              </h2>
            </div>

            <p className="text-text-secondary text-xs md:text-sm leading-relaxed max-w-lg">
              {collabSettings.description}
            </p>

            <Button 
              variant="primary" 
              size="md" 
              onClick={handleOpenModal}
              className="font-bold flex items-center gap-2 cursor-pointer shadow-sm rounded-xl mt-1 px-6 py-3 text-xs"
            >
              <Handshake size={15} />
              <span>{collabSettings.buttonText}</span>
            </Button>
          </motion.div>
        ) : (
          // Split screen layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Description and want to collaborate button */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start gap-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
                <Handshake size={24} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary">
                  {collabSettings.subtitle}
                </span>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                  {collabSettings.title}
                </h2>
              </div>

              <p className="text-text-secondary text-xs md:text-sm leading-relaxed">
                {collabSettings.description}
              </p>

              <Button 
                variant="primary" 
                size="md" 
                onClick={handleOpenModal}
                className="font-bold flex items-center gap-2 cursor-pointer shadow-sm rounded-xl mt-1 px-6 py-3 text-xs"
              >
                <Handshake size={15} />
                <span>{collabSettings.buttonText}</span>
              </Button>
            </motion.div>

            {/* Right Column: Collaborator detailed card / slider */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 w-full flex flex-col items-center lg:items-end justify-center"
            >
              {collaborators.length === 1 ? (
                // Single Active Partner Card
                <PartnerDetailCard collab={collaborators[0]} />
              ) : (
                // Swipeable Slider for Multiple Active Partners
                <div className="w-full max-w-lg flex flex-col items-center">
                  <div className="relative w-full flex items-center justify-center min-h-[290px] py-4">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 350, damping: 33 }, opacity: { duration: 0.15 } }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.6}
                        onDragEnd={(e, { offset }) => {
                          const swipeThreshold = 55;
                          if (offset.x < -swipeThreshold) {
                            paginate(1); // Swipe left -> next partner
                          } else if (offset.x > swipeThreshold) {
                            paginate(-1); // Swipe right -> previous partner
                          }
                        }}
                        className="w-full cursor-grab active:cursor-grabbing select-none"
                      >
                        <PartnerDetailCard collab={collaborators[currentIndex]} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Arrows and Dot Indicators */}
                  <div className="flex items-center justify-center gap-5 mt-6 w-full max-w-lg">
                    <button
                      className="bg-bg-color border border-border-color/80 w-9 h-9 rounded-full flex items-center justify-center text-text-primary cursor-pointer hover:bg-bg-secondary hover:text-primary hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
                      onClick={() => paginate(-1)}
                      aria-label="Previous partner"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex gap-1.5">
                      {collaborators.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full border-0 cursor-pointer transition-all duration-300 ${
                            index === currentIndex ? 'bg-primary w-4.5' : 'bg-border-color/90'
                          }`}
                          onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                          }}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      className="bg-bg-color border border-border-color/80 w-9 h-9 rounded-full flex items-center justify-center text-text-primary cursor-pointer hover:bg-bg-secondary hover:text-primary hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
                      onClick={() => paginate(1)}
                      aria-label="Next partner"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Modal Form Dialog */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-fadeIn">
              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-lg bg-bg-color rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[96vh] text-left overflow-hidden animate-fadeIn"
              >
                {/* Header: Sticky */}
                <div className="p-5 border-b border-border-color flex justify-between items-center shrink-0">
                  <h3 className="font-display font-bold text-xl text-text-primary m-0">
                    Partnership Proposal
                  </h3>
                  <button
                    disabled={submitting}
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-bg-secondary hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Body: Scrollable */}
                <form onSubmit={handleSubmit} className="grow flex flex-col overflow-hidden">
                  <div className="grow p-5 overflow-y-auto flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Your Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="e.g. Sami Ullah"
                          required
                          className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-transparent text-text-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="e.g. sami@business.com"
                          required
                          className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-transparent text-text-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Business Name *</label>
                        <input
                          type="text"
                          name="businessName"
                          value={form.businessName}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="e.g. EdTech Company"
                          required
                          className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-transparent text-text-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Business Niche *</label>
                        <input
                          type="text"
                          name="businessNiche"
                          value={form.businessNiche}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="e.g. E-Learning, Publisher"
                          required
                          className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-transparent text-text-primary"
                        />
                      </div>
                    </div>

                    {/* Logo File Selector Upload Field */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary uppercase">Business Logo *</label>
                      <div 
                        className="border-2 border-dashed border-border-color hover:border-primary/50 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 transition-colors bg-bg-secondary/40 relative cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {logoPreview ? (
                          <div className="relative w-full h-14">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-lg pointer-events-none" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }}
                              className="absolute -top-1.5 -right-1.5 p-1 bg-bg-color rounded-full shadow border border-border-color text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImagePlus size={22} className="text-text-tertiary" />
                            <span className="text-xs font-semibold text-text-secondary">Click to upload business logo</span>
                            <span className="text-[10px] text-text-tertiary">PNG, JPG, WebP, SVG — max 5MB</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-text-secondary uppercase">Proposal / Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        disabled={submitting}
                        rows={2}
                        placeholder="Describe how you would like to collaborate..."
                        className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none bg-transparent text-text-primary"
                      />
                    </div>
                  </div>

                  {/* Footer: Sticky */}
                  <div className="p-4 md:p-5 pt-3 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Handshake size={14} />
                          <span>Submit Proposal</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white border-0 grow cursor-pointer"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};

export default Collaboration;
