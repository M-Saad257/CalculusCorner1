const db = require('../config/db');

const AnnouncementModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM announcements ORDER BY display_order ASC, priority DESC, created_at DESC');
    return rows;
  },

  async getActive() {
    // Select active announcements. If start_date/end_date exist, check if current timestamp lies within bounds.
    const [rows] = await db.query(`
      SELECT * FROM announcements 
      WHERE active = 1 
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
      ORDER BY display_order ASC, priority DESC, created_at DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM announcements WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ title, text, link, active, priority, start_date, end_date, display_order }) {
    const [result] = await db.query(
      'INSERT INTO announcements (title, text, link, active, priority, start_date, end_date, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title || 'Notice', 
        text, 
        link || null,
        active !== undefined ? (active ? 1 : 0) : 1, 
        priority || 0, 
        start_date || null, 
        end_date || null,
        display_order || 0
      ]
    );
    return result.insertId;
  },

  async update(id, { title, text, link, active, priority, start_date, end_date, display_order }) {
    const [result] = await db.query(
      'UPDATE announcements SET title = ?, text = ?, link = ?, active = ?, priority = ?, start_date = ?, end_date = ?, display_order = ? WHERE id = ?',
      [
        title || 'Notice', 
        text, 
        link || null,
        active !== undefined ? (active ? 1 : 0) : 1, 
        priority || 0, 
        start_date || null, 
        end_date || null,
        display_order || 0,
        id
      ]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = AnnouncementModel;
