const db = require('../config/db');

/**
 * Parses the `metadata` column returned from MySQL into a plain JS object.
 * MySQL2 may return it as a string or already-parsed object depending on driver config.
 * @param {any} metadata
 * @returns {Object|null}
 */
const parseMetadata = (metadata) => {
  if (!metadata) return null;
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
};

/**
 * Normalises a raw DB row so `metadata` is always a JS object (never a raw JSON string).
 * @param {Object} row
 * @returns {Object}
 */
const normaliseRow = (row) => {
  if (!row) return null;
  return { ...row, metadata: parseMetadata(row.metadata) };
};

const ResourceModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM resources ORDER BY created_at DESC');
    return rows.map(normaliseRow);
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
    return normaliseRow(rows[0] || null);
  },

  /**
   * @param {string}      title
   * @param {string}      file_url
   * @param {string}      original_filename
   * @param {Object|null} metadata  - { size_bytes, extension, mime_type, ... }
   * @param {string}      category
   * @param {string|null} subcategory
   * @param {string|null} thumbnail_url
   */
  async create(title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'INSERT INTO resources (title, file_url, original_filename, metadata, category, subcategory, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url]
    );
    return result.insertId;
  },

  /**
   * @param {number}      id
   * @param {string}      title
   * @param {string}      file_url
   * @param {string}      original_filename
   * @param {Object|null} metadata
   * @param {string}      category
   * @param {string|null} subcategory
   * @param {string|null} thumbnail_url
   */
  async update(id, title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'UPDATE resources SET title = ?, file_url = ?, original_filename = ?, metadata = ?, category = ?, subcategory = ?, thumbnail_url = ? WHERE id = ?',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM resources WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM resources');
    return rows[0].count;
  }
};

module.exports = ResourceModel;
