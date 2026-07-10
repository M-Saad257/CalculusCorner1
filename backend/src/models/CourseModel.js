const db = require('../config/db');

const CourseModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
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

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
    const row = rows[0] || null;
    if (row) {
      if (row.features && typeof row.features === 'string') {
        try { row.features = JSON.parse(row.features); } catch (e) { row.features = []; }
      }
      if (row.external_drive_links && typeof row.external_drive_links === 'string') {
        try { row.external_drive_links = JSON.parse(row.external_drive_links); } catch (e) { row.external_drive_links = []; }
      }
    }
    return row;
  },

  async create(courseData) {
    const { 
      grade = 'General', 
      title, 
      description, 
      features = [], 
      price = 'Free', 
      popular = 0,
      thumbnail = null,
      external_drive_links = [],
      certificate_price = '0',
      quiz_required = 0
    } = courseData;

    const [result] = await db.query(
      'INSERT INTO courses (grade, title, description, features, price, popular, thumbnail, external_drive_links, certificate_price, quiz_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [grade, title, description, JSON.stringify(features), price, popular, thumbnail, JSON.stringify(external_drive_links), certificate_price, quiz_required ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, courseData) {
    const { 
      grade, 
      title, 
      description, 
      features, 
      price, 
      popular,
      thumbnail,
      external_drive_links,
      certificate_price,
      quiz_required
    } = courseData;

    const [result] = await db.query(
      `UPDATE courses 
       SET grade = ?, title = ?, description = ?, features = ?, price = ?, popular = ?, thumbnail = ?,
           external_drive_links = COALESCE(?, external_drive_links),
           certificate_price = COALESCE(?, certificate_price),
           quiz_required = COALESCE(?, quiz_required)
       WHERE id = ?`,
      [
        grade, title, description, JSON.stringify(features), price, popular, 
        thumbnail !== undefined ? thumbnail : null,
        external_drive_links !== undefined ? JSON.stringify(external_drive_links) : null,
        certificate_price !== undefined ? certificate_price : null,
        quiz_required !== undefined ? (quiz_required ? 1 : 0) : null,
        id
      ]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM courses');
    return rows[0].count;
  }
};

module.exports = CourseModel;
