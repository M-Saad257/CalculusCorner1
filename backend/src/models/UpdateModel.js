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

  async create(title, content, category = 'General') {
    const [result] = await db.query(
      'INSERT INTO updates (title, content, category) VALUES (?, ?, ?)',
      [title, content, category]
    );
    return result.insertId;
  },

  async update(id, title, content, category = 'General') {
    const [result] = await db.query(
      'UPDATE updates SET title = ?, content = ?, category = ? WHERE id = ?',
      [title, content, category, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM updates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = UpdateModel;
