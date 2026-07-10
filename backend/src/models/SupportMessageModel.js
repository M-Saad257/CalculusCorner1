const db = require('../config/db');

const SupportMessageModel = {
  async create(studentId, senderRole, message) {
    const [result] = await db.query(
      'INSERT INTO support_messages (student_id, sender_role, message) VALUES (?, ?, ?)',
      [studentId, senderRole, message]
    );
    return result.insertId;
  },

  async getByStudentId(studentId) {
    const [rows] = await db.query(
      'SELECT * FROM support_messages WHERE student_id = ? ORDER BY created_at ASC',
      [studentId]
    );
    return rows;
  },

  async getChatStudents() {
    const [rows] = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email,
        (SELECT message FROM support_messages WHERE student_id = u.id ORDER BY created_at DESC LIMIT 1) AS lastMessage,
        (SELECT created_at FROM support_messages WHERE student_id = u.id ORDER BY created_at DESC LIMIT 1) AS lastMessageAt
      FROM users u
      JOIN support_messages sm ON u.id = sm.student_id
      ORDER BY lastMessageAt DESC
    `);
    return rows;
  }
};

module.exports = SupportMessageModel;
