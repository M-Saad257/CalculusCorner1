const db = require('../config/db');

const CollaborationModel = {
  async create(name, email, businessName, businessNiche, message, logoUrl = null) {
    const [result] = await db.query(
      'INSERT INTO collaboration_submissions (name, email, business_name, business_niche, message, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, businessName, businessNiche, message, logoUrl]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.query(
      'SELECT id, name, email, business_name AS businessName, business_niche AS businessNiche, message, logo_url AS logoUrl, is_visible AS isVisible, sequence, description, tags, is_featured AS isFeatured, created_at AS createdAt FROM collaboration_submissions ORDER BY sequence ASC, created_at DESC'
    );
    return rows;
  },

  async getActive() {
    const [rows] = await db.query(
      'SELECT id, business_name AS businessName, business_niche AS businessNiche, logo_url AS logoUrl, sequence, description, tags, is_featured AS isFeatured FROM collaboration_submissions WHERE is_visible = 1 ORDER BY sequence ASC, created_at DESC'
    );
    return rows;
  },

  async update(id, fields) {
    // If setting this partner as featured, clear any other featured flags first
    if (fields.isFeatured === 1 || fields.isFeatured === true || fields.isFeatured === 'true' || fields.isFeatured === '1') {
      await db.query('UPDATE collaboration_submissions SET is_featured = 0');
    }

    const queryParts = [];
    const values = [];

    const fieldMap = {
      name: 'name',
      email: 'email',
      businessName: 'business_name',
      businessNiche: 'business_niche',
      message: 'message',
      description: 'description',
      tags: 'tags',
      isVisible: 'is_visible',
      sequence: 'sequence',
      logoUrl: 'logo_url',
      isFeatured: 'is_featured'
    };

    Object.keys(fields).forEach(key => {
      if (fields[key] !== undefined && fieldMap[key]) {
        // Map boolean or string representation to tinyint 0 or 1
        let val = fields[key];
        if (key === 'isVisible' || key === 'isFeatured') {
          val = (val === 'true' || val === '1' || val === 1 || val === true) ? 1 : 0;
        }
        queryParts.push(`\`${fieldMap[key]}\` = ?`);
        values.push(val);
      }
    });

    if (queryParts.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE collaboration_submissions SET ${queryParts.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async updateDisplay(id, isVisible, sequence) {
    const [result] = await db.query(
      'UPDATE collaboration_submissions SET is_visible = ?, sequence = ? WHERE id = ?',
      [isVisible ? 1 : 0, sequence, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query(
      'DELETE FROM collaboration_submissions WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = CollaborationModel;
