const CourseModel = require('../../models/CourseModel');
const ResourceModel = require('../../models/ResourceModel');
const VideoModel = require('../../models/VideoModel');
const AiModel = require('../../models/AiModel');
const NotificationModel = require('../../models/NotificationModel');
const db = require('../../config/db');

// In-memory registry of online students: userId -> user metadata
const onlineUsers = new Map();

// In-memory rate limiting map: socketId -> event -> timestamps/counts
const rateLimits = new Map();

const isRateLimited = (socketId, eventType, limit, windowMs) => {
  const now = Date.now();
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, {});
  }
  const socketLimits = rateLimits.get(socketId);
  if (!socketLimits[eventType]) {
    socketLimits[eventType] = [];
  }

  // Filter timestamps within the current sliding window
  socketLimits[eventType] = socketLimits[eventType].filter(time => now - time < windowMs);

  if (socketLimits[eventType].length >= limit) {
    return true;
  }

  socketLimits[eventType].push(now);
  return false;
};

// Helper to compile platform analytics
const getAnalyticsData = async () => {
  try {
    const [studentRows] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [annRows] = await db.query("SELECT COUNT(*) as count FROM announcements");
    
    const coursesCount = await CourseModel.getCount();
    const resourcesCount = await ResourceModel.getCount();
    const videosCount = await VideoModel.getCount();
    const aiStats = await AiModel.getAnalytics();

    return {
      studentsCount: studentRows[0].count,
      announcementsCount: annRows[0].count,
      coursesCount,
      resourcesCount,
      videosCount,
      aiSessionsCount: aiStats.totalConversations,
      aiMessagesCount: aiStats.totalMessages,
      activeUsersCount: onlineUsers.size
    };
  } catch (err) {
    console.error('Error fetching analytics for socket:', err.message);
    return null;
  }
};

const sendUpdatedDashboardStats = async (io) => {
  const stats = await getAnalyticsData();
  if (stats) {
    io.to('admins').emit('dashboard:update', stats);
  }
};

const handleUserConnect = async (io, socket) => {
  const { id, email, role, username } = socket.user;

  // Track student connections
  if (role === 'student') {
    // If student has multiple tabs, increment connection count
    if (onlineUsers.has(id)) {
      const existingUser = onlineUsers.get(id);
      existingUser.connections.add(socket.id);
    } else {
      onlineUsers.set(id, {
        id,
        email,
        username,
        role,
        currentPath: '/dashboard',
        currentTab: 'courses',
        lastActive: new Date(),
        connections: new Set([socket.id])
      });
      
      // Notify admins that student is online
      io.to('admins').emit('user:online', {
        id,
        username,
        email,
        currentPath: '/dashboard',
        currentTab: 'courses'
      });
    }
  }

  // Push latest metrics to admins on connection
  await sendUpdatedDashboardStats(io);
  
  // Send active users list to the newly connected admin
  if (role === 'admin') {
    const activeList = Array.from(onlineUsers.values()).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      currentPath: u.currentPath,
      currentTab: u.currentTab,
      lastActive: u.lastActive
    }));
    socket.emit('user:activity', activeList);
  }
};

const handleUserDisconnect = async (io, socket) => {
  const { id, role, username } = socket.user;

  if (role === 'student' && onlineUsers.has(id)) {
    const user = onlineUsers.get(id);
    user.connections.delete(socket.id);

    // Clean up if all connections/tabs for this user closed
    if (user.connections.size === 0) {
      onlineUsers.delete(id);
      io.to('admins').emit('user:offline', { id, username });
    }
  }

  // Clean rate limits
  rateLimits.delete(socket.id);

  await sendUpdatedDashboardStats(io);
};

const handleUserActivity = async (io, socket, data) => {
  const { id, role } = socket.user;
  const { path, tab } = data || {};

  // Rate limit activity emissions (max 10 every 5 seconds) to prevent spam
  if (isRateLimited(socket.id, 'activity', 10, 5000)) {
    return;
  }

  if (role === 'student' && onlineUsers.has(id)) {
    const user = onlineUsers.get(id);
    user.currentPath = path || '/dashboard';
    user.currentTab = tab || 'courses';
    user.lastActive = new Date();

    // Broadcast updated activity list to admins
    const activeList = Array.from(onlineUsers.values()).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      currentPath: u.currentPath,
      currentTab: u.currentTab,
      lastActive: u.lastActive
    }));
    io.to('admins').emit('user:activity', activeList);
  }
};

const handleNewAiSession = async (io, socket, data, callback) => {
  const { id } = socket.user;
  const { title = 'New Calculus Session' } = data || {};

  // Rate limit: max 3 sessions per minute
  if (isRateLimited(socket.id, 'ai:new-session', 3, 60000)) {
    if (callback) callback({ success: false, error: 'Rate limit exceeded. Please wait a moment.' });
    return;
  }

  try {
    const conversationId = await AiModel.createConversation(id, title);
    if (callback) {
      callback({ success: true, conversationId });
    }
    
    // Broadcast live usage update
    await sendUpdatedDashboardStats(io);
  } catch (err) {
    console.error('Socket AI session creation error:', err.message);
    if (callback) callback({ success: false, error: 'Database failure' });
  }
};

const handleNewAiMessage = async (io, socket, data, callback) => {
  const { conversationId, message, mockStepsResponse } = data || {};

  // Rate limit: max 20 messages per minute
  if (isRateLimited(socket.id, 'ai:new-message', 20, 60000)) {
    if (callback) callback({ success: false, error: 'Rate limit exceeded.' });
    return;
  }

  if (!conversationId || !message) {
    if (callback) callback({ success: false, error: 'Invalid message request' });
    return;
  }

  try {
    // 1. Save user query
    await AiModel.createMessage(conversationId, 'user', message);

    // 2. Save simulated AI answer
    const simulatedSteps = mockStepsResponse || ['Problem received.', 'Steps saved to history.'];
    await AiModel.createMessage(conversationId, 'ai', JSON.stringify(simulatedSteps));

    if (callback) {
      callback({ success: true });
    }

    // Push updated metrics
    await sendUpdatedDashboardStats(io);
    io.to('admins').emit('ai:usage-update', { conversationId, sender: socket.user.username });
  } catch (err) {
    console.error('Socket AI message creation error:', err.message);
    if (callback) callback({ success: false, error: 'Database failure' });
  }
};

const handleNotificationRead = async (io, socket, data, callback) => {
  const { notificationId } = data || {};
  if (!notificationId) {
    if (callback) callback({ success: false, error: 'Notification ID required' });
    return;
  }

  try {
    await NotificationModel.markAsRead(notificationId, socket.user.id);
    if (callback) {
      callback({ success: true });
    }
    socket.emit('notification:read', { notificationId });
  } catch (err) {
    console.error('Socket mark notification read error:', err.message);
    if (callback) callback({ success: false, error: 'Database failure' });
  }
};

module.exports = {
  handleUserConnect,
  handleUserDisconnect,
  handleUserActivity,
  handleNewAiSession,
  handleNewAiMessage,
  handleNotificationRead,
  sendUpdatedDashboardStats
};
