const SupportMessageModel = require('../models/SupportMessageModel');
const UserModel = require('../models/UserModel');
const { getIO } = require('../socket');

const supportController = {
  /**
   * Get all messages for the currently logged-in student.
   */
  async getMessages(req, res, next) {
    try {
      const studentId = req.user.id;
      const messages = await SupportMessageModel.getByStudentId(studentId);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Student sends a support message.
   */
  async sendMessage(req, res, next) {
    try {
      const studentId = req.user.id;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400);
        throw new Error('Message content cannot be empty.');
      }

      await SupportMessageModel.create(studentId, 'student', message.trim());

      // Broadcast to all admins via socket in real time
      try {
        const io = getIO();
        const profile = await UserModel.getProfile(studentId);
        const name = profile ? profile.name : req.user.username;
        
        io.to('admins').emit('support:message', {
          studentId,
          studentName: name,
          studentEmail: profile ? profile.email : req.user.email,
          senderRole: 'student',
          message: message.trim(),
          createdAt: new Date()
        });

        // Also create a persistent notification for admins
        const NotificationModel = require('../models/NotificationModel');
        const notifId = await NotificationModel.create(
          studentId,
          `New Message from ${name}`,
          `${message.substring(0, 50)}...`,
          'support',
          'admin'
        );

        io.to('admins').emit('notification:new', {
          id: notifId,
          userId: studentId,
          title: `New Message from ${name}`,
          text: `${message.substring(0, 50)}...`,
          type: 'support',
          role: 'admin',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
      } catch (socketErr) {
        console.error('Socket broadcast failed for support message:', socketErr.message);
      }

      res.status(201).json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all unique students who have conversations with support.
   */
  async getChatStudents(req, res, next) {
    try {
      const students = await SupportMessageModel.getChatStudents();
      res.status(200).json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all messages in a specific student's thread (Admin view).
   */
  async getStudentMessages(req, res, next) {
    try {
      const { studentId } = req.params;
      const messages = await SupportMessageModel.getByStudentId(studentId);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin replies to a student.
   */
  async replyToStudent(req, res, next) {
    try {
      const { studentId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400);
        throw new Error('Reply message cannot be empty.');
      }

      await SupportMessageModel.create(studentId, 'admin', message.trim());

      // Broadcast to the specific student's private room and to other connected admins
      try {
        const io = getIO();
        const payload = {
          studentId: parseInt(studentId),
          senderRole: 'admin',
          message: message.trim(),
          createdAt: new Date()
        };
        io.to(`student-${studentId}`).emit('support:message', payload);
        io.to('admins').emit('support:message', payload);
        
        // Create persistent notification for student
        const NotificationModel = require('../models/NotificationModel');
        const notifId = await NotificationModel.create(
          studentId,
          'New message from Support',
          `${message.substring(0, 50)}...`,
          'support',
          'student'
        );

        io.to(`student-${studentId}`).emit('notification:new', {
          id: notifId,
          userId: studentId,
          title: 'New message from Support',
          text: `${message.substring(0, 50)}...`,
          type: 'support',
          role: 'student',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
      } catch (socketErr) {
        console.error('Socket broadcast failed for support reply:', socketErr.message);
      }

      res.status(201).json({ success: true, message: 'Reply sent successfully.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = supportController;
