import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Plus, Edit2, Trash2, X, AlertCircle, Star, Calendar, Upload, Search, FileJson, CheckCircle2, ChevronLeft, ChevronRight, Mail, Download, Clock } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import Loader from '../../components/ui/Loader';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ManageSiteContent = () => {
  const { content, loading: contentLoading, updateSection, refetch } = useContent();
  const { confirm, alert: showAlertDialog, showToast } = useDialog();
  const [activeTab, setActiveTab] = useState('hero');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const saveAiBtnRef = useRef(null);

  // Logo upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');

  // Announcements CRUD states
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // 'new' or id
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    text: '',
    link: '',
    active: true,
    priority: 0,
    start_date: '',
    end_date: '',
    display_order: 0
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Question Pool states
  const [questionStats, setQuestionStats] = useState({ totalQuestions: 0, totalTopics: 0, lastUploadDate: null });
  const [questions, setQuestions] = useState([]);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsTotalPages, setQuestionsTotalPages] = useState(1);
  const [questionsLimit] = useState(5);
  const [questionsSearch, setQuestionsSearch] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsStatsLoading, setQuestionsStatsLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  // Manual Quiz Generator states
  const [manualTopic, setManualTopic] = useState('');
  const [manualQuizzes, setManualQuizzes] = useState([{
    id: Date.now(),
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'Easy'
  }]);
  const [savingManualQuiz, setSavingManualQuiz] = useState(false);

  // AI Quiz Generator states
  const [questionPoolView, setQuestionPoolView] = useState('bank'); // 'bank' or 'ai'
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [aiGeneratedPage, setAiGeneratedPage] = useState(1);
  const aiQuestionsLimit = 10;
  const [aiRestrictionSeconds, setAiRestrictionSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (aiRestrictionSeconds > 0) {
      interval = setInterval(() => {
        setAiRestrictionSeconds(prev => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [aiRestrictionSeconds]);

  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('append'); // 'append' or 'replace'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // PDF-to-Quiz Import states
  const [pdfMetadata, setPdfMetadata] = useState({
    title: '',
    subject: 'Calculus',
    topic: '',
    difficulty: 'easy',
    duration: 30,
    passingMarks: 50,
    totalMarks: 100,
    description: '',
    tags: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [pdfValidation, setPdfValidation] = useState({ isValid: true, errors: [] });
  const [pdfConfidence, setPdfConfidence] = useState(100);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState('append'); // 'append' or 'replace'
  const [isDragOver, setIsDragOver] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Newsletter states
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersLimit] = useState(10);
  const [subscribersSearch, setSubscribersSearch] = useState('');
  const [subscribersStatus, setSubscribersStatus] = useState('');
  const [newsletterAnalytics, setNewsletterAnalytics] = useState({ total: 0, active: 0, inactive: 0, recent24h: 0 });

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    topic: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'easy'
  });

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    setLogoError('');
    setLogoSuccess('');
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setLogoError('File size exceeds the 20MB limit.');
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    const allowedExts = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExts.includes(ext)) {
      setLogoError('Only PNG, JPG, JPEG, WEBP and SVG files are allowed.');
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUploadSubmit = async (e) => {
    e.preventDefault();
    if (!logoFile) return;

    const data = new FormData();
    data.append('logo', logoFile);

    try {
      setLogoSaving(true);
      setLogoError('');
      setLogoSuccess('');

      const res = await api.post('/content/logo', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        setLogoSuccess('Logo updated successfully!');
        setLogoFile(null);
        setLogoPreview(null);
        if (typeof refetch === 'function') {
          refetch();
        }
      }
    } catch (err) {
      setLogoError(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setLogoSaving(false);
    }
  };

  const fetchQuestionStats = async () => {
    try {
      setQuestionsStatsLoading(true);
      const res = await api.get('/admin/questions/stats');
      if (res.data && res.data.success) {
        setQuestionStats(res.data.data);
        if (res.data.data.aiRestricted) {
          setAiRestrictionSeconds(res.data.data.aiRestrictionTimeLeft);
        } else {
          setAiRestrictionSeconds(0);
        }
      }

      const topicsRes = await api.get('/practice/topics');
      if (topicsRes.data && topicsRes.data.success) {
        setTopics(topicsRes.data.data);
      }
    } catch (err) {
    } finally {
      setQuestionsStatsLoading(false);
    }
  };



  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const res = await api.get('/admin/questions', {
        params: {
          page: questionsPage,
          limit: questionsLimit,
          search: questionsSearch
        }
      });
      if (res.data && res.data.success) {
        setQuestions(res.data.data);
        setQuestionsTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleSaveManualQuiz = async () => {
    if (!manualTopic.trim()) {
      showToast('Please enter a topic', 'error');
      return;
    }

    // Validation
    for (let i = 0; i < manualQuizzes.length; i++) {
      const q = manualQuizzes[i];
      if (!q.questionText.trim()) {
        showToast(`Question ${i + 1} text is required`, 'error');
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        showToast(`All 4 options for Question ${i + 1} are required`, 'error');
        return;
      }
      if (!q.correctAnswer.trim()) {
        showToast(`Please select a correct answer for Question ${i + 1}`, 'error');
        return;
      }
      if (!q.options.includes(q.correctAnswer)) {
        showToast(`Correct answer for Question ${i + 1} must be one of the options`, 'error');
        return;
      }
    }

    try {
      setSavingManualQuiz(true);
      const payload = {
        topic: manualTopic,
        difficulty: "Mixed",
        questions: manualQuizzes.map(q => ({
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty.toLowerCase()
        })),
        mode: 'append'
      };
      const res = await api.post('/admin/questions/bulk-import', payload);
      if (res.data && res.data.success) {
        showToast('Successfully saved manual quizzes!', 'success');
        setShowGenerateModal(false);
        setManualTopic('');
        setManualQuizzes([{
          id: Date.now(),
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          difficulty: 'Easy'
        }]);
        fetchQuestions();
        fetchQuestionStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save manual quizzes', 'error');
    } finally {
      setSavingManualQuiz(false);
    }
  };

  const handleGenerateAIQuiz = async () => {
    if (!aiTopic.trim()) {
      showToast('Please enter a topic', 'error');
      return;
    }
    try {
      setAiGenerating(true);
      const res = await api.post('/admin/generate-quiz', {
        topic: aiTopic,
        difficulty: aiDifficulty
      });
      if (res.data && res.data.success) {
        setAiGeneratedQuestions(res.data.data.map((q, idx) => ({ ...q, _aiId: idx, isEditing: false })));
        setAiGeneratedPage(1);
        showToast('Successfully generated 30 unique questions!', 'success');
        fetchQuestionStats();
        setTimeout(() => {
          if (saveAiBtnRef.current) {
            saveAiBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            setTimeout(() => saveAiBtnRef.current.focus({ preventScroll: true }), 300);
          }
        }, 300);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate quiz', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAIGeneratedQuiz = async () => {
    if (aiGeneratedQuestions.length === 0) return;
    try {
      setAiGenerating(true);
      const payload = {
        topic: aiTopic,
        difficulty: aiDifficulty,
        questions: aiGeneratedQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: aiDifficulty
        })),
        mode: 'append'
      };
      const res = await api.post('/admin/questions/bulk-import', payload);
      if (res.data && res.data.success) {
        showToast('Generated questions successfully saved to Question Pool!', 'success');
        setAiGeneratedQuestions([]);
        setAiTopic('');
        setQuestionPoolView('bank');
        fetchQuestionStats();
        fetchQuestions();
      }
    } catch (err) {
      showToast('Failed to save generated quiz', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleEditAIGeneratedQuestion = (aiId) => {
    setAiGeneratedQuestions(prev => prev.map(q =>
      q._aiId === aiId ? { ...q, isEditing: !q.isEditing } : q
    ));
  };

  const updateAIGeneratedQuestion = (aiId, field, value, optionIndex = null) => {
    setAiGeneratedQuestions(prev => prev.map(q => {
      if (q._aiId === aiId) {
        if (field === 'options') {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a JSON file to upload.');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);

        if (!json.topics && !Array.isArray(json)) {
          throw new Error('Invalid JSON format. File must contain a "topics" array or a flat list of questions.');
        }

        const res = await api.post('/admin/questions/upload', {
          mode: uploadMode,
          questions: json
        });

        if (res.data && res.data.success) {
          setUploadSuccess(res.data.message);
          setUploadFile(null);
          const fileInput = document.getElementById('questions-file-input');
          if (fileInput) fileInput.value = '';
          fetchQuestionStats();
          fetchQuestions();
        }
      } catch (err) {
        setUploadError(err.response?.data?.message || err.message || 'Failed to parse or upload the question file.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(uploadFile);
  };

  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      topic: q.topic || '',
      question: q.question || '',
      options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
      correctAnswer: q.correctAnswer || '',
      difficulty: q.difficulty || 'easy'
    });
  };

  const handleUpdateQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.topic || !questionForm.question || !questionForm.correctAnswer) return;

    try {
      const res = await api.put(`/admin/questions/${editingQuestion.id}`, questionForm);
      if (res.data && res.data.success) {
        setEditingQuestion(null);
        fetchQuestionStats();
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update question.', 'error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    const isConfirmed = await confirm(
      'Delete Question?',
      'This action cannot be undone. Are you sure you want to permanently remove this question from the question pool?',
      { confirmLabel: 'Delete Question', danger: true }
    );
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/admin/questions/${id}`);
      if (res.data && res.data.success) {
        showToast('Question deleted successfully.', 'success');
        fetchQuestionStats();
        fetchQuestions();
      } else {
        showToast('Unable to delete question. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Unable to delete question. Please try again.', 'error');
    }
  };

  const handleDeleteTopic = async (topicName) => {
    const isConfirmed = await confirm(
      'Delete Topic?',
      `Are you sure you want to delete the topic "${topicName}" and ALL of its questions? This cannot be undone.`,
      { confirmLabel: 'Delete Topic', danger: true }
    );
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/admin/questions/topic/${encodeURIComponent(topicName)}`);
      if (res.data && res.data.success) {
        showToast('Topic and its questions deleted successfully.', 'success');
        fetchQuestionStats();
        fetchQuestions();
      } else {
        showToast('Unable to delete topic. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Unable to delete topic. Please try again.', 'error');
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
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const defaultSchemas = {
    hero: {
      badge: '#1 Premium Math Learning Platform',
      headline_part1: 'Where Mathematics Meets',
      headline_gradient: 'Infinity',
      subheadline: 'Master Algebra, Geometry, Trigonometry, Statistics & Calculus through engaging lessons, expert guidance, and AI-powered learning.',
      button_primary: 'Start Learning',
      button_secondary: 'Watch Free Lessons',
      stats_1_value: '98%',
      stats_1_label: 'Success Rate',
      stats_2_value: 'Exam Prep',
      stats_2_label: 'Targeted',
      stats_3_value: 'AI Assistant',
      stats_3_label: '24/7 Help'
    },
    about: {
      badge: 'About Us',
      heading: 'Transforming Math Anxiety into',
      heading_gradient: 'Mathematical Mastery',
      paragraph1: 'Calculus Corner is more than just a tutoring platform. We are a dedicated educational hub designed to make complex mathematical concepts intuitive, engaging, and accessible to everyone. Our mission is to build foundational strength that lasts a lifetime.',
      paragraph2: '',
      image_url: ''
    },
    contact: {
      email: 'calculuscorner.official@gmail.com',
      phone: '+92 302 8983263',
      address: 'Islamabad, Pakistan'
    },
    certificate: {
      price: '$10'
    },
    newsletter: {
      heading: 'Subscribe to Newsletter',
      subheading: 'Get the latest study tips, new video alerts, and exclusive resources delivered directly to your inbox.'
    }
  };

  // Load draft configuration and subscribers dependencies
  useEffect(() => {
    if (activeTab !== 'announcements' && activeTab !== 'question_pool' && activeTab !== 'logo' && activeTab !== 'newsletter' && activeTab !== 'pdf_import' && activeTab !== 'bank_details') {
      const dbData = content && content[activeTab] ? content[activeTab] : {};
      const defaultData = defaultSchemas[activeTab] || {};
      setFormData({ ...defaultData, ...dbData });
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'question_pool') {
      fetchQuestionStats();
      fetchQuestions();
    } else if (activeTab === 'newsletter') {
      const dbData = content && content[activeTab] ? content[activeTab] : {};
      const defaultData = defaultSchemas[activeTab] || {};
      setFormData({ ...defaultData, ...dbData });

      setSubscribersPage(1);
      fetchSubscribers(1, subscribersSearch, subscribersStatus);
    } else if (activeTab === 'pdf_import') {
      // Load saved draft if exists
      const savedQuestions = localStorage.getItem('calculus_corner_pdf_questions');
      const savedMetadata = localStorage.getItem('calculus_corner_pdf_metadata');
      if (savedQuestions) {
        try {
          const parsed = JSON.parse(savedQuestions);
          setParsedQuestions(parsed);
          const validationResults = validateBatchClient(parsed);
          setPdfValidation(validationResults);
          const invalidCount = parsed.filter(q => q.needsReview).length;
          setPdfConfidence(parsed.length > 0 ? Math.round(((parsed.length - invalidCount) / parsed.length) * 100) : 100);
        } catch (e) { }
      }
      if (savedMetadata) {
        try {
          setPdfMetadata(JSON.parse(savedMetadata));
        } catch (e) { }
      }
    } else if (activeTab === 'bank_details') {
      if (content && content[activeTab]) {
        setFormData(content[activeTab]);
      } else {
        setFormData({ bank_name: '', account_name: '', account_number: '' });
      }
    }
  }, [activeTab, content, questionsPage, questionsSearch, subscribersPage, subscribersSearch, subscribersStatus]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const refreshAnnouncements = () => {
      if (activeTab === 'announcements') fetchAnnouncements();
    };
    const refreshSubscribers = () => {
      if (activeTab === 'newsletter') fetchSubscribers(subscribersPage, subscribersSearch, subscribersStatus);
    };
    const refreshQuestions = () => {
      if (activeTab === 'question_pool') {
        fetchQuestionStats();
        fetchQuestions();
      }
    };

    socket.on('announcement:create', refreshAnnouncements);
    socket.on('announcement:update', refreshAnnouncements);
    socket.on('announcement:delete', refreshAnnouncements);

    socket.on('newsletter:update', refreshSubscribers);

    socket.on('question_pool:update', refreshQuestions);

    return () => {
      socket.off('announcement:create', refreshAnnouncements);
      socket.off('announcement:update', refreshAnnouncements);
      socket.off('announcement:delete', refreshAnnouncements);
      socket.off('newsletter:update', refreshSubscribers);
      socket.off('question_pool:update', refreshQuestions);
    };
  }, [socket, activeTab, subscribersPage, subscribersSearch, subscribersStatus]);

  // Client-side batch validation for instant feedback
  const validateBatchClient = (questionsList) => {
    const errors = [];
    questionsList.forEach((q, idx) => {
      const qIndex = idx + 1;
      if (!q.question || !q.question.trim()) {
        errors.push(`Row ${qIndex}: Question content is empty.`);
      }
      if (!q.options || q.options.length < 2) {
        errors.push(`Row ${qIndex}: Requires at least 2 options.`);
      }
      if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === '') {
        errors.push(`Row ${qIndex}: Missing correct choice.`);
      }
    });
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const res = await api.get(`/admin/newsletter?page=${subscribersPage}&limit=${subscribersLimit}&search=${encodeURIComponent(subscribersSearch)}&status=${subscribersStatus}`);
      if (res.data && res.data.success) {
        setSubscribers(res.data.data || []);
        setSubscribersTotal(res.data.total || 0);
        if (res.data.analytics) {
          setNewsletterAnalytics(res.data.analytics);
        }
      }
    } catch (err) {
    } finally {
      setSubscribersLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    const isConfirmed = await confirm(
      'Remove Subscriber?',
      `Remove "${email}" from the newsletter list? They will no longer receive updates.`,
      { confirmLabel: 'Remove Subscriber', danger: true }
    );
    if (!isConfirmed) return;
    try {
      await api.delete(`/admin/newsletter/${id}`);
      showToast('Subscriber removed successfully.', 'success');
      fetchSubscribers();
    } catch (err) {
      showToast('Failed to remove subscriber.', 'error');
    }
  };

  const handleToggleSubscriberStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/newsletter/${id}/status`, { status: nextStatus });
      showToast(`Subscriber status set to ${nextStatus}.`, 'success');
      fetchSubscribers();
    } catch (err) {
      showToast('Failed to update subscriber status.', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/newsletter/export?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Failed to export CSV. Please try again.', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/admin/newsletter/export?format=excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Failed to export Excel. Please try again.', 'error');
    }
  };

  // PDF-to-Quiz file upload handlers
  const handlePdfUpload = async () => {
    if (!pdfFile) {
      showToast('Please select a file to import.', 'error');
      return;
    }

    setIsParsing(true);
    setParsingProgress(10);
    const progressInterval = setInterval(() => {
      setParsingProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', pdfFile);

      const res = await api.post('/admin/questions/parse-file', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setParsingProgress(100);

      if (res.data && res.data.success) {
        setParsedQuestions(res.data.questions);
        setPdfConfidence(res.data.confidence);
        setPdfValidation(res.data.validation);

        // Auto-extract first question topic/subject/difficulty to override metadata if available
        const firstQ = res.data.questions[0];
        if (firstQ) {
          setPdfMetadata(prev => ({
            ...prev,
            topic: firstQ.chapter || firstQ.topic || prev.topic || '',
            subject: firstQ.subject || prev.subject || 'Calculus',
            difficulty: firstQ.difficulty || prev.difficulty || 'easy'
          }));
        }

        showToast('Document parsed successfully! Preview questions below.', 'success');
      }
    } catch (err) {
      clearInterval(progressInterval);
      showToast(err.response?.data?.message || 'Failed to parse file.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleEditParsedQuestion = (index, field, value) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], [field]: value };

    // Re-validate
    const invalidCount = updated.filter(q => q.needsReview).length;
    setPdfConfidence(updated.length > 0 ? Math.round(((updated.length - invalidCount) / updated.length) * 100) : 100);
    setPdfValidation(validateBatchClient(updated));
    setParsedQuestions(updated);
  };

  const handleEditParsedOption = (qIdx, optIdx, val) => {
    const updated = [...parsedQuestions];
    const updatedOpts = [...updated[qIdx].options];
    updatedOpts[optIdx] = val;
    updated[qIdx].options = updatedOpts;

    setPdfValidation(validateBatchClient(updated));
    setParsedQuestions(updated);
  };

  const handleAddManualQuestion = () => {
    const newQ = {
      id: `q_manual_${Date.now()}`,
      question: 'New Question text...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'easy',
      subject: '',
      chapter: '',
      needsReview: false,
      reviewReason: []
    };
    const updated = [...parsedQuestions, newQ];
    setParsedQuestions(updated);
    setPdfValidation(validateBatchClient(updated));
  };

  const handleDeleteParsedQuestion = (index) => {
    const updated = parsedQuestions.filter((_, idx) => idx !== index);
    setParsedQuestions(updated);
    setPdfValidation(validateBatchClient(updated));
  };

  const savePdfDraft = () => {
    localStorage.setItem('calculus_corner_pdf_questions', JSON.stringify(parsedQuestions));
    localStorage.setItem('calculus_corner_pdf_metadata', JSON.stringify(pdfMetadata));
    showToast('Draft workspace saved to browser cache!', 'success');
  };

  const clearPdfDraft = () => {
    localStorage.removeItem('calculus_corner_pdf_questions');
    localStorage.removeItem('calculus_corner_pdf_metadata');
    setParsedQuestions([]);
    setPdfFile(null);
    setPdfConfidence(100);
    setPdfValidation({ isValid: true, errors: [] });
    setPdfMetadata({
      title: '',
      subject: 'Calculus',
      topic: '',
      difficulty: 'easy',
      duration: 30,
      passingMarks: 50,
      totalMarks: 100,
      description: '',
      tags: ''
    });
    showToast('Draft progress reset successfully.', 'info');
  };

  const downloadParsedJson = () => {
    const blob = new Blob([JSON.stringify(parsedQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pdfMetadata.topic || 'parsed_questions'}_backup.json`;
    link.click();
    showToast('JSON package exported successfully.', 'success');
  };

  const handleImportSubmit = async () => {
    if (!pdfMetadata.topic || !pdfMetadata.topic.trim()) {
      showToast('Please specify a target topic name.', 'error');
      return;
    }

    setImporting(true);
    try {
      const res = await api.post('/admin/questions/bulk-import', {
        questions: parsedQuestions,
        topic: pdfMetadata.topic,
        difficulty: pdfMetadata.difficulty,
        mode: importMode
      });

      if (res.data && res.data.success) {
        setImportSummary(res.data.stats);
        clearPdfDraft();
        fetchQuestionStats();
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSection(activeTab, formData);
    setSaving(false);
    showToast('Changes saved and pushed to live site!', 'success');
  };

  // Announcements Handlers
  const handleAnnouncementToggleActive = async (ann) => {
    try {
      const updatedActive = ann.active === 1 ? 0 : 1;
      const res = await api.put(`/admin/announcements/${ann.id}`, {
        ...ann,
        active: updatedActive
      });
      if (res.data && res.data.success) {
        fetchAnnouncements();
      }
    } catch (err) {
    }
  };

  const handleAnnouncementEdit = (ann) => {
    setEditingId(ann.id);
    setAnnouncementForm({
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

  const handleAnnouncementDelete = (ann) => {
    setDeleteConfirmId(ann.id);
    setDeleteConfirmName(ann.title || ann.text);
  };

  const handleAnnouncementConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/announcements/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        fetchAnnouncements();
      }
    } catch (err) {
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.text.trim()) return;

    const payload = {
      title: announcementForm.title.trim() || 'Notice',
      text: announcementForm.text.trim(),
      link: announcementForm.link ? announcementForm.link.trim() : null,
      active: announcementForm.active ? 1 : 0,
      priority: parseInt(announcementForm.priority) || 0,
      start_date: announcementForm.start_date ? new Date(announcementForm.start_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      end_date: announcementForm.end_date ? new Date(announcementForm.end_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      display_order: parseInt(announcementForm.display_order) || 0
    };

    try {
      if (editingId === 'new') {
        await api.post('/admin/announcements', payload);
      } else {
        await api.put(`/admin/announcements/${editingId}`, payload);
      }
      setEditingId(null);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    }
  };

  const formatDatetimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const addNewAnnouncement = () => {
    setEditingId('new');
    setAnnouncementForm({
      title: '',
      text: '',
      active: true,
      priority: 0,
      start_date: '',
      end_date: '',
      display_order: 0
    });
  };

  const getLogoSrc = () => {
    if (content?.logo?.logo_url) {
      if (content.logo.logo_url.startsWith('http')) {
        return content.logo.logo_url;
      }
      return `https://localhost:5173${content.logo.logo_url}`;
    }
    return "/CClogo.png";
  };

  if (contentLoading) return <div className="flex justify-center items-center h-48 text-primary font-semibold">Loading site configuration...</div>;
  if (!content) return <div className="flex justify-center items-center h-48 text-primary font-semibold">Please make sure you imported the database!</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Site Settings & Announcements</h2>
          <p className="text-text-secondary text-xs md:text-sm">Manage website copy layout configurations or publish ticker notices.</p>
        </div>
        {activeTab === 'announcements' && (
          <button
            onClick={addNewAnnouncement}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark cursor-pointer shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <Plus size={18} /> Add Announcement
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2.5 border-b border-border-color pb-3">
        {['hero', 'about', 'contact', 'logo', 'announcements', 'question_pool', 'newsletter', 'bank_details'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-semibold text-sm border-0 cursor-pointer transition-all capitalize ${activeTab === tab
              ? 'bg-primary text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
          >
            {tab === 'hero' ? 'Hero Section' : tab === 'about' ? 'About Section' : tab === 'contact' ? 'Contact Details' : tab === 'logo' ? 'Site Logo' : tab === 'announcements' ? 'Announcements Banner' : tab === 'newsletter' ? 'Newsletter' : tab === 'bank_details' ? 'Global Bank Details' : 'Question Pool'}
          </button>
        ))}
      </div>

      {/* Question Pool panel rendering */}
      {activeTab === 'question_pool' ? (
        <div className="flex flex-col gap-8 text-left animate-fadeIn">
          {parsedQuestions.length > 0 ? (
            /* Universal Import Workspace */
            <div className="flex flex-col gap-8 text-left animate-fadeIn">
              {/* Metadata Section */}
              <div className="p-8 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary m-0">Quiz Metadata & Configuration</h3>
                  <p className="text-text-secondary text-xs md:text-sm mt-1">Configure quiz tags, difficulty, and target topic settings before importing questions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Quiz Title</label>
                    <input
                      type="text"
                      value={pdfMetadata.title}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, title: e.target.value })}
                      placeholder="e.g. Limits Sprint Test"
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Subject</label>
                    <input
                      type="text"
                      value={pdfMetadata.subject}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, subject: e.target.value })}
                      placeholder="e.g. Calculus"
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Target Topic *</label>
                    <input
                      type="text"
                      value={pdfMetadata.topic}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, topic: e.target.value })}
                      placeholder="e.g. Limits"
                      required
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Difficulty</label>
                    <select
                      value={pdfMetadata.difficulty}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, difficulty: e.target.value })}
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={pdfMetadata.duration}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, duration: parseInt(e.target.value) || 0 })}
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Passing Marks</label>
                    <input
                      type="number"
                      value={pdfMetadata.passingMarks}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, passingMarks: parseInt(e.target.value) || 0 })}
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Total Marks</label>
                    <input
                      type="number"
                      value={pdfMetadata.totalMarks}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, totalMarks: parseInt(e.target.value) || 0 })}
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-bold text-text-secondary uppercase">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={pdfMetadata.tags}
                      onChange={e => setPdfMetadata({ ...pdfMetadata, tags: e.target.value })}
                      placeholder="e.g. Limits, Continuity, MCQ"
                      className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-text-secondary uppercase">Quiz Description</label>
                  <textarea
                    value={pdfMetadata.description}
                    onChange={e => setPdfMetadata({ ...pdfMetadata, description: e.target.value })}
                    rows={2}
                    placeholder="Enter a brief summary of this quiz..."
                    className="p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y"
                  />
                </div>
              </div>

              {/* Parsing Metrics, Backup JSON, and Draft Controls */}
              <div className="p-8 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-text-primary m-0">Parsing Metrics & Local Progress</h4>
                  <p className="text-xxs text-text-secondary leading-relaxed m-0">
                    File: <strong>{pdfFile ? pdfFile.name : 'Draft Cache'}</strong> ({parsedQuestions.length} questions parsed)
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="px-4 py-2 bg-bg-secondary rounded-xl border border-border-color flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-text-tertiary">Confidence:</span>
                    <span className={`font-display font-black text-sm ${pdfConfidence >= 80 ? 'text-emerald-600' : pdfConfidence >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>{pdfConfidence}%</span>
                  </div>

                  <button
                    onClick={downloadParsedJson}
                    className="py-2.5 px-4 bg-white border border-border-color text-text-secondary font-bold text-xs rounded-xl hover:bg-bg-secondary cursor-pointer transition-colors flex items-center gap-1.5"
                    title="Export as JSON Backup"
                  >
                    <Download size={14} /> Backup JSON
                  </button>

                  <button
                    onClick={savePdfDraft}
                    className="py-2.5 px-4 bg-bg-secondary hover:bg-slate-200 text-text-primary font-bold text-xs border border-border-color rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save size={14} /> Save Draft
                  </button>

                  <button
                    onClick={clearPdfDraft}
                    className="py-2.5 px-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 font-bold text-xs border border-red-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Reset / Cancel
                  </button>
                </div>
              </div>

              {/* Validation Warning Alert banner */}
              {!pdfValidation.isValid && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-left">
                  <h4 className="text-xs font-bold uppercase m-0 flex items-center gap-1.5 font-sans">
                    <AlertCircle size={14} /> Formatting Errors Detected
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-[11px] font-medium leading-relaxed">
                    {pdfValidation.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {pdfValidation.errors.length > 5 && (
                      <li className="font-bold text-rose-600">...and {pdfValidation.errors.length - 5} more issues. Click inline rows to resolve.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Interactive Preview & Editing Section */}
              <div className="flex flex-col gap-5 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-bold text-lg text-text-primary m-0">Interactive Question Preview</h3>
                    <p className="text-text-secondary text-xs mt-1">Verify question strings, option answers, and write custom adjustments before final insertion.</p>
                  </div>
                  <button
                    onClick={handleAddManualQuestion}
                    className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Question Manually
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  {parsedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className={`p-6 rounded-3xl bg-white border shadow-sm flex flex-col gap-4 text-left transition-all ${q.needsReview ? 'border-red-300 ring-2 ring-red-100 bg-red-50/10' : 'border-border-color'
                        }`}
                    >
                      <div className="flex justify-between items-start border-b border-border-color pb-3">
                        <div>
                          <span className="text-xs font-black text-primary">Question {idx + 1}</span>
                          {q.needsReview && (
                            <div className="flex flex-col gap-1 mt-1">
                              {q.reviewReason?.map((reason, rIdx) => (
                                <span key={rIdx} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                  <AlertCircle size={10} /> {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteParsedQuestion(idx)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg border-0 cursor-pointer transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xxs font-bold text-text-secondary uppercase">Question Content</label>
                        <textarea
                          value={q.question}
                          onChange={e => handleEditParsedQuestion(idx, 'question', e.target.value)}
                          rows={2}
                          className="w-full p-3 border border-border-color rounded-xl font-sans text-xs focus:outline-none focus:border-primary resize-y"
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-text-tertiary uppercase">
                              Option {String.fromCharCode(65 + optIdx)}
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleEditParsedOption(idx, optIdx, e.target.value)}
                              className="p-2.5 border border-border-color rounded-lg text-xs font-sans focus:outline-none focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Correct Answer and Explanation */}
                      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_3fr] gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xxs font-bold text-text-secondary uppercase font-sans">Correct Choice</label>
                          <select
                            value={q.correctAnswer !== null ? q.correctAnswer : ''}
                            onChange={e => handleEditParsedQuestion(idx, 'correctAnswer', parseInt(e.target.value))}
                            className="p-3 border border-border-color rounded-xl font-sans text-xs focus:outline-none focus:border-primary"
                          >
                            <option value="">Select Option</option>
                            {q.options?.map((opt, optIdx) => (
                              <option key={optIdx} value={optIdx}>
                                {String.fromCharCode(65 + optIdx)}) {opt.substring(0, 30)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xxs font-bold text-text-secondary uppercase">Explanation (Optional)</label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={e => handleEditParsedQuestion(idx, 'explanation', e.target.value)}
                            placeholder="e.g. Formula derived using the power rule..."
                            className="p-3 border border-border-color rounded-xl font-sans text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import Configuration Actions bar */}
                <div className="p-6 rounded-3xl bg-bg-secondary/40 border border-border-color shadow-sm mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-text-primary">Final Step: Confirm Database Import</span>
                    <p className="text-[11px] text-text-secondary leading-relaxed m-0 font-sans">
                      Importing {parsedQuestions.length} questions into target topic <strong>"{pdfMetadata.topic || 'General'}"</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                        />
                        <span>Append Questions</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                        />
                        <span className="text-red-500 font-bold">Replace Topic Pool</span>
                      </label>
                    </div>

                    <button
                      onClick={handleImportSubmit}
                      disabled={importing}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-xs rounded-xl border-0 shadow-md hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 grow sm:grow-0"
                    >
                      {importing ? 'Importing...' : 'Confirm & Save to DB'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Question Pool / AI Generator Views */
            <>
              {aiGenerating && createPortal(
                <div className="fixed inset-0 z-[9999] backdrop-blur-md bg-white/80 flex flex-col items-center justify-center">
                  <Loader text="Generating AI Quiz... Please wait" className="scale-125" />
                  <p className="text-text-secondary text-base font-medium mt-2">Crafting unique, high-quality questions just for you.</p>
                </div>,
                document.body
              )}

              {/* Top Heading */}
              <div className="flex justify-center mb-8">
                <h2 className="text-3xl font-bold text-primary m-0">Question Pool</h2>
              </div>

              {questionPoolView === 'bank' ? (
                <div className="w-full flex flex-col gap-8">
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white border border-border-color shadow-sm">
                      <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block text-left">Total Questions</span>
                      <span className="font-display font-black text-3xl text-primary mt-1 block text-left">{questionStats.totalQuestions}</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-border-color shadow-sm">
                      <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block text-left">Total Topics</span>
                      <span className="font-display font-black text-3xl text-indigo-600 mt-1 block text-left">{questionStats.totalTopics}</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-border-color shadow-sm flex items-center justify-center">
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-sm rounded-xl border-0 shadow-md hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center gap-2 w-full justify-center"
                      >
                        <Star size={18} /> Generate Quiz
                      </button>
                    </div>
                  </div>

                  {/* Question Bank Table (Full Screen Width) */}
                  <div className="p-6 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col gap-4 overflow-hidden w-full">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <h3 className="font-display font-bold text-xl text-text-primary m-0 text-left">Question Bank Database</h3>
                      <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-tertiary pointer-events-none">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search questions or topics..."
                          value={questionsSearch}
                          onChange={(e) => { setQuestionsSearch(e.target.value); setQuestionsPage(1); }}
                          className="w-full pl-11 pr-4 py-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-bg-secondary/30 transition-all"
                        />
                      </div>
                    </div>

                    {questionsLoading ? (
                      <div className="py-20 text-center text-primary text-sm font-semibold animate-pulse">Loading question records...</div>
                    ) : questions.length === 0 ? (
                      <div className="py-20 text-center text-text-secondary text-sm border-2 border-dashed border-border-color rounded-2xl bg-bg-secondary/20">
                        No questions found in database. Start generating with AI or import them!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-bg-secondary/60 border-b-2 border-border-color text-left">
                              <th className="px-5 py-4 font-bold text-text-secondary uppercase w-20 text-left tracking-wider">ID</th>
                              <th className="px-5 py-4 font-bold text-text-secondary uppercase w-40 text-left tracking-wider">Topic</th>
                              <th className="px-5 py-4 font-bold text-text-secondary uppercase text-left tracking-wider">Question Details</th>
                              <th className="px-5 py-4 font-bold text-text-secondary uppercase w-32 text-left tracking-wider">Difficulty</th>
                              <th className="px-5 py-4 font-bold text-text-secondary uppercase text-right w-32 tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-color/60">
                            {questions.map(q => (
                              <tr key={q.id} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-5 py-4 font-bold text-text-primary whitespace-nowrap text-left">{q.id.substring(0, 8)}...</td>
                                <td className="px-5 py-4 whitespace-nowrap text-left">
                                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-bold text-[11px] shadow-sm">
                                    {q.topic}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-left">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="font-semibold text-text-primary leading-relaxed">{q.question}</span>
                                    <span className="text-xs text-text-tertiary">
                                      Options: {Array.isArray(q.options) ? q.options.join(', ') : ''} <br />(Correct: <strong className="text-emerald-600">{q.correctAnswer}</strong>)
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-left">
                                  <span className={`px-3 py-1 rounded-lg font-extrabold uppercase text-[10px] border shadow-sm ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>
                                    {q.difficulty}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditQuestion(q)}
                                      className="p-2.5 bg-white shadow-sm border border-border-color hover:border-primary hover:bg-primary/5 text-text-secondary hover:text-primary rounded-xl cursor-pointer transition-all"
                                      title="Edit Question"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="p-2.5 bg-white shadow-sm border border-red-100 hover:border-red-500 hover:bg-red-50 text-text-tertiary hover:text-red-500 rounded-xl cursor-pointer transition-all"
                                      title="Delete Question"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination */}
                        {questionsTotalPages > 1 && (
                          <div className="flex items-center justify-between border-t border-border-color/60 pt-5 mt-3">
                            <span className="text-sm text-text-secondary font-bold bg-bg-secondary px-4 py-2 rounded-xl">
                              Page {questionsPage} of {questionsTotalPages}
                            </span>
                            <div className="flex gap-2">
                              <button
                                disabled={questionsPage === 1}
                                onClick={() => setQuestionsPage(prev => prev - 1)}
                                className="p-2.5 rounded-xl border border-border-color bg-white hover:bg-bg-secondary hover:border-text-secondary text-text-secondary disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                              >
                                <ChevronLeft size={18} />
                              </button>
                              <button
                                disabled={questionsPage === questionsTotalPages}
                                onClick={() => setQuestionsPage(prev => prev + 1)}
                                className="p-2.5 rounded-xl border border-border-color bg-white hover:bg-bg-secondary hover:border-text-secondary text-text-secondary disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-8">
                  {/* AI Generation Form */}
                  <div className="p-8 rounded-3xl bg-white border border-border-color shadow-lg w-full max-w-3xl mx-auto flex flex-col gap-8 relative overflow-hidden">
                    {aiRestrictionSeconds > 0 &&
                      (
                        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
                            <Clock size={40} />
                          </div>
                          <h3 className="font-display font-black text-2xl text-text-primary mb-3">AI Generation Cooldown</h3>
                          <p className="text-text-secondary font-medium max-w-sm mx-auto mb-8">
                            To ensure API limits are not exceeded, there is an 8-hour cooldown after every AI generation.
                          </p>
                          <div className="bg-white px-8 py-5 rounded-2xl border border-border-color shadow-sm">
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-2">Time Remaining</span>
                            <span className="font-display font-black text-4xl text-primary tracking-tight">
                              {Math.floor(aiRestrictionSeconds / 3600).toString().padStart(2, '0')}:
                              {Math.floor((aiRestrictionSeconds % 3600) / 60).toString().padStart(2, '0')}:
                              {(aiRestrictionSeconds % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      )}

                    <div className={`transition-all duration-300 ${aiRestrictionSeconds > 0 ? 'pointer-events-none select-none' : ''}`}>
                      {/* --- AI FEATURES DISABLED --- */}
                      {/*
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
                          <Star className="fill-indigo-500" size={32} />
                        </div>
                        <h3 className="font-display font-black text-3xl text-primary m-0 mb-3">
                          AI Quiz Generator
                        </h3>
                        <p className="text-base text-text-secondary font-medium">Generate 30 highly unique multiple-choice questions on any topic in seconds.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mb-8">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Topic</label>
                          <input
                            type="text"
                            value={aiTopic}
                            onChange={e => setAiTopic(e.target.value)}
                            placeholder="e.g. Limits and Continuity, Derivatives..."
                            className="w-full p-4 border-2 border-border-color rounded-2xl font-sans text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner bg-bg-secondary/30"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Difficulty</label>
                          <select
                            value={aiDifficulty}
                            onChange={e => setAiDifficulty(e.target.value)}
                            className="w-full p-4 border-2 border-border-color rounded-2xl font-sans text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner bg-white"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateAIQuiz}
                        disabled={aiGenerating || !aiTopic.trim()}
                        className="w-full py-5 bg-linear-to-r from-indigo-600 to-primary text-white font-black text-lg rounded-2xl hover:from-indigo-500 hover:to-primary-light transition-all shadow-xl hover:shadow-glow hover:-translate-y-1 cursor-pointer disabled:opacity-50 border-0 flex justify-center items-center gap-3"
                      >
                        <Star size={24} /> Generate 30 Questions
                      </button>
                      */}

                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                          <Star className="fill-slate-300 text-slate-300" size={32} />
                        </div>
                        <h3 className="font-display font-bold text-2xl text-text-primary m-0 mb-2">
                          AI Quiz Generator
                        </h3>
                        <p className="text-sm text-text-secondary font-medium">This feature has been disabled.</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Questions Editor */}
                  {aiGeneratedQuestions.length > 0 && (
                    <div className="flex flex-col gap-6 w-full">
                      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-border-color shadow-md sticky top-6 z-10">
                        <div className="flex items-center gap-4">
                          <h3 className="font-display font-black text-2xl text-text-primary m-0">Generated Preview</h3>
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-200">
                            30 Questions Ready
                          </span>
                        </div>
                        <button
                          ref={saveAiBtnRef}
                          onClick={handleSaveAIGeneratedQuiz}
                          disabled={aiGenerating}
                          className="px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg hover:shadow-xl cursor-pointer border-0 flex items-center gap-2 hover:-translate-y-0.5 focus:ring-4 focus:ring-emerald-300 focus:outline-none"
                        >
                          <Save size={20} /> Save All to Database
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6 w-full">
                        {aiGeneratedQuestions.slice((aiGeneratedPage - 1) * aiQuestionsLimit, aiGeneratedPage * aiQuestionsLimit).map((q, idx) => {
                          const globalIdx = (aiGeneratedPage - 1) * aiQuestionsLimit + idx;
                          return (
                            <div key={q._aiId} className={`p-8 rounded-3xl border transition-all shadow-sm ${q.isEditing ? 'bg-indigo-50/50 border-indigo-200 shadow-md' : 'bg-white border-border-color hover:border-primary/30 hover:shadow-md'}`}>
                              <div className="flex justify-between items-start mb-6">
                                <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-xl font-bold text-sm shadow-sm border border-indigo-200">
                                  Question {globalIdx + 1}
                                </span>
                                <button
                                  onClick={() => toggleEditAIGeneratedQuestion(q._aiId)}
                                  className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold cursor-pointer transition-all ${q.isEditing ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-border-color text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5'}`}
                                >
                                  {q.isEditing ? <CheckCircle2 size={18} /> : <Edit2 size={18} />}
                                  {q.isEditing ? 'Done' : 'Edit'}
                                </button>
                              </div>

                              {q.isEditing ? (
                                <div className="flex flex-col gap-6">
                                  <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Question Content</label>
                                    <textarea
                                      value={q.question}
                                      onChange={(e) => updateAIGeneratedQuestion(q._aiId, 'question', e.target.value)}
                                      className="w-full p-4 border-2 border-border-color rounded-2xl text-base focus:outline-none focus:border-indigo-500 font-sans resize-y shadow-inner"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Option {String.fromCharCode(65 + oIdx)}</label>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => updateAIGeneratedQuestion(q._aiId, 'options', e.target.value, oIdx)}
                                          className={`p-4 border-2 rounded-xl text-sm focus:outline-none font-medium shadow-inner transition-colors ${q.correctAnswer === opt ? 'bg-emerald-50/50 border-emerald-400 focus:border-emerald-600 text-emerald-900' : 'border-border-color focus:border-indigo-500'}`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-col gap-2 w-full max-w-md mt-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Correct Answer (Must match exact text)</label>
                                    <select
                                      value={q.correctAnswer}
                                      onChange={(e) => updateAIGeneratedQuestion(q._aiId, 'correctAnswer', e.target.value)}
                                      className="p-4 border-2 border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/30 font-bold text-emerald-800 shadow-sm transition-colors"
                                    >
                                      {q.options.map((opt, oIdx) => (
                                        <option key={oIdx} value={opt}>{String.fromCharCode(65 + oIdx)}) {opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-6">
                                  <h4 className="font-sans text-lg text-text-primary m-0 leading-relaxed font-bold">{q.question}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className={`p-5 rounded-2xl border text-sm font-semibold transition-all ${q.correctAnswer === opt ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm scale-[1.02]' : 'bg-bg-secondary/40 border-border-color text-text-secondary hover:bg-bg-secondary'}`}>
                                        <span className="font-black mr-3 opacity-50 px-2 py-1 bg-white rounded-lg shadow-sm">{String.fromCharCode(65 + oIdx)}</span> {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination for Generated Questions */}
                      {aiGeneratedQuestions.length > aiQuestionsLimit && (
                        <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-border-color shadow-sm mt-4">
                          <span className="text-sm font-bold text-text-secondary bg-bg-secondary px-5 py-2.5 rounded-xl shadow-inner">
                            Page {aiGeneratedPage} of {Math.ceil(aiGeneratedQuestions.length / aiQuestionsLimit)}
                          </span>
                          <div className="flex gap-3">
                            <button
                              disabled={aiGeneratedPage === 1}
                              onClick={() => setAiGeneratedPage(prev => prev - 1)}
                              className="p-3 rounded-xl border border-border-color bg-white hover:bg-primary/10 hover:border-primary hover:text-primary text-text-secondary disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              disabled={aiGeneratedPage === Math.ceil(aiGeneratedQuestions.length / aiQuestionsLimit)}
                              onClick={() => setAiGeneratedPage(prev => prev + 1)}
                              className="p-3 rounded-xl border border-border-color bg-white hover:bg-primary/10 hover:border-primary hover:text-primary text-text-secondary disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'announcements' ? (
        announcementsLoading ? (
          <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
            Loading announcements list...
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center bg-white border border-border-color rounded-2xl text-text-secondary text-sm">
            No announcements set yet. Click "Add Announcement" to publish a live notice banner!
          </div>
        ) : (
          <div className="bg-white border border-border-color rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-color text-left">
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Announcement Message</th>
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
                        <span className="text-sm font-bold text-text-primary">
                          {ann.title || 'Notice'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-text-secondary line-clamp-2 max-w-sm leading-relaxed">
                          {ann.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-extrabold bg-blue-50 text-primary border border-blue-100">
                          <Star size={10} className="fill-current text-primary" /> {ann.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-secondary">
                        {ann.display_order || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xxs font-semibold text-text-secondary gap-0.5">
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-extrabold border cursor-pointer select-none ${ann.active === 1
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-50 text-text-tertiary border-slate-200'
                            }`}
                        >
                          {ann.active === 1 ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAnnouncementEdit(ann)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-transparent border border-border-color hover:border-primary text-text-secondary hover:text-primary font-semibold text-xs rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleAnnouncementDelete(ann)}
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
          </div>
        )
      ) : activeTab === 'logo' ? (
        <div className="p-8 rounded-3xl bg-white border border-border-color shadow-xl max-w-2xl glass flex flex-col gap-6 text-left animate-fadeIn">
          <div>
            <h3 className="font-display font-bold text-lg text-text-primary m-0">Upload Site Logo</h3>
            <p className="text-text-secondary text-xs md:text-sm mt-1">Upload a high-quality SVG or image to update the website header and footer logo globally.</p>
          </div>

          <form onSubmit={handleLogoUploadSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-text-secondary uppercase">Select Logo File</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoFileChange}
                className="text-xs font-sans file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
              />
              <p className="text-[10px] text-text-tertiary">Accepted formats: PNG, JPG, JPEG, SVG (Max: 20MB)</p>
            </div>

            {/* Live Preview */}
            {(logoPreview || (content && content.logo && content.logo.logo_url)) && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Preview</label>
                <div className="p-4 bg-bg-secondary/50 rounded-2xl border border-border-color flex items-center justify-center min-h-[120px] max-w-[200px]">
                  <img
                    src={logoPreview || getLogoSrc()}
                    alt="Logo Preview"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {logoError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" /> <span>{logoError}</span>
              </div>
            )}

            {logoSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" /> <span>{logoSuccess}</span>
              </div>
            )}

            <div className="flex">
              <button
                type="submit"
                disabled={logoSaving || !logoFile}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition-all border-0 shadow-md"
              >
                <Upload size={18} /> {logoSaving ? 'Uploading Logo...' : 'Upload & Apply Logo'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Regular section config forms */
        <div className="p-8 rounded-3xl bg-white border border-border-color shadow-xl max-w-3xl glass flex flex-col gap-6">
          <h3 className="font-display font-bold text-lg text-text-primary capitalize">
            Editing {activeTab} Section Settings
          </h3>

          <div className="flex flex-col gap-4">
            {Object.keys(formData)
              .filter(key => !['facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'whatsapp_number'].includes(key))
              .map(key => (
                <div key={key} className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {key.includes('image_url') || key.includes('image') ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        {formData[key] && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-border-color bg-bg-secondary flex items-center justify-center shrink-0">
                            <img
                              src={
                                formData[key]
                                  ? (formData[key].startsWith('http')
                                    ? formData[key]
                                    : `https://localhost:5173${formData[key]}`)
                                  : '/SirMehtabPhoto.png'
                              }
                              alt="Section Preview"
                              className="w-full h-full object-contain p-1 bg-white"
                              onError={(e) => {
                                const fallback = window.location.origin + '/SirMehtabPhoto.png';
                                if (e.target.src !== fallback) {
                                  e.target.src = '/SirMehtabPhoto.png';
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="grow">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              try {
                                showToast('Uploading image...', 'info');
                                const imgData = new FormData();
                                imgData.append('image', file);
                                const res = await api.post('/content/upload-image', imgData, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (res.data?.success) {
                                  setFormData(prev => ({ ...prev, [key]: res.data.data.url }));
                                  showToast('Image uploaded successfully!', 'success');
                                }
                              } catch (err) {
                                showToast('Failed to upload image.', 'error');
                              }
                            }}
                            className="text-xs font-sans file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                          />
                          <p className="text-[10px] text-text-tertiary mt-1.5">PNG, JPG, WebP, SVG — max 10MB</p>
                        </div>
                      </div>
                    </div>
                  ) : key.includes('paragraph') || key.includes('subheadline') || key.includes('notice') ? (
                    <textarea
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      rows={4}
                      className="w-full p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      className="w-full p-3 border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  )}
                </div>
              ))}
          </div>

          <div className="mt-4 flex">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition-all border-0 shadow-md"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Announcement Form Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">

            {/* Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary m-0">
                {editingId === 'new' ? 'Add Notice Announcement' : 'Edit Announcement'}
              </h3>
              <button
                onClick={() => setEditingId(null)}
                className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAnnouncementSubmit} className="grow flex flex-col overflow-hidden">
              <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Notice Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Board Exams 2026"
                    value={announcementForm.title}
                    onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    required
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Notice Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={announcementForm.link || ''}
                    onChange={e => setAnnouncementForm({ ...announcementForm, link: e.target.value })}
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Notice Message</label>
                  <textarea
                    placeholder="Notice details..."
                    value={announcementForm.text}
                    onChange={e => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                    required
                    rows={3}
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Priority Index</label>
                    <input
                      type="number"
                      placeholder="e.g. 5 (Higher comes first)"
                      value={announcementForm.priority}
                      onChange={e => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      required
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase">Display Order</label>
                    <input
                      type="number"
                      placeholder="e.g. 1 (Lower comes first)"
                      value={announcementForm.display_order}
                      onChange={e => setAnnouncementForm({ ...announcementForm, display_order: e.target.value })}
                      required
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center py-1">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={announcementForm.active}
                      onChange={e => setAnnouncementForm({ ...announcementForm, active: e.target.checked })}
                      className="rounded border-border-color text-primary focus:ring-primary"
                    />
                    <span>Active immediately</span>
                  </label>
                </div>

                <div className="border-t border-border-color my-2 pt-3 flex flex-col gap-3">
                  <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                    <Calendar size={13} /> OPTIONAL SCHEDULING (GMT/UTC)
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xxs font-bold text-text-secondary uppercase">Start Date/Time</label>
                      <input
                        type="datetime-local"
                        value={announcementForm.start_date}
                        onChange={e => setAnnouncementForm({ ...announcementForm, start_date: e.target.value })}
                        className="w-full p-2.5 border border-border-color rounded-lg text-xs font-sans focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xxs font-bold text-text-secondary uppercase">End Date/Time</label>
                      <input
                        type="datetime-local"
                        value={announcementForm.end_date}
                        onChange={e => setAnnouncementForm({ ...announcementForm, end_date: e.target.value })}
                        className="w-full p-2.5 border border-border-color rounded-lg text-xs font-sans focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all">
                  <Save size={16} /> Save Notice
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 border-0 grow cursor-pointer" onClick={() => setEditingId(null)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-border-color flex flex-col gap-4 text-left animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle size={24} />
            </div>

            <h3 className="font-display font-bold text-lg text-text-primary">
              Delete Notice
            </h3>

            <p className="text-text-secondary text-sm leading-relaxed">
              Are you sure you want to permanently delete the notice: <br />
              <span className="font-semibold text-text-primary mt-1 block italic">"{deleteConfirmName}"</span>?
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnnouncementConfirmDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
              >
                Delete Notice
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

      {/* Edit Question Modal */}
      {editingQuestion !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border-color flex flex-col max-h-[90vh] text-left animate-fadeIn">

            {/* Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-border-color flex justify-between items-center shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary m-0">
                Edit Question ID: {editingQuestion.id}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-2 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUpdateQuestionSubmit} className="grow flex flex-col overflow-hidden">
              <div className="grow p-6 md:p-8 overflow-y-auto flex flex-col gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Topic</label>
                  <input
                    type="text"
                    value={questionForm.topic}
                    onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    required
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Question Text</label>
                  <textarea
                    value={questionForm.question}
                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                    required
                    rows={3}
                    className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Options Inputs */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Answer Options</label>
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-tertiary w-6">{String.fromCharCode(65 + idx)})</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...questionForm.options];
                          updated[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                        required
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="grow p-2 border border-border-color rounded-lg font-sans text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-bold text-text-secondary uppercase">Correct Answer Value</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      required
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Select option</option>
                      {questionForm.options.filter(opt => opt.trim() !== '').map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-bold text-text-secondary uppercase">Difficulty</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      required
                      className="w-full p-3 border border-border-color rounded-lg font-sans text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 pt-4 border-t border-border-color flex gap-3 shrink-0 bg-bg-secondary/40">
                <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all">
                  <Save size={16} /> Save Changes
                </button>
                <button type="button" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-bg-secondary text-text-secondary font-bold text-sm rounded-lg hover:bg-slate-200 border-0 grow cursor-pointer" onClick={() => setEditingQuestion(null)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Newsletter Management Panel */}
      {activeTab === 'newsletter' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">

          <div className="p-8 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col gap-6">
            <h3 className="font-display font-bold text-lg text-text-primary capitalize">
              Newsletter Text Settings
            </h3>
            <div className="flex flex-col gap-4">
              {Object.keys(formData).map(key => (
                <div key={key} className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="px-4 py-3 bg-bg-secondary border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 pt-6 border-t border-border-color">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark disabled:opacity-70 transition-all cursor-pointer shadow-sm"
              >
                {saving ? 'Saving...' : <><Save size={18} /> Save Settings</>}
              </button>
            </div>
          </div>

          {/* Analytics Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-border-color rounded-2xl shadow-sm">
              <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block">Total Subscribers</span>
              <span className="font-display font-black text-2xl text-primary mt-1 block">{newsletterAnalytics.total}</span>
            </div>
            <div className="p-4 bg-white border border-border-color rounded-2xl shadow-sm">
              <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block text-emerald-600">Active</span>
              <span className="font-display font-black text-2xl text-emerald-600 mt-1 block">{newsletterAnalytics.active}</span>
            </div>
            <div className="p-4 bg-white border border-border-color rounded-2xl shadow-sm">
              <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block text-amber-500">Deactivated</span>
              <span className="font-display font-black text-2xl text-amber-500 mt-1 block">{newsletterAnalytics.inactive}</span>
            </div>
            <div className="p-4 bg-white border border-border-color rounded-2xl shadow-sm">
              <span className="text-xxs font-extrabold text-text-tertiary uppercase tracking-wider block text-indigo-600">Joined Last 24h</span>
              <span className="font-display font-black text-2xl text-indigo-600 mt-1 block">{newsletterAnalytics.recent24h}</span>
            </div>
          </div>

          {/* Filters, Search and Actions bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-border-color rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 grow">
              {/* Search Bar */}
              <div className="relative grow">
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={subscribersSearch}
                  onChange={(e) => { setSubscribersSearch(e.target.value); setSubscribersPage(1); }}
                  className="w-full p-2.5 pl-9 border border-border-color rounded-xl font-sans text-xs focus:outline-none focus:border-primary"
                />
                <Search size={14} className="absolute left-3 top-3.5 text-text-tertiary" />
              </div>

              {/* Status Filter */}
              <select
                value={subscribersStatus}
                onChange={(e) => { setSubscribersStatus(e.target.value); setSubscribersPage(1); }}
                className="p-2.5 border border-border-color rounded-xl font-sans text-xs focus:outline-none focus:border-primary min-w-[130px]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Export Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-color font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>

          {subscribersLoading ? (
            <div className="p-10 text-center text-text-secondary text-sm">Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-10 text-center bg-white border border-border-color rounded-2xl">
              <Mail size={32} className="text-text-tertiary mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-secondary">No matching subscribers found.</p>
            </div>
          ) : (
            <div className="bg-white border border-border-color rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-color">
                    <th className="px-6 py-3 text-left text-xxs font-extrabold text-text-tertiary uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xxs font-extrabold text-text-tertiary uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xxs font-extrabold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xxs font-extrabold text-text-tertiary uppercase tracking-wider">Subscribed On</th>
                    <th className="px-6 py-3 text-right text-xxs font-extrabold text-text-tertiary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {subscribers.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-text-tertiary font-medium">{(subscribersPage - 1) * subscribersLimit + idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Mail size={13} />
                          </div>
                          <span className="font-medium text-text-primary">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-extrabold border ${sub.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                          {sub.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(sub.created_at || sub.subscribed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Status switch */}
                          <button
                            onClick={() => handleToggleSubscriberStatus(sub.id, sub.status)}
                            className={`px-3 py-1 text-xxs font-bold rounded-lg border transition-all cursor-pointer ${sub.status === 'active'
                              ? 'bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 border-amber-100'
                              : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 border-emerald-100'
                              }`}
                            title={sub.status === 'active' ? 'Deactivate subscription' : 'Reactivate subscription'}
                          >
                            {sub.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            className="p-1.5 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border-0 bg-transparent cursor-pointer"
                            title="Remove subscriber permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {subscribersTotal > subscribersLimit && (
                <div className="p-4 bg-bg-secondary/40 border-t border-border-color flex justify-between items-center gap-4">
                  <span className="text-xxs font-bold text-text-tertiary">
                    Showing {(subscribersPage - 1) * subscribersLimit + 1} - {Math.min(subscribersPage * subscribersLimit, subscribersTotal)} of {subscribersTotal}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSubscribersPage(prev => Math.max(prev - 1, 1))}
                      disabled={subscribersPage === 1}
                      className="p-2 border border-border-color bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setSubscribersPage(prev => Math.min(prev + 1, Math.ceil(subscribersTotal / subscribersLimit)))}
                      disabled={subscribersPage >= Math.ceil(subscribersTotal / subscribersLimit)}
                      className="p-2 border border-border-color bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Newsletter tab remains */}

      {activeTab === 'bank_details' && (
        <div className="flex flex-col gap-8 animate-fadeIn text-left">
          <div className="p-8 rounded-3xl bg-white border border-border-color shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="font-display font-bold text-lg text-text-primary m-0">Global Bank Details</h3>
              <p className="text-text-secondary text-xs md:text-sm mt-1">Configure the bank account details shown to students for course enrollments and certificate payments.</p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-text-secondary ml-1">Bank Name</label>
                <input
                  type="text"
                  value={formData?.bank_name || ''}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className="px-4 py-3 bg-bg-secondary border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Standard Chartered"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-text-secondary ml-1">Account Name</label>
                <input
                  type="text"
                  value={formData?.account_name || ''}
                  onChange={(e) => handleInputChange('account_name', e.target.value)}
                  className="px-4 py-3 bg-bg-secondary border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Calculus Corner Admin"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-text-secondary ml-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={formData?.account_number || ''}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  className="px-4 py-3 bg-bg-secondary border border-border-color rounded-xl font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. 1234-5678-9012"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2 pt-6 border-t border-border-color">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white border-0 font-semibold text-sm rounded-lg hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
              >
                {saving ? 'Saving...' : <><Save size={18} /> Save Bank Details</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import Success Summary Overlay Modal */}
      {importSummary !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border-color p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-display font-bold text-lg text-text-primary m-0">Bulk Import Complete</h3>
            <p className="text-xs text-text-secondary mt-1 font-sans">Your questions have been successfully loaded into the database.</p>

            <div className="my-6 grid grid-cols-3 gap-2">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Imported</span>
                <span className="font-display font-black text-xl text-emerald-700 block mt-1">{importSummary.successCount}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">Skipped</span>
                <span className="font-display font-black text-xl text-amber-700 block mt-1">{importSummary.skipCount}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider block">Failed</span>
                <span className="font-display font-black text-xl text-rose-700 block mt-1">{importSummary.failCount}</span>
              </div>
            </div>

            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-sm border-0 cursor-pointer transition-colors"
            >
              Close & Refresh
            </button>
          </div>
        </div>
      )}

      {/* Generate Quiz Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border-color flex flex-col relative">

            {/* Header - Sticky */}
            <div className="flex justify-between items-center p-6 border-b border-border-color bg-white z-10 sticky top-0 shadow-sm">
              <h3 className="font-display font-black text-2xl text-text-primary m-0">Generate Manual Quiz</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto bg-bg-secondary/20 flex-1">
              {/* Topic Field */}
              <div className="mb-8 p-6 bg-white border border-border-color rounded-2xl shadow-sm">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Topic</label>
                <input
                  type="text"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder="e.g. Derivatives"
                  className="w-full px-4 py-3 rounded-xl border border-border-color font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all shadow-inner"
                />
              </div>

              {/* Quizzes List */}
              <div className="flex flex-col gap-6">
                {manualQuizzes.map((quiz, qIndex) => (
                  <div key={quiz.id} className="p-6 bg-white border border-border-color rounded-2xl shadow-sm relative group transition-all hover:shadow-md hover:border-primary/30">

                    {/* Delete Quiz Button */}
                    {manualQuizzes.length > 1 && (
                      <button
                        onClick={() => {
                          const newQuizzes = [...manualQuizzes];
                          newQuizzes.splice(qIndex, 1);
                          setManualQuizzes(newQuizzes);
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-100 cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Remove Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Question {qIndex + 1} Text</label>
                      <textarea
                        value={quiz.questionText}
                        onChange={(e) => {
                          const newQuizzes = [...manualQuizzes];
                          newQuizzes[qIndex].questionText = e.target.value;
                          setManualQuizzes(newQuizzes);
                        }}
                        placeholder="What is the derivative of..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-border-color font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all shadow-inner resize-y"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Answer Options</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <span className="font-bold text-sm text-text-tertiary w-6">{label})</span>
                            <input
                              type="text"
                              value={quiz.options[optIndex]}
                              onChange={(e) => {
                                const newQuizzes = [...manualQuizzes];
                                newQuizzes[qIndex].options[optIndex] = e.target.value;
                                setManualQuizzes(newQuizzes);
                              }}
                              placeholder={`Option ${label}`}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-border-color font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all shadow-inner"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-color/60">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Correct Answer Value</label>
                        <select
                          value={quiz.correctAnswer}
                          onChange={(e) => {
                            const newQuizzes = [...manualQuizzes];
                            newQuizzes[qIndex].correctAnswer = e.target.value;
                            setManualQuizzes(newQuizzes);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-border-color font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select correct answer</option>
                          {quiz.options.filter(opt => opt.trim() !== '').map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Difficulty</label>
                        <select
                          value={quiz.difficulty}
                          onChange={(e) => {
                            const newQuizzes = [...manualQuizzes];
                            newQuizzes[qIndex].difficulty = e.target.value;
                            setManualQuizzes(newQuizzes);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-border-color font-sans text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                  </div>
                ))}

                {/* Add Another Question Button */}
                <button
                  onClick={() => {
                    setManualQuizzes([...manualQuizzes, {
                      id: Date.now(),
                      questionText: '',
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      difficulty: 'Easy'
                    }]);
                  }}
                  className="py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-2xl hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer bg-white"
                >
                  <Plus size={20} /> Add Another Question
                </button>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 border-t border-border-color bg-white z-10 sticky bottom-0 flex justify-end gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-8 py-3 rounded-xl border border-border-color text-text-secondary font-bold hover:bg-bg-secondary transition-colors cursor-pointer bg-white flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
              <button
                onClick={handleSaveManualQuiz}
                disabled={savingManualQuiz}
                className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-colors cursor-pointer border-0 shadow-md hover:shadow-glow flex items-center gap-2 disabled:opacity-50"
              >
                {savingManualQuiz ? <Loader text="Saving..." size="sm" /> : <Save size={18} />} Save Quizzes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageSiteContent;
