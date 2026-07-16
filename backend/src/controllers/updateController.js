const UpdateModel = require('../models/UpdateModel');
const NotificationModel = require('../models/NotificationModel');
const { sendAnnouncementEmailToSubscribers } = require('../services/emailService');
const { broadcastToAll } = require('../socket');

const updateController = {
  // Public route
  async getUpdates(req, res, next) {
    try {
      const updates = await UpdateModel.getAll();
      res.status(200).json({
        success: true,
        data: updates
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin route to create a new update
  async createUpdate(req, res, next) {
    try {
      const { title, content, category } = req.body;
      if (!title || !content) {
        res.status(400);
        throw new Error('Title and content are required');
      }

      const insertId = await UpdateModel.create(title, content, category || 'General');
      const newUpdate = await UpdateModel.getById(insertId);

      // --- REAL TIME NOTIFICATIONS BROADCAST ---

      // 1. Create a global notification in database for students
      // Setting userId to null and role to 'student' makes it general/public
      let notificationId = null;
      try {
        notificationId = await NotificationModel.create(
          null, 
          `New Update: ${title}`, 
          content.substring(0, 150) + (content.length > 150 ? '...' : ''), 
          'update', 
          'student'
        );
      } catch (err) {
        console.error('Failed to create global notification in database:', err);
      }

      // 2. Broadcast via WebSocket (Real-time update stream)
      try {
        broadcastToAll('update:create', newUpdate);
        if (notificationId) {
          broadcastToAll('notification:new', {
            id: notificationId,
            title: `New Update: ${title}`,
            text: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
            type: 'update',
            role: 'student',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Failed to broadcast real-time updates via WebSockets:', err);
      }

      // 3. Dispatch emails to all active newsletter subscribers (asynchronously)
      try {
        // Fire-and-forget email dispatch so the client response is not delayed
        sendAnnouncementEmailToSubscribers({
          title: `New Update: ${title}`,
          text: content
        }).catch(emailErr => {
          console.error('Asynchronous newsletter mailing error:', emailErr);
        });
      } catch (err) {
        console.error('Newsletter subscribers dispatch error:', err);
      }

      res.status(201).json({
        success: true,
        message: 'Update published successfully and broadcasted in real-time',
        data: newUpdate
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin route to update an existing update
  async updateUpdate(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, category } = req.body;
      if (!title || !content) {
        res.status(400);
        throw new Error('Title and content are required');
      }

      const existing = await UpdateModel.getById(id);
      if (!existing) {
        res.status(404);
        throw new Error('Update not found');
      }

      await UpdateModel.update(id, title, content, category || 'General');
      const updated = await UpdateModel.getById(id);

      // Real-time broadcast
      try {
        broadcastToAll('update:update', updated);
      } catch (err) {
        console.error('Failed to broadcast video update:', err);
      }

      res.status(200).json({
        success: true,
        message: 'Update modified successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin route to delete an update
  async deleteUpdate(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await UpdateModel.getById(id);
      if (!existing) {
        res.status(404);
        throw new Error('Update not found');
      }

      await UpdateModel.delete(id);

      // Real-time broadcast
      try {
        broadcastToAll('update:delete', { id });
      } catch (err) {
        console.error('Failed to broadcast video delete:', err);
      }

      res.status(200).json({
        success: true,
        message: 'Update deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = updateController;
