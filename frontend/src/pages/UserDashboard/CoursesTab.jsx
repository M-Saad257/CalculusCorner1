import React, { useState, useRef, useCallback } from 'react';
import { CheckCircle2, Star, BookOpen, Loader2, CreditCard, Building, User, X, Upload, Camera, ArrowRight, ArrowLeft, Clock, Shield, Bell, CheckCheck, Image, Copy, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useContent } from '../../context/ContentContext';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';

// Step definitions for the enrollment flow
const STEPS = [
  { id: 1, label: 'Bank Transfer', icon: CreditCard, desc: 'Transfer payment to our bank account' },
  { id: 2, label: 'Upload Receipt', icon: Upload, desc: 'Upload your payment screenshot' },
  { id: 3, label: 'Confirmation', icon: Bell, desc: 'Submit and await approval' },
];

const CoursesTab = ({ courses, enrolledCourses = [], setActiveTab, setSelectedCourseForDetail, loading }) => {
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
        <Loader text="Loading courses..." />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-primary" />
            <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
              Syllabus <span className="text-gradient">Courses</span>
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">Browse and enroll in available calculus courses below.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-border-color shadow-sm text-center">
          <BookOpen size={48} className="mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">No Courses Available</h3>
          <p className="text-text-secondary">There are currently no courses published in the system.</p>
        </div>
      </div>
    );
  }

  const { content } = useContent();
  const { showToast } = useDialog();
  const bankDetails = content?.bank_details || {};

  const [enrollModalCourse, setEnrollModalCourse] = useState(null);
  const [enrollStep, setEnrollStep] = useState(1);
  const [enrolling, setEnrolling] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleEnrollClick = (course) => {
    setEnrollModalCourse(course);
    setEnrollStep(1);
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleCloseModal = () => {
    setEnrollModalCourse(null);
    setEnrollStep(1);
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showToast('Please upload an image (JPG, PNG, WEBP) or PDF file.', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('File size must be under 25MB.', 'error');
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview('pdf');
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleConfirmPayment = async () => {
    if (!enrollModalCourse) return;
    try {
      setEnrolling(true);
      const formData = new FormData();
      formData.append('courseId', enrollModalCourse.id);
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }
      const res = await api.post('/student/enroll', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        if (res.data.alreadyEnrolled) {
          showToast(res.data.message || 'You are already enrolled in this course.', 'info');
          handleCloseModal();
        } else {
          setEnrollStep(4); // success state
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit enrollment. Please try again.', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-primary" />
          <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
            Syllabus <span className="text-gradient">Courses</span>
          </h1>
        </div>
        <p className="text-text-secondary text-sm mt-1">
          Select your grade and start mastering concepts with our expert-led, comprehensive curriculum.
        </p>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isPopular = !!course.popular;
          const isHighlight = !!course.highlight;

          return (
            <div
              key={course.id}
              className={`group relative flex flex-col p-7 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${isHighlight
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white border-0 shadow-xl shadow-primary/20'
                : isPopular
                  ? 'bg-white dark:bg-slate-900 border-2 border-primary shadow-lg'
                  : 'bg-white dark:bg-slate-900 border-border-color shadow-md hover:shadow-lg hover:border-primary/30'
                }`}
            >
              {/* Most Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap z-10">
                  <Star size={12} className="fill-text-primary text-text-primary" /> Most Popular
                </div>
              )}

              {/* Thumbnail */}
              {course.thumbnail && (
                <div className="-mx-8 -mt-8 mb-6 h-40 overflow-hidden rounded-t-[calc(1.5rem-1px)] relative">
                  <img
                    src={course.thumbnail.startsWith('http') ? course.thumbnail : `${course.thumbnail}`}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Header */}
              <div className={`mb-6 pb-5 border-b ${isHighlight ? 'border-white/20' : 'border-border-color'}`}>
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${isHighlight ? 'bg-white dark:bg-slate-900/ text-white' : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                >
                  {course.grade}
                </span>
                <h3 className="font-display font-bold text-lg leading-snug mb-3">{course.title}</h3>
                {course.description && (
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isHighlight ? 'text-white/80' : 'text-text-secondary'}`}>
                    {course.description}
                  </p>
                )}
                {course.price && (
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="font-display font-extrabold text-2xl">{course.price}</span>
                    <span className={`text-xs font-medium ${isHighlight ? 'text-white/70' : 'text-text-secondary'}`}>
                      {course.period || '/month'}
                    </span>
                  </div>
                )}
              </div>

              {/* Features List */}
              {Array.isArray(course.features) && course.features.length > 0 && (
                <div className="grow mb-6">
                  <ul className="list-none p-0 m-0 flex flex-col gap-3">
                    {course.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm font-medium">
                        <CheckCircle2
                          size={16}
                          className={`shrink-0 mt-0.5 ${isHighlight ? 'text-accent' : 'text-primary'}`}
                        />
                        <span className={isHighlight ? 'text-white/90' : 'text-text-secondary'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              {(() => {
                const enrollment = enrolledCourses.find(e => e.course_id === course.id);
                if (enrollment) {
                  if (enrollment.status === 'pending_payment') {
                    return (
                      <Button
                        variant="outline"
                        fullWidth
                        disabled
                        className="mt-auto border-amber-200 text-amber-600 bg-amber-50 opacity-100 font-bold"
                      >
                        Pending Approval
                      </Button>
                    );
                  }
                  return (
                    <Button
                      variant="primary"
                      fullWidth
                      disabled
                      className="mt-auto bg-emerald-500 border-0 opacity-100 !cursor-not-allowed"
                    >
                      <CheckCircle2 size={16} className="mr-1.5 inline" /> Enrolled!
                    </Button>
                  );
                }

                return (
                  <Button
                    variant={isPopular || isHighlight ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handleEnrollClick(course)}
                    className={`mt-auto ${isHighlight ? 'bg-white dark:bg-slate-900 text-primary border-0 hover:bg-bg-secondary hover:text-primary-dark shadow-md' : ''}`}
                  >
                    Enroll Now
                  </Button>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Professional Multi-Step Enrollment Modal */}
      {enrollModalCourse && (
        <div className="fixed inset-0 z-[1001000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg mb-10 max-h-[75vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden text-left flex flex-col my-auto">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-color flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent shrink-0">
              <div className="flex items-center gap-2 txext-primary">
                <CreditCard size={20} />
                <h3 className="font-display font-bold text-lg m-0">Course Enrollment</h3>
              </div>
              {enrollStep !== 4 && (
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 text-text-tertiary hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white hover:text-text-primary rounded-full border-0 cursor-pointer transition-colors bg-transparent"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step Progress Bar (only for steps 1-3) */}
            {enrollStep <= 3 && (
              <div className="px-6 py-3 bg-bg-secondary/50 border-b border-border-color shrink-0">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, idx) => {
                    const isActive = step.id === enrollStep;
                    const isDone = step.id < enrollStep;
                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isDone ? 'bg-primary text-white' : isActive ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-slate-200 dark:bg-slate-700 text-text-tertiary'}`}>
                            {isDone ? <CheckCheck size={14} /> : step.id}
                          </div>
                          <span className={`text-[10px] font-semibold text-center leading-tight ${isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-text-tertiary'}`}>
                            {step.label}
                          </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-all duration-500 ${enrollStep > step.id ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 flex-1 overflow-y-auto cc-scroll flex flex-col gap-6">
              {/* Course Summary Always Visible */}
              {enrollStep <= 3 && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Enrolling In</p>
                    <p className="font-display font-bold text-text-primary text-sm">{enrollModalCourse.title}</p>
                    <p className="text-primary font-extrabold text-lg">{enrollModalCourse.price}</p>
                  </div>
                </div>
              )}

              {/* ─── STEP 1: Bank Transfer Instructions ─── */}
              {enrollStep === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="font-bold text-text-primary text-base mb-1">Step 1: Transfer Payment</h4>
                    <p className="text-text-secondary text-sm">Please send the exact amount to the bank account below. Keep your payment receipt handy — you'll need to upload it in the next step.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-border-color rounded-2xl p-4 md:p-5 flex flex-col gap-3">
                    <p className="text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider">Bank Account Details</p>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between py-2 border-b border-border-color/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <Building size={16} className="text-primary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary">Bank Name</span>
                            <span className="text-sm font-semibold text-text-primary">{bankDetails.bank_name || 'Not Configured'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-border-color/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <User size={16} className="text-primary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary">Account Name</span>
                            <span className="text-sm font-semibold text-text-primary">{bankDetails.account_name || 'Not Configured'}</span>
                          </div>
                        </div>
                        {bankDetails.account_name && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(bankDetails.account_name);
                              showToast('Account name copied!', 'success');
                            }}
                            className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                            title="Copy Account Name"
                          >
                            <Copy size={15} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <CreditCard size={16} className="text-primary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary">Account Number / IBAN</span>
                            <span className="text-sm font-extrabold text-primary font-mono tracking-tight select-all">{bankDetails.account_number || 'Not Configured'}</span>
                          </div>
                        </div>
                        {bankDetails.account_number && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(bankDetails.account_number);
                              showToast('Account number copied!', 'success');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer border-0"
                            title="Copy Account Number"
                          >
                            <Copy size={13} /> Copy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">What Happens Next?</p>
                    {[
                      { icon: Upload, text: 'Upload your payment screenshot as proof of transfer' },
                      { icon: Clock, text: 'Admin reviews and approves your enrollment (usually within 24h)' },
                      { icon: Shield, text: 'You receive full course access upon approval' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon size={12} className="text-primary" />
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <Button variant="primary" fullWidth onClick={() => setEnrollStep(2)} className="flex items-center justify-center gap-2">
                    I've Paid — Upload Receipt <ArrowRight size={16} />
                  </Button>
                </div>
              )}

              {/* ─── STEP 2: Upload Receipt ─── */}
              {enrollStep === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="font-bold text-text-primary text-base mb-1">Step 2: Upload Payment Receipt</h4>
                    <p className="text-text-secondary text-sm">Take a screenshot of your payment confirmation and upload it here. This helps us verify your payment quickly.</p>
                  </div>

                  {/* Drag & Drop Upload Area */}
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : receiptFile ? 'border-primary/40 bg-primary/3' : 'border-border-color hover:border-primary/50 hover:bg-primary/3'}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />

                    {receiptPreview && receiptPreview !== 'pdf' ? (
                      <div className="flex flex-col items-center gap-3">
                        <img src={receiptPreview} alt="Receipt preview" className="max-h-40 rounded-xl object-contain border border-border-color shadow-sm" />
                        <p className="text-xs text-text-secondary font-medium">{receiptFile?.name}</p>
                        <p className="text-xs text-primary font-semibold">Click to change</p>
                      </div>
                    ) : receiptPreview === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <Image size={24} className="text-red-500" />
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{receiptFile?.name}</p>
                        <p className="text-xs text-primary font-semibold">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-primary text-white' : 'bg-primary/10'}`}>
                          <Camera size={24} className={isDragging ? 'text-white' : 'text-primary'} />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-sm">Drag & drop your receipt here</p>
                          <p className="text-xs text-text-secondary mt-1">or click to browse files</p>
                        </div>
                        <p className="text-[11px] text-text-tertiary">Supports JPG, PNG, WEBP, PDF · Max 25MB</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setEnrollStep(1)} className="flex items-center justify-center gap-2 border-border-color text-text-secondary hover:bg-bg-secondary">
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setEnrollStep(3)}
                      className="flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight size={16} />
                    </Button>
                  </div>
                  <p className="text-center text-xs text-text-tertiary">Receipt is optional but helps speed up approval</p>
                </div>
              )}

              {/* ─── STEP 3: Confirm & Submit ─── */}
              {enrollStep === 3 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="font-bold text-text-primary text-base mb-1">Step 3: Confirm Submission</h4>
                    <p className="text-text-secondary text-sm">Please review your enrollment details before submitting. Our team will verify your payment and grant you access.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-color p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary font-medium">Course</span>
                      <span className="font-bold text-text-primary">{enrollModalCourse.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-border-color pt-3">
                      <span className="text-text-secondary font-medium">Amount</span>
                      <span className="font-extrabold text-primary">{enrollModalCourse.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-border-color pt-3">
                      <span className="text-text-secondary font-medium">Receipt</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${receiptFile ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {receiptFile ? `✓ ${receiptFile.name}` : 'No file attached'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                    <Shield size={14} className="shrink-0 mt-0.5" />
                    <span>Your enrollment is secure. Once approved by admin, you'll receive an instant in-app notification with full course access.</span>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleConfirmPayment}
                    disabled={enrolling}
                    className="flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 size={18} /> Submit Enrollment Request</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setEnrollStep(2)}
                    disabled={enrolling}
                    className="border-border-color text-text-secondary hover:bg-bg-secondary flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                </div>
              )}

              {/* ─── STEP 4: Success State ─── */}
              {enrollStep === 4 && (
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping bg-emerald-200 opacity-40" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xl text-text-primary mb-2">Enrollment Submitted!</h4>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
                      Your enrollment request for <strong>{enrollModalCourse.title}</strong> has been submitted successfully. Our admin team will review your payment and notify you once approved.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full text-left p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-color">
                    {[
                      '✓ Payment receipt received',
                      '⏳ Admin review in progress (usually within 24h)',
                      '🔔 You\'ll get an instant notification when approved',
                    ].map((item, i) => (
                      <p key={i} className="text-xs text-text-secondary">{item}</p>
                    ))}
                  </div>
                  <Button variant="primary" fullWidth onClick={handleCloseModal}>
                    Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesTab;
