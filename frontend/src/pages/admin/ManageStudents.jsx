import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserMinus, Search, AlertCircle, ShieldAlert, CheckCircle, MessageSquare, Send, Loader2, Bell, MoreVertical, Star } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const { showToast } = useDialog();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unbanRequests, setUnbanRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [viewingRequestLoading, setViewingRequestLoading] = useState(false);
  const [adminResponses, setAdminResponses] = useState({});

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // Support Chat States
  const [adminTab, setAdminTab] = useState('list'); // 'list' | 'chat'
  const [chatStudents, setChatStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      if (res.data && Array.isArray(res.data.data)) {
        setStudents(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchUnbanRequests();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const paramStudentId = params.get('studentId');
    if (tab === 'chat') {
      setAdminTab('chat');
      fetchChatStudents().then(() => {
        if (paramStudentId) {
          // We need to find the student in chatStudents, or construct a basic student object
          api.get(`/admin/students`).then(res => {
            const stud = res.data?.data?.find(s => String(s.id) === paramStudentId);
            if (stud) {
              setSelectedStudent(stud);
              fetchStudentMessages(stud.id);
            }
          });
        }
      });
    }
  }, [location.search]);

  const fetchUnbanRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get('/admin/students/unban-requests');
      if (res.data && Array.isArray(res.data.data)) {
        setUnbanRequests(res.data.data);
      }
    } catch (err) {
    } finally {
      setRequestsLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (payload) => {
      fetchUnbanRequests();
      fetchStudents();
    };

    const handleStudentUnbanned = (payload) => {
      fetchUnbanRequests();
      fetchStudents();
    };

    socket.on('admin:unban-request', handleNewRequest);
    socket.on('student:unbanned', handleStudentUnbanned);

    return () => {
      socket.off('admin:unban-request', handleNewRequest);
      socket.off('student:unbanned', handleStudentUnbanned);
    };
  }, [socket]);

  const openRequestForStudent = async (student) => {
    try {
      setViewingRequestLoading(true);
      // Try to find locally first
      let request = unbanRequests.find(r => String(r.studentId) === String(student.id));
      if (!request) {
        // Refresh and try again
        await fetchUnbanRequests();
        request = unbanRequests.find(r => String(r.studentId) === String(student.id));
      }
      if (!request) {
        // fallback: inform admin
        showToast('No active unban request found for this student.', 'error');
        return;
      }
      setViewingRequest(request);
    } catch (err) {
      showToast('Failed to load request details', 'error');
    } finally {
      setViewingRequestLoading(false);
    }
  };

  // Support Chat Handlers & Effects
  const fetchChatStudents = async () => {
    try {
      const res = await api.get('/admin/support-messages/students');
      if (res.data && Array.isArray(res.data.data)) {
        setChatStudents(res.data.data);
      }
    } catch (err) {
    }
  };

  const fetchStudentMessages = async (studentId) => {
    try {
      setChatLoading(true);
      const res = await api.get(`/admin/support-messages/${studentId}`);
      if (res.data && Array.isArray(res.data.data)) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !adminChatInput.trim()) return;
    const text = adminChatInput.trim();
    setAdminChatInput('');
    setChatSending(true);
    try {
      const res = await api.post(`/admin/support-messages/${selectedStudent.id}`, { message: text });
      if (res.data && res.data.success) {
        setChatMessages(prev => {
          const hasDuplicate = prev.some(m => m.message === text && m.sender_role === 'admin' && Math.abs(Date.now() - new Date(m.created_at || m.createdAt).getTime()) < 5000);
          if (hasDuplicate) return prev;
          return [...prev, {
            id: Date.now(),
            student_id: selectedStudent.id,
            sender_role: 'admin',
            message: text,
            created_at: new Date().toISOString()
          }];
        });
        fetchChatStudents();
      }
    } catch (err) {
      showToast('Failed to send reply.', 'error');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'chat') {
      fetchChatStudents();
    }
    const parentContainer = document.querySelector('.grow.p-8.overflow-y-auto');
    if (parentContainer) {
      if (adminTab === 'chat') {
        parentContainer.style.overflowY = 'hidden';
      } else {
        parentContainer.style.overflowY = 'auto';
      }
    }
    return () => {
      if (parentContainer) {
        parentContainer.style.overflowY = 'auto';
      }
    };
  }, [adminTab]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentMessages(selectedStudent.id);
    } else {
      setChatMessages([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      fetchChatStudents();

      if (selectedStudent && msg.studentId === selectedStudent.id) {
        setChatMessages(prev => {
          if (prev.find(m => m.id === msg.id || (m.message === msg.message && Math.abs(new Date(m.created_at || m.createdAt) - new Date(msg.createdAt || msg.created_at)) < 2000))) {
            return prev;
          }
          return [...prev, {
            id: msg.id || Date.now(),
            student_id: msg.studentId,
            sender_role: msg.senderRole,
            message: msg.message,
            created_at: msg.createdAt || msg.created_at || new Date().toISOString()
          }];
        });
      }
    };

    socket.on('support:message', handleIncomingMessage);
    return () => {
      socket.off('support:message', handleIncomingMessage);
    };
  }, [socket, selectedStudent]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const refreshStudentData = async () => {
    await Promise.all([fetchStudents(), fetchUnbanRequests()]);
  };

  const handleReviewUnbanRequest = async (requestId, status, adminResponse) => {
    try {
      setReviewingRequestId(requestId);
      const res = await api.put(`/admin/students/unban-requests/${requestId}`, { status, adminResponse });
      if (res.data && res.data.success) {
        showToast(`Unban request ${status.toLowerCase()} successfully.`, 'success');
        await refreshStudentData();
        return true;
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review unban request.', 'error');
    } finally {
      setReviewingRequestId(null);
    }
    return false;
  };

  const handleBan = async (student) => {
    try {
      const res = await api.put(`/admin/students/${student.id}/ban`);
      if (res.data && res.data.success) {
        showToast('Student account banned successfully.', 'success');
        fetchStudents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to ban student account.', 'error');
    }
  };

  const handleUnban = async (student) => {
    try {
      const res = await api.put(`/admin/students/${student.id}/unban`);
      if (res.data && res.data.success) {
        showToast('Student account unbanned successfully.', 'success');
        fetchStudents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unban student account.', 'error');
    }
  };

  const handleRequestReview = async (studentId) => {
    try {
      await api.post(`/admin/students/${studentId}/request-review`);
      showToast('Review request sent to student successfully', 'success');
      setActionMenuOpenId(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send review request', 'error');
    }
  };

  const handleDelete = (student) => {
    setDeleteConfirmId(student.id);
    setDeleteConfirmName(student.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/admin/students/${deleteConfirmId}`);
      if (res.data && res.data.success) {
        showToast('Student account deleted successfully.', 'success');
        fetchStudents();
      }
    } catch (err) {
      showToast('Failed to delete student account. Please try again.', 'error');
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border-color pb-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Manage Students</h2>
          <p className="text-text-secondary text-xs md:text-sm">View, moderate, or revoke student account permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-tertiary/75 p-1 rounded-xl border border-border-color shrink-0">
            <button
              onClick={() => setAdminTab('list')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-all ${adminTab === 'list'
                ? 'bg-bg-color text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-transparent'
                }`}
            >
              Students Register
            </button>
            <button
              onClick={() => setAdminTab('chat')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-all ${adminTab === 'chat'
                ? 'bg-bg-color text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-transparent'
                }`}
            >
              Support Chats
            </button>
          </div>
          {adminTab === 'list' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border-color rounded-xl font-sans text-xs md:text-sm bg-bg-color focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
      </div>

      {adminTab === 'chat' ? (
        <div className="flex flex-col md:flex-row gap-0 md:gap-6 bg-bg-color rounded-3xl border border-border-color shadow-sm overflow-x-hidden overflow-y-auto cc-scroll animate-fadeIn" style={{ height: 'calc(100vh - 305px)' }}>
          {/* Conversations list */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border-color flex flex-col md:h-full max-h-[35vh] md:max-h-none dark:bg-bg-color bg-slate-50/50 text-left shrink-0">
            <div className="p-4 border-b border-border-color/80 bg-bg-color shrink-0">
              <h4 className="font-display font-bold text-sm text-text-primary m-0">Conversations</h4>
              <p className="text-[10px] text-text-secondary m-0 mt-0.5">Students awaiting assistance</p>
            </div>
            <div className="grow overflow-y-auto p-2 flex flex-col gap-1 cc-scroll">
              {chatStudents.length === 0 ? (
                <div className="text-center p-6 text-xs text-text-tertiary my-auto">
                  No active chat support threads.
                </div>
              ) : (
                chatStudents.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-0 text-left cursor-pointer transition-all ${selectedStudent && selectedStudent.id === st.id
                      ? 'bg-primary text-white'
                      : 'bg-transparent text-text-secondary dark:hover:bg-bg-secondary hover:bg-slate-100'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${selectedStudent && selectedStudent.id === st.id
                      ? 'bg-white/20 text-white'
                      : 'dark:bg-indigo-900/40 dark:text-indigo-300 bg-indigo-50 text-primary'
                      }`}>
                      {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="grow overflow-hidden flex flex-col">
                      <span className={`text-xs font-bold ${selectedStudent && selectedStudent.id === st.id ? 'text-white' : 'text-text-primary'
                        }`}>{st.name}</span>
                      <span className={`text-[10px] truncate ${selectedStudent && selectedStudent.id === st.id ? 'text-white/80' : 'text-text-tertiary'
                        }`}>{st.lastMessage}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Thread */}
          <div className="grow flex flex-col h-full min-h-[50vh] md:min-h-0 w-full md:w-auto">
            {!selectedStudent ? (
              <div className="my-auto text-center p-6 text-text-secondary flex flex-col items-center justify-center gap-3">
                <MessageSquare size={32} className="text-text-tertiary/40" />
                <h4 className="font-display font-bold text-sm text-text-primary m-0">No Active Chat selected</h4>
                <p className="text-xs text-text-tertiary max-w-xs m-0">Choose a student from the list on the left to view their appeal and chat history.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full grow">
                {/* Header */}
                <div className="p-4 border-b border-border-color bg-bg-color flex justify-between items-center text-left">
                  <div>
                    <h4 className="font-display font-bold text-sm text-text-primary m-0">{selectedStudent.name}</h4>
                    <p className="text-[10px] text-text-secondary m-0 mt-0.5">{selectedStudent.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-text-tertiary hover:text-text-primary text-[10px] font-bold bg-transparent border-0 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>

                {/* Messages Area */}
                <div className="grow p-6 overflow-y-auto flex flex-col gap-4 bg-bg-secondary/40 text-left">
                  {chatLoading ? (
                    <div className="my-auto text-center p-6 text-xs text-text-secondary">
                      <Loader2 className="animate-spin mx-auto text-primary" size={20} />
                      <p className="mt-1">Loading history...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="my-auto text-center p-6 text-xs text-text-tertiary">
                      No messages in this conversation.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isStudentSender = msg.sender_role === 'student';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-1 max-w-[80%] ${!isStudentSender ? 'self-end items-end' : 'self-start items-start'} animate-fadeIn`}
                        >
                          <div
                            className={`p-3 px-4 rounded-2xl text-xs leading-relaxed ${!isStudentSender
                              ? 'bg-primary text-white rounded-br-sm shadow-sm'
                              : 'bg-bg-color text-text-primary rounded-bl-sm border border-border-color shadow-sm'
                              }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-text-tertiary font-bold px-1 select-none">
                            {new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-4 bg-bg-color border-t border-border-color">
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      value={adminChatInput}
                      onChange={(e) => setAdminChatInput(e.target.value)}
                      placeholder="Type reply to student..."
                      className="grow px-4 py-2.5 border border-border-color rounded-full font-sans text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner transition-all bg-bg-color text-text-primary"
                      disabled={chatSending}
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white border-0 shadow-md cursor-pointer hover:bg-primary-dark disabled:bg-text-tertiary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={chatSending || !adminChatInput.trim()}
                    >
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {unbanRequests.length > 0 && (
            <div className="bg-bg-color rounded-3xl border border-border-color shadow-sm p-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Pending Unban Requests</h3>
                  <p className="text-text-secondary text-xs md:text-sm mt-1">Review student appeals and resolve account restoration without leaving the CMS.</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold uppercase tracking-wider border border-amber-100">
                  {unbanRequests.length} pending request{unbanRequests.length === 1 ? '' : 's'}
                </span>
              </div>

              {requestsLoading ? (
                <div className="text-sm text-text-secondary">Loading requests...</div>
              ) : (
                <div className="grid gap-4">
                  {unbanRequests.map((request) => (
                    <div key={request.id} className="rounded-3xl border border-border-color/70 p-5 bg-bg-secondary/70">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="text-sm font-semibold text-text-primary">{request.studentName} ({request.studentEmail})</div>
                          <div className="text-xs text-text-secondary">Student is requesting an account unban.</div>
                          <div className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Submitted: {new Date(request.created_at || request.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 md:mt-0 shrink-0">
                          <button
                            disabled={reviewingRequestId === request.id}
                            onClick={() => handleReviewUnbanRequest(request.id, 'Approved', '')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer border-0 shadow-sm"
                          >
                            Approve & Unban
                          </button>
                          <button
                            disabled={reviewingRequestId === request.id}
                            onClick={() => handleReviewUnbanRequest(request.id, 'Rejected', '')}
                            className="px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/50 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">
              Loading student registers...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-bg-color border border-border-color rounded-2xl text-text-secondary text-sm">
              No students found matching your search.
            </div>
          ) : (
            <div className="bg-bg-color border border-border-color rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto min-h-[350px] pb-32">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-bg-secondary border-b border-border-color text-left">
                      <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Email Address</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/60">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-bg-secondary/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-primary flex items-center justify-center font-bold text-xs">
                              {student.avatar ? (
                                <img src={student.avatar.startsWith('http') ? student.avatar : `${student.avatar}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                student.name ? student.name.charAt(0).toUpperCase() : 'S'
                              )}
                            </div>
                            <span className="text-sm font-semibold text-text-primary">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-text-secondary font-medium">{student.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.status === 'banned' ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-extrabold bg-red-50 text-red-600 border border-red-100">
                                <ShieldAlert size={10} /> Banned
                              </span>
                              {student.hasPendingUnbanRequest ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                                  <Bell size={10} /> Pending Unban Request
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <CheckCircle size={10} /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right relative">
                          <button
                            onClick={() => setActionMenuOpenId(actionMenuOpenId === student.id ? null : student.id)}
                            className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {actionMenuOpenId === student.id && (
                            <div className="absolute right-6 top-10 w-48 bg-bg-color border border-border-color shadow-lg rounded-xl overflow-hidden z-[999] py-1">
                              {student.status === 'banned' ? (
                                <button
                                  onClick={() => { setActionMenuOpenId(null); handleUnban(student); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-primary hover:bg-bg-tertiary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                                >
                                  <CheckCircle size={14} /> Unban Student
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setActionMenuOpenId(null); handleBan(student); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-600 hover:bg-bg-tertiary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                                >
                                  <ShieldAlert size={14} /> Ban Student
                                </button>
                              )}
                              <button
                                onClick={() => handleRequestReview(student.id)}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-bg-tertiary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                              >
                                <Star size={14} /> Request Review
                              </button>
                              <div className="h-px bg-border-color my-1"></div>
                              <button
                                onClick={() => { setActionMenuOpenId(null); handleDelete(student); }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-bg-tertiary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                              >
                                <UserMinus size={14} /> Delete Student
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-bg-color rounded-3xl p-6 md:p-8 shadow-2xl border border-border-color flex flex-col gap-4 text-left animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle size={24} />
            </div>

            <h3 className="font-display font-bold text-lg text-text-primary">
              Confirm Deletion
            </h3>

            <p className="text-text-secondary text-sm leading-relaxed">
              Are you sure you want to permanently delete the student account for <span className="font-semibold text-text-primary">"{deleteConfirmName}"</span>? This will also remove their profile metadata and learning progress. This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirmDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg border-0 shadow-sm grow cursor-pointer transition-all"
              >
                Delete Account
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

export default ManageStudents;
