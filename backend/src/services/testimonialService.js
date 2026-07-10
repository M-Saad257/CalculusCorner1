const db = require('../config/db');

const getAllTestimonials = async (status = null) => {
  let query = 'SELECT * FROM testimonials';
  const params = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY id DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

const getTestimonialByStudentId = async (studentId) => {
  const [rows] = await db.query('SELECT * FROM testimonials WHERE student_id = ?', [studentId]);
  return rows[0] || null;
};

const createTestimonial = async (data) => {
  const { name, role, text, rating, status, student_id } = data;
  const [result] = await db.query(
    'INSERT INTO testimonials (name, role, text, rating, status, student_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, role, text, rating || 5, status || 'approved', student_id || null]
  );
  return result.insertId;
};

const updateTestimonialStatus = async (id, status) => {
  const [result] = await db.query('UPDATE testimonials SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

const deleteTestimonial = async (id) => {
  const [result] = await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllTestimonials,
  getTestimonialByStudentId,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial
};
