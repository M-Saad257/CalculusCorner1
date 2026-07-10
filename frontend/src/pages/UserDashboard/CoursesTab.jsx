import React, { useState } from 'react';
import { CheckCircle2, Star, BookOpen, Loader2, CreditCard, Building, User, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useContent } from '../../context/ContentContext';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';

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
          <p className="text-text-secondary text-sm mt-1">
            Browse and enroll in available calculus courses below.
          </p>
        </div>
        <div className="bg-white p-12 rounded-3xl border border-border-color shadow-sm text-center">
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
  const [enrolling, setEnrolling] = useState(false);

  const handleEnrollClick = (course) => {
    setEnrollModalCourse(course);
  };

  const handleConfirmPayment = async () => {
    if (!enrollModalCourse) return;
    try {
      setEnrolling(true);
      const res = await api.post('/student/enroll', { courseId: enrollModalCourse.id });
      if (res.data?.success) {
        if (res.data.alreadyEnrolled) {
          showToast(res.data.message || 'You are already enrolled in this course.', 'info');
        } else {
          showToast('Payment confirmed! Your enrollment is pending admin approval.', 'success');
        }
        setEnrollModalCourse(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit payment. Please try again.', 'error');
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
                  ? 'bg-white border-2 border-primary shadow-lg'
                  : 'bg-white border-border-color shadow-md hover:shadow-lg hover:border-primary/30'
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
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${isHighlight ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary border border-primary/20'
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
                    className={`mt-auto ${isHighlight ? 'bg-white text-primary border-0 hover:bg-bg-secondary hover:text-primary-dark shadow-md' : ''}`}
                  >
                    Enroll Now
                  </Button>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {enrollModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto cc-scroll text-left flex flex-col">
            <div className="px-6 py-5 border-b border-border-color flex items-center justify-between bg-bg-secondary/30 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-primary">
                <CreditCard size={20} />
                <h3 className="font-display font-bold text-lg m-0">Course Enrollment</h3>
              </div>
              <button
                onClick={() => setEnrollModalCourse(null)}
                className="p-1.5 text-text-tertiary hover:bg-slate-200 hover:text-text-primary rounded-full border-0 cursor-pointer transition-colors bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="text-center">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Amount</p>
                <p className="font-display font-black text-3xl text-primary">{enrollModalCourse.price}</p>
                <p className="text-xs text-text-tertiary mt-2">for {enrollModalCourse.title}</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col gap-4">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider m-0">Admin Bank Details</p>
                <p className="text-sm text-blue-900 leading-relaxed m-0">Please transfer the amount to the following account to complete your enrollment.</p>

                <div className="flex flex-col gap-3 bg-white/60 p-4 rounded-xl border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <Building size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Bank Name</span>
                      <span className="text-sm font-semibold text-blue-950">{bankDetails.bank_name || 'Not Configured'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Account Name</span>
                      <span className="text-sm font-semibold text-blue-950">{bankDetails.account_name || 'Not Configured'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Account Number</span>
                      <span className="text-sm font-semibold text-blue-950 font-mono tracking-tight">{bankDetails.account_number || 'Not Configured'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleConfirmPayment}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <><Loader2 size={18} className="animate-spin mr-2" /> Processing...</>
                  ) : 'I have paid'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setEnrollModalCourse(null)}
                  disabled={enrolling}
                  className="border-border-color text-text-secondary hover:bg-bg-secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesTab;
