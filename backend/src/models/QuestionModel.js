const db = require('../config/db');

const QuestionModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM question_pool ORDER BY created_at DESC');
    return rows;
  },

  async getPaginated(offset, limit, search = '') {
    let query = 'SELECT * FROM question_pool';
    const params = [];

    if (search.trim()) {
      query += ' WHERE question LIKE ? OR topic LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    return rows;
  },

  async getCount(search = '') {
    let query = 'SELECT COUNT(*) as count FROM question_pool';
    const params = [];

    if (search.trim()) {
      query += ' WHERE question LIKE ? OR topic LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count;
  },

  async getByTopic(topic) {
    const [rows] = await db.query('SELECT * FROM question_pool WHERE topic = ?', [topic]);
    return rows;
  },

  async getRandom(limit) {
    const [rows] = await db.query('SELECT * FROM question_pool ORDER BY RAND() LIMIT ?', [parseInt(limit)]);
    return rows;
  },

  async getRandomByTopic(topic, limit) {
    const [rows] = await db.query(
      'SELECT * FROM question_pool WHERE topic = ? ORDER BY RAND() LIMIT ?',
      [topic, parseInt(limit)]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM question_pool WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ id, topic, question, options, correctAnswer, difficulty }) {
    const [result] = await db.query(
      'INSERT INTO question_pool (id, topic, question, options, correctAnswer, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        topic,
        question,
        Array.isArray(options) ? JSON.stringify(options) : options,
        correctAnswer,
        difficulty || 'easy'
      ]
    );
    return result.affectedRows > 0;
  },

  async update(id, { topic, question, options, correctAnswer, difficulty }) {
    const [result] = await db.query(
      'UPDATE question_pool SET topic = ?, question = ?, options = ?, correctAnswer = ?, difficulty = ? WHERE id = ?',
      [
        topic,
        question,
        Array.isArray(options) ? JSON.stringify(options) : options,
        correctAnswer,
        difficulty,
        id
      ]
    );
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const [result] = await db.query('DELETE FROM question_pool WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async deleteByTopic(topic) {
    const [result] = await db.query('DELETE FROM question_pool WHERE topic = ?', [topic]);
    return result.affectedRows > 0;
  },

  async clearPool() {
    const [result] = await db.query('TRUNCATE TABLE question_pool');
    return result;
  },

  async getStats() {
    const [countRows] = await db.query('SELECT COUNT(*) as totalQuestions FROM question_pool');
    const [topicRows] = await db.query('SELECT COUNT(DISTINCT topic) as totalTopics FROM question_pool');
    const [dateRows] = await db.query('SELECT MAX(created_at) as lastUploadDate FROM question_pool');
    
    return {
      totalQuestions: countRows[0].totalQuestions || 0,
      totalTopics: topicRows[0].totalTopics || 0,
      lastUploadDate: dateRows[0].lastUploadDate || null
    };
  },

  async getDistinctTopics() {
    const [rows] = await db.query('SELECT DISTINCT topic FROM question_pool ORDER BY topic ASC');
    return rows.map(r => r.topic);
  }
};

module.exports = QuestionModel;
