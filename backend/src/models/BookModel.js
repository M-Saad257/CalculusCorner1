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

const BookModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM books ORDER BY show_on_homepage DESC, category ASC, subcategory ASC, id ASC');
    return rows.map(normaliseRow);
  },

  async getPaginated(page, limit, category = null, subcategory = null, search = null, sortBy = 'default') {
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let queryParams = [];

    if (category && category !== 'All') {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }
    if (subcategory && subcategory !== 'All') {
      whereClauses.push('subcategory = ?');
      queryParams.push(subcategory);
    }
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      whereClauses.push('(title LIKE ? OR category LIKE ? OR subcategory LIKE ?)');
      queryParams.push(q, q, q);
    }

    let whereSql = '';
    if (whereClauses.length > 0) {
      whereSql = 'WHERE ' + whereClauses.join(' AND ');
    }

    let orderBySql = 'ORDER BY show_on_homepage DESC, category ASC, subcategory ASC, id ASC';
    if (sortBy === 'newest') {
      orderBySql = 'ORDER BY id DESC';
    } else if (sortBy === 'oldest') {
      orderBySql = 'ORDER BY id ASC';
    } else if (sortBy === 'title_asc') {
      orderBySql = 'ORDER BY title ASC';
    } else if (sortBy === 'title_desc') {
      orderBySql = 'ORDER BY title DESC';
    } else if (sortBy === 'category_asc') {
      orderBySql = 'ORDER BY category ASC, subcategory ASC, title ASC';
    }

    // Count query
    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM books ${whereSql}`, queryParams);
    const totalItems = countRows[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch query
    const [rows] = await db.query(
      `SELECT * FROM books ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: rows.map(normaliseRow),
      totalItems,
      totalPages
    };
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
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
  async create(title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null, show_on_homepage = 0) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'INSERT INTO books (title, file_url, original_filename, metadata, category, subcategory, thumbnail_url, show_on_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url, show_on_homepage ? 1 : 0]
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
   * @param {number}      show_on_homepage
   */
  async update(id, title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null, show_on_homepage = 0) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'UPDATE books SET title = ?, file_url = ?, original_filename = ?, metadata = ?, category = ?, subcategory = ?, thumbnail_url = ?, show_on_homepage = ? WHERE id = ?',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url, show_on_homepage ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM books');
    return rows[0].count;
  }
};

module.exports = BookModel;
