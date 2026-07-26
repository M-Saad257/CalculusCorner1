import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, Play, CheckCircle2, Award, FileText, Loader2, CreditCard, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import Button from '../../components/ui/Button';
import { useDialog } from '../../context/DialogContext';
import { useContent } from '../../context/ContentContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const CourseDetailTab = ({ course, student, setActiveTab, setSelectedCourseForDetail }) => {
  const [loading, setLoading] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingCertificate, setPayingCertificate] = useState(false);

  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showNameEntryModal, setShowNameEntryModal] = useState(false);
  const [certNameInput, setCertNameInput] = useState('');
  const [localCertStatus, setLocalCertStatus] = useState(course?.certificate_status || 'none');
  const certificateRef = useRef(null);

  const { socket } = useSocket();

  const fetchEnrollmentStatus = async () => {
    if (!course) return;
    try {
      const res = await api.get('/student/enrollments');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const matching = res.data.data.find(e => String(e.course_id || e.id) === String(course.course_id || course.id));
        if (matching) {
          setLocalCertStatus(matching.certificate_status || 'none');
        }
      }
    } catch (e) { }
  };

  useEffect(() => {
    if (course) {
      setLocalCertStatus(course.certificate_status || 'none');
      fetchEnrollmentStatus();
    }
  }, [course]);

  useEffect(() => {
    if (!socket || !course) return;
    const handleUpdate = () => {
      fetchEnrollmentStatus();
    };
    socket.on('enrollment:updated', handleUpdate);
    socket.on('certificate:issued', handleUpdate);
    return () => {
      socket.off('enrollment:updated', handleUpdate);
      socket.off('certificate:issued', handleUpdate);
    };
  }, [socket, course]);

  const { content } = useContent();
  const bankDetails = content?.bank_details || {};
  const { showToast } = useDialog();

  useEffect(() => {
    const loadCourseDetails = async () => {
      try {
        setLoading(true);
        // Fetch quiz if required
        if (course.quiz_required === 1) {
          const res = await api.get(`/student/courses/${course.course_id || course.id}/quiz`);
          if (res.data?.success) {
            setQuizQuestions(res.data.data || []);
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    if (course) {
      loadCourseDetails();
    }
  }, [course]);

  const handleStartQuiz = () => {
    setTakingQuiz(true);
  };

  const handleSubmitQuiz = async () => {
    try {
      const formattedAnswers = quizQuestions.map((q, idx) => ({
        questionId: idx, // We don't have DB IDs for questions, so index
        selectedAnswer: quizAnswers[idx] || ''
      }));

      const res = await api.post(`/student/courses/${course.course_id || course.id}/quiz/submit`, {
        answers: formattedAnswers
      });

      if (res.data?.success) {
        setQuizResult(res.data.data);
        setTakingQuiz(false);
        showToast(`Quiz completed! Score: ${res.data.data.score}%`, 'success');

        // Refresh course to get updated certificate status
        // For simplicity, we just update local state if they got 100% and it gives a free cert or changes status
      }
    } catch (err) {
      showToast('Failed to submit quiz', 'error');
    }
  };

  const handlePayCertificate = async () => {
    try {
      setPayingCertificate(true);
      const res = await api.post(`/student/courses/${course.course_id || course.id}/certificate/pay`);
      if (res.data?.success) {
        showToast('Payment confirmed! Admin will verify and issue your certificate.', 'success');
        setPaymentModalOpen(false);
        setLocalCertStatus('pending_payment');
      }
    } catch (err) {
      showToast('Failed to confirm payment', 'error');
    } finally {
      setPayingCertificate(false);
    }
  };

  const handleViewCertificate = () => {
    setCertNameInput(student?.name?.replace(/\s/g, '').substring(0, 10) || '');
    setShowNameEntryModal(true);
  };

  const downloadFromModal = async () => {
    if (!certificateRef.current) return;
    try {
      showToast('Generating certificate...', 'info');

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // High quality
        useCORS: true,
        backgroundColor: null
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `CalculusCorner_Certificate_${course.title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Certificate downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to generate certificate image', 'error');
    }
  };

  if (!course) return null;

  const driveLinks = Array.isArray(course.external_drive_links)
    ? course.external_drive_links
    : (typeof course.external_drive_links === 'string' ? JSON.parse(course.external_drive_links) : []);

  // Determine certificate state
  const hasCompletedCourse = quizResult && quizResult.passed || localCertStatus !== 'none';
  const certStatus = localCertStatus; // none, pending_payment, issued

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-left animate-fadeIn">
      <button
        onClick={() => {
          setSelectedCourseForDetail(null);
          setActiveTab('overview');
        }}
        className="flex items-center gap-2 text-text-secondary hover:text-primary font-semibold text-sm self-start cursor-pointer border-0 bg-transparent"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border-color shadow-sm flex flex-col gap-6">
        <div>
          <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
            {course.grade}
          </span>
          <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary mt-4 mb-2">
            {course.title}
          </h1>
          <p className="text-text-secondary">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-color/50">
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <FileText size={20} className="text-primary" /> Course Materials
            </h3>
            {driveLinks && driveLinks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {driveLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-bg-secondary hover:bg-primary-light/10 border border-border-color rounded-xl group transition-all"
                  >
                    <span className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">Google Drive Link {idx + 1}</span>
                    <ExternalLink size={16} className="text-text-tertiary group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary italic">No external materials provided for this course.</p>
            )}

            <Button
              variant="outline"
              className="mt-2 w-max bg-primary text-white border-0 hover:bg-primary-dark shadow-sm"
              onClick={() => {
                const driveLink = Array.isArray(driveLinks) && driveLinks.length > 0
                  ? driveLinks[0]
                  : (typeof course?.external_drive_links === 'string' && course.external_drive_links.startsWith('http'))
                    ? course.external_drive_links
                    : null;

                if (driveLink) {
                  window.open(driveLink, '_blank', 'noopener,noreferrer');
                } else {
                  setActiveTab('videos');
                }
              }}
            >
              <Play size={16} className="mr-2" /> Go to Video Lectures
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Completion & Quiz
            </h3>

            {course.quiz_required === 1 ? (
              <div className="p-5 bg-slate-50 border border-border-color rounded-2xl flex flex-col gap-4">
                {localCertStatus === 'issued' ? (
                  <div className="text-center flex flex-col items-center gap-3">
                    <Award size={48} className="text-amber-400 drop-shadow-md" />
                    <div>
                      <h4 className="font-bold text-text-primary">Course Completed!</h4>
                      <p className="text-sm text-text-secondary">You have earned your certificate.</p>
                    </div>
                    <Button variant="primary" onClick={handleViewCertificate}>
                      <Award size={16} className="mr-2" /> View Certificate
                    </Button>
                  </div>
                ) : localCertStatus === 'pending_payment' ? (
                  <div className="text-center flex flex-col items-center gap-3">
                    <CreditCard size={48} className="text-blue-400" />
                    <div>
                      <h4 className="font-bold text-text-primary">Certificate Pending</h4>
                      <p className="text-sm text-text-secondary">Your certificate payment is awaiting admin approval.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary">
                      To complete this course and earn your certificate, you must pass the final assessment.
                    </p>

                    {!takingQuiz && !quizResult && (
                      <Button variant="primary" onClick={handleStartQuiz}>
                        Start Final Quiz
                      </Button>
                    )}

                    {quizResult && quizResult.passed && localCertStatus === 'none' && (
                      <div className="flex flex-col gap-3 mt-2 border-t border-border-color/50 pt-4">
                        <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 text-sm font-bold">
                          <span>Score: {quizResult.score}%</span>
                          <span>Passed!</span>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => setPaymentModalOpen(true)}
                          className="w-full bg-amber-500 hover:bg-amber-600 border-0"
                        >
                          <CreditCard size={16} className="mr-2" /> Pay {course.certificate_price || content?.certificate?.price || '$10'} for Certificate
                        </Button>
                      </div>
                    )}

                    {quizResult && !quizResult.passed && (
                      <div className="flex flex-col gap-3 mt-2 border-t border-border-color/50 pt-4">
                        <div className="flex justify-between items-center bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 text-sm font-bold">
                          <span>Score: {quizResult.score}%</span>
                          <span>Failed (Need 80%)</span>
                        </div>
                        <Button variant="outline" onClick={() => { setQuizResult(null); setQuizAnswers({}); }}>
                          Retake Quiz
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-border-color rounded-2xl">
                <p className="text-sm text-text-secondary mb-3">
                  This course does not require a final quiz. You can request your certificate if you have completed the materials.
                </p>
                {certStatus === 'issued' ? (
                  <Button variant="primary" onClick={handleViewCertificate}>
                    <Award size={16} className="mr-2" /> View Certificate
                  </Button>
                ) : certStatus === 'pending_payment' ? (
                  <span className="text-sm font-bold text-amber-600">Certificate payment pending admin approval</span>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 border-0"
                  >
                    <CreditCard size={16} className="mr-2" /> Pay {course.certificate_price || content?.certificate?.price || '$10'} for Certificate
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {takingQuiz && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border-color shadow-sm mt-4 animate-fadeIn">
          <h2 className="font-display font-bold text-xl mb-6">Final Assessment</h2>
          <div className="flex flex-col gap-8">
            {quizQuestions.map((q, qIdx) => (
              <div key={qIdx} className="flex flex-col gap-3">
                <h4 className="font-bold text-text-primary text-sm">
                  {qIdx + 1}. {q.question}
                </h4>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${quizAnswers[qIdx] === opt ? 'bg-primary-light/10 border-primary text-primary' : 'bg-white dark:bg-slate-900 border-border-color text-text-secondary hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name={`question-${qIdx}`}
                        value={opt}
                        checked={quizAnswers[qIdx] === opt}
                        onChange={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-8 border-t border-border-color/50 pt-6">
            <Button variant="primary" onClick={handleSubmitQuiz}>
              Submit Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Certificate Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md mt-10 max-h-[75vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-y-auto cc-scroll text-left flex flex-col">
            <div className="px-6 py-5 border-b border-border-color flex items-center justify-between bg-bg-secondary/30 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-primary">
                <Award size={20} />
                <h3 className="font-display font-bold text-lg m-0">Certificate Payment</h3>
              </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="text-center">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Amount</p>
                <p className="font-display font-black text-3xl text-amber-500">{course.certificate_price || content?.certificate?.price || '$10'}</p>
                <p className="text-xs text-text-tertiary mt-2">for Certificate of Completion</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col gap-4">
                <p className="text-sm text-amber-900 leading-relaxed m-0 text-center">Please transfer the amount to the following account to receive your certificate.</p>

                <div className="flex flex-col gap-3 bg-white dark:bg-slate-900/ p-4 rounded-xl border border-amber-200/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Bank Name</span>
                    <span className="text-sm font-semibold text-amber-950">{bankDetails.bank_name || 'Not Configured'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Account Name</span>
                    <span className="text-sm font-semibold text-amber-950">{bankDetails.account_name || 'Not Configured'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Account Number</span>
                    <span className="text-sm font-semibold text-amber-950 font-mono tracking-tight">{bankDetails.account_number || 'Not Configured'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handlePayCertificate}
                  disabled={payingCertificate}
                  className="bg-amber-500 hover:bg-amber-600 border-0"
                >
                  {payingCertificate ? <Loader2 className="animate-spin" size={16} /> : 'I have paid'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={payingCertificate}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Name Entry Modal */}
      {showNameEntryModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h3 className="font-display font-bold text-xl mb-4">Enter Certificate Name</h3>
            <p className="text-sm text-text-secondary mb-6">Max 10 characters, no spaces.</p>
            <input
              type="text"
              maxLength={10}
              value={certNameInput}
              onChange={(e) => setCertNameInput(e.target.value.replace(/\s/g, ''))}
              placeholder="Your Name"
              className="w-full p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary text-center mb-6 shadow-inner"
            />
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowNameEntryModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (certNameInput.trim()) {
                  setShowNameEntryModal(false);
                  setShowCertificateModal(true);
                }
              }}>Generate</Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal (Dynamic HTML) */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-color flex items-center justify-between bg-bg-secondary/50 shrink-0">
              <div className="flex items-center gap-2 text-primary-dark">
                <Award size={20} />
                <h3 className="font-display font-bold text-lg m-0">Your Verified Certificate</h3>
              </div>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="p-1.5 text-text-tertiary hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white hover:text-text-primary rounded-full border-0 cursor-pointer transition-colors bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 flex-1 overflow-hidden bg-slate-950 flex items-center justify-center">
              <div
                ref={certificateRef}
                className="relative w-full max-w-3xl aspect-[2000/1414] shadow-2xl border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 my-auto"
                style={{ containerType: 'inline-size' }}
              >
                <img
                  src="/CalculusCorner-Course-Certificate.png"
                  onError={(e) => { e.target.src = '/CalculusCorner-Certificate.png'; }}
                  alt="Certificate Template"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Dynamic Text Overlays (Full Right Panel) */}
                <style>
                  {`@import url('https://fonts.googleapis.com/css2?family=Lavishly+Yours&display=swap');`}
                </style>
                <div className="absolute z-10 w-full h-full inset-0">
                  {/* Student Name */}
                  <p
                    className="absolute text-[#2761f0] font-bold leading-none select-none"
                    style={{
                      top: "44.5%",
                      left: "37.45%",
                      fontSize: "10cqi",
                      fontFamily: '"Lavishly Yours", cursive',
                    }}
                  >
                    {certNameInput || "Student Name"}
                  </p>

                  {/* Course Title */}
                  <p
                    className="absolute text-[#2761f0] font-bold select-none"
                    style={{
                      top: "61.5%",
                      left: "66.95%",
                      fontSize: "2.3cqi",
                    }}
                  >
                    {course.title}
                  </p>

                  {/* Date */}
                  <p
                    className="absolute text-[#2761f0] font-bold select-none"
                    style={{
                      top: "70.5%",
                      left: "42.45%",
                      fontSize: "2.3cqi",
                    }}
                  >
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-color bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowCertificateModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={downloadFromModal} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md">
                <Download size={16} className="mr-2 inline" /> Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailTab;
