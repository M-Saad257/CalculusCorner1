const db = require('../config/db');

const findUserByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
};

const findUserByUsernameOrEmail = async (identifier) => {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  return result.insertId;
};

module.exports = {
  findUserByUsername,
  findUserByUsernameOrEmail,
  findUserById,
  createUser
};
