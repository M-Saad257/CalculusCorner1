const db = require('../config/db');

const EnrollmentModel = {
  /**
   * Enroll a student in a course.
   * Returns { enrolled: true } on success, { alreadyEnrolled: true } if duplicate.
   */
  async enrollWithCheck(userId, courseId, paymentScreenshot = null) {
    // Check if already approved or pending
    const [existing] = await db.query(
      'SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ? ORDER BY id DESC LIMIT 1',
      [userId, courseId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'approved') {
        return { alreadyEnrolled: true };
      }
      if (existing[0].status === 'pending_payment') {
        return { alreadyEnrolled: true, pending: true };
      }
      // If status === 'rejected', update the existing row to pending_payment with new screenshot
      await db.query(
        `UPDATE enrollments SET status = 'pending_payment', payment_screenshot = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [paymentScreenshot, existing[0].id]
      );
      return { enrolled: true, enrollmentId: existing[0].id };
    }

    const [result] = await db.query(
      `INSERT INTO enrollments (student_id, course_id, status, payment_screenshot, created_at) VALUES (?, ?, 'pending_payment', ?, CURRENT_TIMESTAMP)`,
      [userId, courseId, paymentScreenshot]
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
   * Check whether an approved student-course enrollment exists.
   */
  async isEnrolled(userId, courseId) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'approved'",
      [userId, courseId]
    );
    return rows[0].count > 0;
  },

  /**
   * Get all course IDs a student is approved in (lightweight check).
   */
  async getEnrolledCourseIds(userId) {
    const [rows] = await db.query(
      "SELECT course_id AS courseId FROM enrollments WHERE student_id = ? AND status = 'approved'",
      [userId]
    );
    return rows.map(r => r.courseId);
  },

  /**
   * Get all pending enrollments for admin, includes payment screenshot.
   */
  async getPendingEnrollments() {
    const [rows] = await db.query(
      `SELECT e.id as enrollmentId, e.student_id, e.course_id, e.created_at, e.status, e.payment_screenshot,
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
