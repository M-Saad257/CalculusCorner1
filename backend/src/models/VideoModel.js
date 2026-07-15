const db = require('../config/db');

const VideoModel = {
  async getAll() {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, thumbnail, category, created_at AS createdAt FROM videos ORDER BY created_at DESC'
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, thumbnail, category, subcategory, created_at AS createdAt FROM videos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async getByVideoId(videoId) {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, thumbnail, category, subcategory, created_at AS createdAt FROM videos WHERE video_id = ?',
      [videoId]
    );
    return rows[0] || null;
  },

  async create(title, url, videoId, thumbnail, category, subcategory = null) {
    const [result] = await db.query(
      'INSERT INTO videos (title, url, video_id, thumbnail, category, subcategory) VALUES (?, ?, ?, ?, ?, ?)',
      [title, url, videoId, thumbnail, category || 'Calculus', subcategory]
    );
    return result.insertId;
  },

  async update(id, title, url, videoId, thumbnail, category, subcategory = null) {
    const [result] = await db.query(
      'UPDATE videos SET title = ?, url = ?, video_id = ?, thumbnail = ?, category = ?, subcategory = ? WHERE id = ?',
      [title, url, videoId, thumbnail, category || 'Calculus', subcategory, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM videos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM videos');
    return rows[0].count;
  }
};

module.exports = VideoModel;
