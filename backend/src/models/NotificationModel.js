const db = require('../config/db');

const NotificationModel = {
  async create(userId, title, text, type, role = 'student') {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, text, type, role, is_read) VALUES (?, ?, ?, ?, ?, 0)',
      [userId, title, text, type, role]
    );
    return result.insertId;
  },

  async getByUserId(userId) {
    const [rows] = await db.query(
      'SELECT id, user_id AS userId, title, text, type, role, is_read AS isRead, created_at AS createdAt FROM notifications WHERE (user_id = ? OR (user_id IS NULL AND role = \'student\')) AND role = \'student\' ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async markAsRead(id, userId) {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND role = \'student\'',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL) AND role = \'student\'',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Admin specific notification methods
  async getAdminNotifications() {
    const [rows] = await db.query(
      'SELECT id, user_id AS userId, title, text, type, role, is_read AS isRead, created_at AS createdAt FROM notifications WHERE role = \'admin\' ORDER BY created_at DESC'
    );
    return rows;
  },

  async markAdminAsRead(id) {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND role = \'admin\'',
      [id]
    );
    return result.affectedRows > 0;
  },

  async markAllAdminAsRead() {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE role = \'admin\''
    );
    return result.affectedRows > 0;
  }
};

module.exports = NotificationModel;
