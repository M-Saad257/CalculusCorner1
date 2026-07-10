const db = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async createStudent(name, email, hashedPassword) {
    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert User
      const [userResult] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "student")',
        [name, email, hashedPassword]
      );
      const userId = userResult.insertId;

      // Insert Profile
      await connection.query(
        'INSERT INTO students_profile (user_id, bio, avatar, progress) VALUES (?, NULL, NULL, ?)',
        [userId, JSON.stringify({})]
      );

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getStudentsCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    return rows[0].count;
  },

  async getAllStudents() {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.status, u.created_at, sp.bio, sp.avatar, sp.progress,
             u.isBanned, u.banReason, u.bannedAt, u.bannedBy, u.restore_notified,
             (SELECT COUNT(*) FROM unban_requests WHERE student_id = u.id AND status = 'pending') > 0 AS hasPendingUnbanRequest,
             (SELECT message FROM unban_requests WHERE student_id = u.id AND status = 'pending' ORDER BY created_at DESC LIMIT 1) AS pendingUnbanMessage,
             (SELECT id FROM unban_requests WHERE student_id = u.id AND status = 'pending' ORDER BY created_at DESC LIMIT 1) AS pendingUnbanRequestId
      FROM users u
      LEFT JOIN students_profile sp ON u.id = sp.user_id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `);
    return rows;
  },

  async updateStudent(id, name, email) {
    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ? AND role = "student"',
      [name, email, id]
    );
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE id = ? AND role = "student"',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  async deleteStudent(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ? AND role = "student"', [id]);
    return result.affectedRows > 0;
  },

  async banStudent(id, reason, bannedBy) {
    const [result] = await db.query(
      'UPDATE users SET isBanned = 1, banReason = ?, bannedAt = CURRENT_TIMESTAMP, bannedBy = ?, restore_notified = 0 WHERE id = ? AND role = "student"',
      [reason, bannedBy, id]
    );
    return result.affectedRows > 0;
  },

  async unbanStudent(id) {
    const [result] = await db.query(
      'UPDATE users SET isBanned = 0, banReason = NULL, bannedAt = NULL, bannedBy = NULL, restore_notified = 1 WHERE id = ? AND role = "student"',
      [id]
    );
    return result.affectedRows > 0;
  },

  async clearRestoreNotified(id) {
    const [result] = await db.query(
      'UPDATE users SET restore_notified = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async getProfile(userId) {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, sp.bio, sp.avatar, sp.progress,
             u.isBanned, u.banReason, u.bannedAt, u.bannedBy, u.restore_notified
      FROM users u
      LEFT JOIN students_profile sp ON u.id = sp.user_id
      WHERE u.id = ?
    `, [userId]);
    return rows[0] || null;
  },

  async updateProfile(userId, bio, avatar) {
    const [result] = await db.query(
      'UPDATE students_profile SET bio = ?, avatar = ? WHERE user_id = ?',
      [bio, avatar, userId]
    );
    return result.affectedRows > 0;
  },

  async updateProgress(userId, progress) {
    const [result] = await db.query(
      'UPDATE students_profile SET progress = ? WHERE user_id = ?',
      [JSON.stringify(progress), userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = UserModel;
