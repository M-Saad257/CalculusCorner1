const db = require('../config/db');

const EnrollmentModel = {
  /**
   * Enroll a student in a course.
   * Uses INSERT IGNORE to prevent duplicate enrollments (requires UNIQUE KEY uq_enrollment on (userId, courseId)).
   * Returns { enrolled: true } on success, { alreadyEnrolled: true } if duplicate.
   */
  async enrollWithCheck(userId, courseId) {
    // First check if already enrolled
    const already = await this.isEnrolled(userId, courseId);
    if (already) {
      return { alreadyEnrolled: true };
    }

    const [result] = await db.query(
      `INSERT INTO enrollments (student_id, course_id, status, created_at) VALUES (?, ?, 'pending_payment', CURRENT_TIMESTAMP)`,
      [userId, courseId]
    );

    if (result.insertId) {
      return { enrolled: true, enrollmentId: result.insertId };
    }

    return { alreadyEnrolled: true };
  },

  /**
   * Direct insert (used internally).
   */
  async enroll(userId, courseId) {
    const [result] = await db.query(
      `INSERT INTO enrollments (student_id, course_id, status, created_at) VALUES (?, ?, 'pending_payment', CURRENT_TIMESTAMP)`,
      [userId, courseId]
    );
    return result.insertId;
  },

  /**
   * Get all enrollments for a student, joined with course data.
   */
  async getByUserId(userId) {
    const [rows] = await db.query(
      `SELECT e.id as enrollmentId, e.student_id, e.course_id, e.created_at AS enrolledAt, e.status, e.certificate_status,
              c.id, c.grade, c.title, c.description, c.features, c.price, c.popular, c.created_at, c.external_drive_links, c.certificate_price, c.quiz_required
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY e.created_at DESC`,
      [userId]
    );
    // Parse features JSON if stored as string
    return rows.map(row => {
      if (row.features && typeof row.features === 'string') {
        try { row.features = JSON.parse(row.features); } catch (e) { row.features = []; }
      }
      if (row.external_drive_links && typeof row.external_drive_links === 'string') {
        try { row.external_drive_links = JSON.parse(row.external_drive_links); } catch (e) { row.external_drive_links = []; }
      }
      return row;
    });
  },

  /**
   * Check whether a specific student-course enrollment exists.
   */
  async isEnrolled(userId, courseId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return rows[0].count > 0;
  },

  /**
   * Get all course IDs a student is enrolled in (lightweight check).
   */
  async getEnrolledCourseIds(userId) {
    const [rows] = await db.query(
      'SELECT course_id AS courseId FROM enrollments WHERE student_id = ?',
      [userId]
    );
    return rows.map(r => r.courseId);
  },

  /**
   * Get all pending enrollments (for admin)
   */
  async getPendingEnrollments() {
    const [rows] = await db.query(
      `SELECT e.id as enrollmentId, e.student_id, e.course_id, e.created_at, e.status,
              u.name as studentName, u.email as studentEmail,
              c.title as courseTitle, c.price as coursePrice
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       JOIN courses c ON c.id = e.course_id
       WHERE e.status = 'pending_payment'
       ORDER BY e.created_at ASC`
    );
    return rows;
  },

  /**
   * Approve an enrollment
   */
  async approveEnrollment(enrollmentId) {
    const [result] = await db.query(
      `UPDATE enrollments SET status = 'approved' WHERE id = ?`,
      [enrollmentId]
    );
    return result.affectedRows > 0;
  },

  /**
   * Complete an enrollment
   */
  async completeEnrollment(enrollmentId) {
    const [result] = await db.query(
      `UPDATE enrollments SET status = 'completed' WHERE id = ?`,
      [enrollmentId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = EnrollmentModel;
