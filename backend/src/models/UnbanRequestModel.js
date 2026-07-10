const db = require('../config/db');

/**
 * UnbanRequestModel
 * Status values are lowercase: 'pending', 'approved', 'rejected'
 * Column names follow snake_case convention: student_id, admin_response, reviewed_by, reviewed_at
 */
const UnbanRequestModel = {
  /**
   * Create a new unban request.
   */
  async create(studentId, message, reason = 'other', additionalExplanation = null) {
    const [result] = await db.query(
      `INSERT INTO unban_requests (student_id, message, reason, additional_explanation, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [studentId, message, reason, additionalExplanation || null]
    );
    return result.insertId;
  },

  /**
   * Get the most recent unban request for a student (any status).
   * Used to check if student can submit a new request (only allowed when no 'pending' request exists).
   */
  async getLatestByStudentId(studentId) {
    const [rows] = await db.query(
      `SELECT * FROM unban_requests
       WHERE student_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  },

  /**
   * Get the active (pending) unban request for a student.
   */
  async getPendingByStudentId(studentId) {
    const [rows] = await db.query(
      `SELECT * FROM unban_requests
       WHERE student_id = ? AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  },

  /**
   * Legacy alias for backward compatibility with existing studentController calls.
   */
  async getActiveByStudentId(studentId) {
    return this.getPendingByStudentId(studentId);
  },

  /**
   * Get all unban requests (all statuses) for admin view, joined with user info.
   */
  async getAll() {
    const [rows] = await db.query(`
      SELECT ur.*,
             u.name  AS studentName,
             u.email AS studentEmail,
             rv.name AS reviewedByName
      FROM unban_requests ur
      JOIN users u ON ur.student_id = u.id
      LEFT JOIN users rv ON ur.reviewed_by = rv.id
      ORDER BY ur.created_at DESC
    `);
    return rows;
  },

  /**
   * Get only pending unban requests for admin view.
   */
  async getAllPending() {
    const [rows] = await db.query(`
      SELECT ur.*,
             u.name  AS studentName,
             u.email AS studentEmail
      FROM unban_requests ur
      JOIN users u ON ur.student_id = u.id
      WHERE ur.status = 'pending'
      ORDER BY ur.created_at DESC
    `);
    return rows;
  },

  /**
   * Update request status and optionally store admin response.
   */
  async updateWithResponse(id, status, adminResponse, reviewedBy) {
    const [result] = await db.query(
      `UPDATE unban_requests
       SET status = ?, admin_response = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, adminResponse || null, reviewedBy, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Legacy review method — delegates to updateWithResponse.
   */
  async review(id, status, reviewedBy) {
    return this.updateWithResponse(id, status, null, reviewedBy);
  },

  /**
   * Get a single unban request by ID.
   */
  async getById(id) {
    const [rows] = await db.query(
      `SELECT ur.*, u.name AS studentName, u.email AS studentEmail
       FROM unban_requests ur
       JOIN users u ON ur.student_id = u.id
       WHERE ur.id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = UnbanRequestModel;
