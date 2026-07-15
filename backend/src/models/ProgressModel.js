const db = require('../config/db');

const ProgressModel = {
  // --- Video Progress ---
  
  async upsertVideoProgress(userId, videoId, progressPercent) {
    const isCompleted = progressPercent >= 90.0 ? 1 : 0;
    
    // UPSERT (Insert or Update)
    const [result] = await db.query(
      `INSERT INTO video_progress (user_id, video_id, progress_percent, is_completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       progress_percent = GREATEST(progress_percent, ?),
       is_completed = IF(progress_percent >= 90.0, 1, is_completed),
       last_watched_at = CURRENT_TIMESTAMP`,
      [userId, videoId, progressPercent, isCompleted, progressPercent]
    );
    return result;
  },

  async getVideoProgress(userId, videoId) {
    const [rows] = await db.query(
      'SELECT progress_percent, is_completed, last_watched_at FROM video_progress WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );
    return rows[0] || null;
  },

  async getRecentlyWatchedVideos(userId, limit = 5) {
    const [rows] = await db.query(
      `SELECT vp.progress_percent, vp.is_completed, vp.last_watched_at, v.*
       FROM video_progress vp
       JOIN videos v ON vp.video_id = v.id
       WHERE vp.user_id = ?
       ORDER BY vp.last_watched_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  // --- Course Progress ---

  async upsertCourseProgress(userId, courseId, progressPercent) {
    const isCompleted = progressPercent >= 100.0 ? 1 : 0;
    
    const [result] = await db.query(
      `INSERT INTO course_progress (user_id, course_id, progress_percent, is_completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       progress_percent = GREATEST(progress_percent, ?),
       is_completed = IF(progress_percent >= 100.0, 1, is_completed),
       last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, courseId, progressPercent, isCompleted, progressPercent]
    );
    return result;
  },

  async getCourseProgress(userId, courseId) {
    const [rows] = await db.query(
      'SELECT progress_percent, is_completed, last_accessed_at FROM course_progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return rows[0] || null;
  },

  async getAllCourseProgress(userId) {
    const [rows] = await db.query(
      'SELECT course_id, progress_percent, is_completed, last_accessed_at FROM course_progress WHERE user_id = ?',
      [userId]
    );
    return rows;
  }
};

module.exports = ProgressModel;
