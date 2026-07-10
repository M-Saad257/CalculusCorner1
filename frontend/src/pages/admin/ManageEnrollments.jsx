import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, AlertCircle, Clock } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ManageEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, confirm } = useDialog();

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/enrollments');
      if (res.data && res.data.success) {
        setEnrollments(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load pending enrollments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const refreshData = () => fetchEnrollments();
    
    const handleNotification = (notif) => {
      if (notif.type === 'enrollment') refreshData();
    };
    
    socket.on('admin:enrollment-approved', refreshData);
    socket.on('admin:enrollment:update', refreshData);
    socket.on('notification:new', handleNotification);
    
    return () => {
      socket.off('admin:enrollment-approved', refreshData);
      socket.off('admin:enrollment:update', refreshData);
      socket.off('notification:new', handleNotification);
    };
  }, [socket]);

  const handleApprove = async (enrollmentId) => {
    const isConfirmed = await confirm(
      'Approve Enrollment',
      'Are you sure you want to approve this enrollment? This grants the student access to the course content.',
      {
        confirmLabel: 'Approve',
        cancelLabel: 'Cancel'
      }
    );

    if (!isConfirmed) return;

    try {
      const res = await api.put(`/admin/enrollments/${enrollmentId}/approve`);
      if (res.data && res.data.success) {
        showToast('Enrollment approved successfully!', 'success');
        fetchEnrollments();
      }
    } catch (err) {
      showToast('Failed to approve enrollment. Please try again.', 'error');
    }
  };

  const handleReject = async (enrollmentId) => {
    const isConfirmed = await confirm(
      'Reject Enrollment',
      'Are you sure you want to reject this enrollment? The student will be notified.',
      {
        confirmLabel: 'Reject',
        cancelLabel: 'Cancel'
      }
    );

    if (!isConfirmed) return;

    try {
      const res = await api.put(`/admin/enrollments/${enrollmentId}/reject`);
      if (res.data && res.data.success) {
        showToast('Enrollment rejected successfully!', 'success');
        fetchEnrollments();
      }
    } catch (err) {
      showToast('Failed to reject enrollment. Please try again.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-48 text-primary font-semibold text-sm">Loading pending enrollments...</div>;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary">Pending Enrollments</h2>
        <p className="text-text-secondary text-xs md:text-sm">Review and approve course enrollments after verifying bank payments.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle className="text-emerald-400" size={48} />
            <h3 className="font-display font-bold text-lg text-text-primary m-0">No Enrollments Yet</h3>
            <p className="text-sm text-text-secondary">There are no course enrollments in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-secondary border-b border-border-color text-xs uppercase text-text-secondary font-bold tracking-wider">
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Type / Course</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Requested At</th>
                  <th className="p-4 pr-6 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.enrollmentId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm text-text-primary">{enrollment.studentName}</span>
                        <span className="text-xs text-text-secondary">{enrollment.studentEmail}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-primary">{enrollment.type}</span>
                        <span className="font-semibold text-sm text-text-primary">{enrollment.courseTitle}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 bg-amber-50 text-amber-600 font-bold text-xs rounded border border-amber-100">
                        {enrollment.type === 'Certificate Request' ? enrollment.certificate_price : enrollment.coursePrice}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                        <Clock size={12} />
                        {new Date(enrollment.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {(enrollment.status === 'pending_payment' || enrollment.certificate_status === 'pending_payment') ? (
                          <>
                            <button
                              onClick={() => handleApprove(enrollment.enrollmentId)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold text-xs rounded-lg transition-colors border-0 cursor-pointer"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(enrollment.enrollmentId)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold text-xs rounded-lg transition-colors border-0 cursor-pointer"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded-lg">
                            <CheckCircle size={14} /> Approved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEnrollments;
