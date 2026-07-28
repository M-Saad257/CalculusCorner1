const db = require('../config/db');

const ProgressModel = {
  // --- Video Progress ---

  async upsertVideoProgress(userId, videoId, progressPercent, lastPosition = 0) {
    const isCompleted = progressPercent >= 90.0 ? 1 : 0;

    // UPSERT (Insert or Update)
    const [result] = await db.query(
      `INSERT INTO video_progress (user_id, video_id, progress_percent, is_completed, last_position)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       progress_percent = ?,
       is_completed = IF(? >= 90.0, 1, 0),
       last_position = ?,
       last_watched_at = CURRENT_TIMESTAMP`,
      [userId, videoId, progressPercent, isCompleted, lastPosition, progressPercent, progressPercent, lastPosition]
    );
    return result;
  },

  async getVideoProgress(userId, videoId) {
    const [rows] = await db.query(
      'SELECT progress_percent, is_completed, last_position, last_watched_at FROM video_progress WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );
    return rows[0] || null;
  },

  async getRecentlyWatchedVideos(userId, limit = 5) {
    const [rows] = await db.query(
      `SELECT vp.progress_percent, vp.is_completed, vp.last_position, vp.last_watched_at,
              v.id AS id, v.title, v.url, v.video_id AS videoId, v.video_id AS video_id, v.duration, v.thumbnail, v.category, v.subcategory
       FROM video_progress vp
       JOIN videos v ON vp.video_id = v.id
       WHERE vp.user_id = ? AND vp.progress_percent > 0
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

  async getSyllabusProgress(userId, category) {

    const [totalRows] = await db.query(
      `SELECT COUNT(*) total
         FROM videos
         WHERE category = ?`,
      [category]
    );

    const totalLectures = totalRows[0].total;

    const [completedRows] = await db.query(
      `SELECT COUNT(*) completed
         FROM video_progress vp
         JOIN videos v ON vp.video_id = v.id
         WHERE vp.user_id = ?
         AND vp.progress_percent >= 10
         AND v.category = ?`,
      [userId, category]
    );

    const completedLectures = completedRows[0].completed;

    return {
      completedLectures,
      totalLectures,
      progressPercent:
        totalLectures === 0
          ? 0
          : Math.round((completedLectures / totalLectures) * 100)
    };
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

