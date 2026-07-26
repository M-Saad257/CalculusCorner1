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

const sortLecturesNaturally = (a, b) => {
  if (!a || !b) return 0;
  const titleA = (a.title || '').trim();
  const titleB = (b.title || '').trim();

  const matchA = titleA.match(/(\d+)\.(\d+)/);
  const matchB = titleB.match(/(\d+)\.(\d+)/);

  if (matchA && matchB) {
    const majorA = parseInt(matchA[1], 10);
    const minorA = parseInt(matchA[2], 10);
    const majorB = parseInt(matchB[1], 10);
    const minorB = parseInt(matchB[2], 10);

    if (majorA !== majorB) return majorA - majorB;
    if (minorA !== minorB) return minorA - minorB;
  } else if (matchA) {
    const singleB = titleB.match(/(\d+)/);
    if (singleB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(singleB[1], 10);
      if (numA !== numB) return numA - numB;
    }
  } else if (matchB) {
    const singleA = titleA.match(/(\d+)/);
    if (singleA) {
      const numA = parseInt(singleA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numA - numB;
    }
  }

  return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
};

const ResourceModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM resources');
    const normalised = rows.map(normaliseRow);
    normalised.sort(sortLecturesNaturally);
    return normalised;
  },

  async getPaginated(page, limit, category = null, subcategory = null, search = null, is_past_paper = null, sortBy = 'lecture_asc') {
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
    if (is_past_paper !== undefined && is_past_paper !== null && is_past_paper !== 'all') {
      whereClauses.push('is_past_paper = ?');
      queryParams.push(is_past_paper === 'past_papers' || is_past_paper === '1' || is_past_paper === 1 || is_past_paper === true ? 1 : 0);
    }

    let whereSql = '';
    if (whereClauses.length > 0) {
      whereSql = 'WHERE ' + whereClauses.join(' AND ');
    }

    // Count query
    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM resources ${whereSql}`, queryParams);
    const totalItems = countRows[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    if (sortBy === 'lecture_asc' || sortBy === 'default' || sortBy === 'title_asc') {
      const [rows] = await db.query(`SELECT * FROM resources ${whereSql}`, queryParams);
      const normalised = rows.map(normaliseRow);
      normalised.sort(sortLecturesNaturally);
      const paginatedData = normalised.slice(offset, offset + limit);
      return {
        data: paginatedData,
        totalItems,
        totalPages
      };
    }

    let orderBySql = 'ORDER BY show_on_homepage DESC, category ASC, subcategory ASC, id ASC';
    if (sortBy === 'newest') {
      orderBySql = 'ORDER BY id DESC';
    } else if (sortBy === 'oldest') {
      orderBySql = 'ORDER BY id ASC';
    } else if (sortBy === 'title_desc') {
      orderBySql = 'ORDER BY title DESC';
    } else if (sortBy === 'category_asc') {
      orderBySql = 'ORDER BY category ASC, subcategory ASC, title ASC';
    }

    // Fetch query
    const [rows] = await db.query(
      `SELECT * FROM resources ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: rows.map(normaliseRow),
      totalItems,
      totalPages
    };
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
   * @param {number}      is_past_paper
   */
  async create(title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null, is_past_paper = 0, show_on_homepage = 0) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'INSERT INTO resources (title, file_url, original_filename, metadata, category, subcategory, thumbnail_url, is_past_paper, show_on_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url, is_past_paper ? 1 : 0, show_on_homepage ? 1 : 0]
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
   * @param {number}      is_past_paper
   * @param {number}      show_on_homepage
   */
  async update(id, title, file_url, original_filename, metadata = null, category = 'General', subcategory = null, thumbnail_url = null, is_past_paper = 0, show_on_homepage = 0) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await db.query(
      'UPDATE resources SET title = ?, file_url = ?, original_filename = ?, metadata = ?, category = ?, subcategory = ?, thumbnail_url = ?, is_past_paper = ?, show_on_homepage = ? WHERE id = ?',
      [title, file_url, original_filename, metaJson, category, subcategory, thumbnail_url, is_past_paper ? 1 : 0, show_on_homepage ? 1 : 0, id]
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
