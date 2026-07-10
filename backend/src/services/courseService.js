const db = require('../config/db');

const getAllCourses = async () => {
  const [rows] = await db.query('SELECT * FROM courses ORDER BY id ASC');
  return rows.map(row => ({
    ...row,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features
  }));
};

const getCourseById = async (id) => {
  const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    ...row,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features
  };
};

const createCourse = async (courseData) => {
  const { grade, title, description, features, price, popular } = courseData;
  const [result] = await db.query(
    'INSERT INTO courses (grade, title, description, features, price, popular) VALUES (?, ?, ?, ?, ?, ?)',
    [grade, title, description, JSON.stringify(features), price, popular ? 1 : 0]
  );
  return result.insertId;
};

const updateCourse = async (id, courseData) => {
  const { grade, title, description, features, price, popular } = courseData;
  const [result] = await db.query(
    'UPDATE courses SET grade = ?, title = ?, description = ?, features = ?, price = ?, popular = ? WHERE id = ?',
    [grade, title, description, JSON.stringify(features), price, popular ? 1 : 0, id]
  );
  return result.affectedRows > 0;
};

const deleteCourse = async (id) => {
  const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
