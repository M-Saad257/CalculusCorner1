import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { socketService } from '../services/socketService';
import { useDialog } from './DialogContext';
import api from '../services/api';

export const SocketContext = createContext(null);

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('offline'); // 'connected' | 'reconnecting' | 'offline'
  const { showToast, alert: showAlert } = useDialog();
  
  // Student notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Admin live states
  const [activeUsers, setActiveUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  // Fetch notifications from HTTP endpoint based on user role
  const fetchNotifications = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isAdmin = user && user.role === 'admin';
      const endpoint = isAdmin ? '/admin/notifications' : '/student/notifications';

      const res = await api.get(endpoint);
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setStatus('offline');
    setNotifications([]);
    setUnreadCount(0);
    setActiveUsers([]);
    setAdminStats(null);
  }, []);

  const connectSocket = useCallback((token) => {
    const decoded = decodeToken(token) || { role: 'guest' };

    const sock = socketService.connect(token);
    setSocket(sock);

    sock.on('connect', () => {
      setStatus('connected');

      if (decoded.role === 'student' || decoded.role === 'admin') {
        fetchNotifications();
      }

      if (decoded.role === 'student') {
        // Emit initial user activity page
        sock.emit('user:activity', { path: window.location.pathname, tab: 'courses' });
      }
    });

    sock.on('disconnect', (reason) => {
      setStatus('offline');
    });

    sock.on('connect_error', (err) => {
      setStatus('offline');
    });

    sock.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    // Student specific listeners
    if (decoded.role === 'student') {
      sock.on('notification:new', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        showToast(newNotification.title, 'success');

        // Optional: show browser native notification or in-app toast
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, { body: newNotification.text });
        }
      });

      sock.on('notification:read', ({ notificationId }) => {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      sock.on('auth:banned', async (data) => {
        const result = await showAlert('Account Banned', data.message || 'Your account has been banned.', {
          danger: true,
          extraLabel: 'Request Unban'
        });

        if (result === 'extra') {
          try {
            await api.post('/student/unban-request', {
              message: 'Automatic appeal submitted via ban alert popup.',
              reason: 'other',
              additionalExplanation: 'The user requested an unban directly from the socket ban alert popup.'
            });
            await showAlert('Request Submitted', 'Your unban request has been submitted successfully. Admin will review it.');
          } catch (err) {
            const errMsg = err.response?.data?.message || 'Unable to submit your unban request.';
            await showAlert('Submission Failed', errMsg, { danger: true });
          }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        window.location.href = '/auth';
      });

      sock.on('auth:deleted', async (data) => {
        await showAlert('Account Deleted', data.message || 'Your account has been deleted.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        window.location.href = '/auth';
      });
    }

    // Admin specific listeners
    if (decoded.role === 'admin') {
      sock.on('notification:new', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        showToast(newNotification.title, 'success');

        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, { body: newNotification.text });
        }
      });

      sock.on('notification:read', ({ notificationId }) => {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      sock.on('user:activity', (activeList) => {
        setActiveUsers(activeList);
      });

      sock.on('user:online', (user) => {
        setActiveUsers(prev => {
          if (prev.find(u => u.id === user.id)) return prev;
          return [...prev, user];
        });
      });

      sock.on('user:offline', ({ id }) => {
        setActiveUsers(prev => prev.filter(u => u.id !== id));
      });

      sock.on('dashboard:update', (stats) => {
        setAdminStats(stats);
      });

      sock.on('site:logo-update', (logoData) => {
        window.dispatchEvent(new CustomEvent('siteLogoUpdated', { detail: logoData }));
      });
    }
  }, [fetchNotifications, disconnectSocket]);

  // Handle auto-connection on page load/token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    connectSocket(token);
    return () => {
      socketService.disconnect();
    };
  }, [connectSocket]);

  // Student action triggers
  const emitActivity = useCallback((path, tab) => {
    if (socket && status === 'connected') {
      socket.emit('user:activity', { path, tab });
    }
  }, [socket, status]);

  const markNotificationRead = useCallback(async (notificationId) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isAdmin = user && user.role === 'admin';
      const endpoint = isAdmin ? `/admin/notifications/${notificationId}/read` : `/student/notifications/${notificationId}/read`;

      const res = await api.put(endpoint);
      if (res.data && res.data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (socket && status === 'connected') {
          socket.emit('notification:read', { notificationId });
        }
      }
    } catch (err) {
    }
  }, [socket, status]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isAdmin = user && user.role === 'admin';
      const endpoint = isAdmin ? '/admin/notifications/read-all' : '/student/notifications/read-all';

      const res = await api.put(endpoint);
      if (res.data && res.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        status,
        notifications,
        unreadCount,
        activeUsers,
        adminStats,
        connectSocket,
        disconnectSocket,
        emitActivity,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
