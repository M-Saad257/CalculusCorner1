const db = require('../config/db');

const UpdateModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM updates ORDER BY created_at DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM updates WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(title, content, category = 'General', link = null, image = null) {
    const [result] = await db.query(
      'INSERT INTO updates (title, content, category, link, image) VALUES (?, ?, ?, ?, ?)',
      [title, content, category, link || null, image || null]);
    return result.insertId;
  },

  async update(id, title, content, category = 'General', link = null, image = null) {
    const [result] = await db.query(
      'UPDATE updates SET title=?, content=?, category=?, link=?, image=? WHERE id=?',
      [
        title,
        content,
        category,
        link || null,
        image || null,
        id
      ]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM updates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = UpdateModel;
