const db = require('../config/db');
const crypto = require('crypto');

const NewsletterModel = {
  async subscribe(email) {
    const token = crypto.randomBytes(32).toString('hex');
    
    // Check if email already exists
    const [existing] = await db.query(
      'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        return { alreadySubscribed: true, id: existing[0].id };
      }
      // Reactivate subscriber
      await db.query(
        'UPDATE newsletter_subscribers SET status = "active", is_active = 1, unsubscribe_token = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?',
        [token, email]
      );
      return { alreadySubscribed: false, id: existing[0].id, reactivated: true, token };
    }

    // Insert new subscriber
    const [result] = await db.query(
      'INSERT INTO newsletter_subscribers (email, status, is_active, unsubscribe_token) VALUES (?, "active", 1, ?)',
      [email, token]
    );
    return { alreadySubscribed: false, id: result.insertId, token };
  },

  async unsubscribeByToken(token) {
    const [result] = await db.query(
      'UPDATE newsletter_subscribers SET status = "inactive", is_active = 0 WHERE unsubscribe_token = ?',
      [token]
    );
    return result.affectedRows > 0;
  },

  async getPaginated({ page = 1, limit = 10, search = '', status = '' }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM newsletter_subscribers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM newsletter_subscribers WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search.trim()) {
      const searchParam = `%${search.trim()}%`;
      query += ' AND email LIKE ?';
      countQuery += ' AND email LIKE ?';
      params.push(searchParam);
      countParams.push(searchParam);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);

    return {
      subscribers: rows,
      totalCount: countRows[0].count
    };
  },

  async updateStatus(id, status) {
    const isActive = status === 'active' ? 1 : 0;
    const [result] = await db.query(
      'UPDATE newsletter_subscribers SET status = ?, is_active = ? WHERE id = ?',
      [status, isActive, id]
    );
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const [result] = await db.query(
      'DELETE FROM newsletter_subscribers WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async getAnalytics() {
    const [all] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN created_at >= NOW() - INTERVAL 1 DAY AND status = 'active' THEN 1 ELSE 0 END) as recent24h
       FROM newsletter_subscribers`
    );
    
    return {
      total: all[0].total || 0,
      active: all[0].active || 0,
      inactive: all[0].inactive || 0,
      recent24h: all[0].recent24h || 0
    };
  }
};

module.exports = NewsletterModel;
