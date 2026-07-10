import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';

const NotificationBell = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useSocket();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center" ref={notifRef}>
      <button
        onClick={() => setIsNotifOpen(!isNotifOpen)}
        className="p-2 text-text-secondary hover:text-primary hover:bg-bg-secondary rounded-full bg-transparent border-0 cursor-pointer relative flex items-center justify-center outline-none transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isNotifOpen && (
          <motion.div
            className="absolute -right-14 sm:right-0 top-12 w-[300px] sm:w-80 bg-white border border-border-color rounded-2xl shadow-xl z-50 overflow-hidden text-left"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-secondary/40">
              <span className="font-bold text-sm text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Clear all
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto cc-scroll">
              {(!notifications || notifications.length === 0) ? (
                <div className="p-6 text-center text-xs text-text-tertiary font-semibold">
                  You have no notifications.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-border-color hover:bg-bg-secondary transition-colors cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      if (!notif.isRead) markNotificationRead(notif.id);
                      setIsNotifOpen(false);

                      // Redirect Admin to correct tab
                      if (notif.role === 'admin' && notif.type === 'support') {
                        navigate(`/admin/students?tab=chat&studentId=${notif.userId}`);
                      } else if (notif.role === 'admin' && notif.type === 'enrollment') {
                        navigate(`/admin/enrollments`);
                      }

                      // Redirect Student to correct tab
                      if (notif.role === 'student' && notif.type === 'support') {
                        navigate(`/?tab=support_chat`);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h5 className={`text-xs m-0 ${!notif.isRead ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
                        {notif.title}
                      </h5>
                      <span className="text-[9px] text-text-tertiary whitespace-nowrap ml-2">
                        {new Date(notif.created_at || notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs m-0 leading-relaxed ${!notif.isRead ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                      {notif.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
