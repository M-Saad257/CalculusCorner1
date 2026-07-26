const db = require('../config/db');

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

const VideoModel = {
  async getAll() {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, duration, thumbnail, category, subcategory, is_past_paper, show_on_homepage, show_on_homepage AS showOnHomepage, created_at AS createdAt FROM videos'
    );
    rows.sort(sortLecturesNaturally);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, duration, thumbnail, category, subcategory, is_past_paper, show_on_homepage, show_on_homepage AS showOnHomepage, created_at AS createdAt FROM videos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async getByVideoId(videoId) {
    const [rows] = await db.query(
      'SELECT id, title, url, video_id AS videoId, duration, thumbnail, category, subcategory, is_past_paper, show_on_homepage, show_on_homepage AS showOnHomepage, created_at AS createdAt FROM videos WHERE video_id = ?',
      [videoId]
    );
    return rows[0] || null;
  },

  async create(title, url, videoId, thumbnail, category, subcategory = null, is_past_paper = 0, duration = null, show_on_homepage = 0) {
    const [result] = await db.query(
      'INSERT INTO videos (title, url, video_id, thumbnail, category, subcategory, is_past_paper, duration, show_on_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, url, videoId, thumbnail, category || 'Calculus', subcategory, is_past_paper ? 1 : 0, duration, show_on_homepage ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, title, url, videoId, thumbnail, category, subcategory = null, is_past_paper = 0, duration = null, show_on_homepage = 0) {
    const [result] = await db.query(
      'UPDATE videos SET title = ?, url = ?, video_id = ?, thumbnail = ?, category = ?, subcategory = ?, is_past_paper = ?, duration = ?, show_on_homepage = ? WHERE id = ?',
      [title, url, videoId, thumbnail, category || 'Calculus', subcategory, is_past_paper ? 1 : 0, duration, show_on_homepage ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM videos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getCount() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM videos');
    return rows[0].count;
  },

  async getPaginated(page, limit, category = null, subcategory = null, search = null, is_past_paper = null, sortBy = 'lecture_asc') {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const queryParams = [];

    if (category && category !== 'All') {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }
    if (subcategory && subcategory !== 'All') {
      whereClauses.push('subcategory = ?');
      queryParams.push(subcategory);
    }
    if (search && search.trim() !== '') {
      whereClauses.push('(title LIKE ? OR category LIKE ? OR subcategory LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
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
    const [countRows] = await db.query(`SELECT COUNT(*) as count FROM videos ${whereSql}`, queryParams);
    const totalItems = countRows[0].count;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    if (sortBy === 'lecture_asc' || sortBy === 'default' || sortBy === 'title_asc') {
      // Fetch all matching rows and sort naturally in JS for exact 1.1, 1.2, 1.3... order
      const [rows] = await db.query(
        `SELECT id, title, url, video_id AS videoId, duration, thumbnail, category, subcategory, is_past_paper, show_on_homepage, show_on_homepage AS showOnHomepage, created_at AS createdAt FROM videos ${whereSql}`,
        queryParams
      );
      rows.sort(sortLecturesNaturally);
      const paginatedData = rows.slice(offset, offset + limit);
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
      `SELECT id, title, url, video_id AS videoId, duration, thumbnail, category, subcategory, is_past_paper, show_on_homepage, show_on_homepage AS showOnHomepage, created_at AS createdAt FROM videos ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: rows,
      totalItems,
      totalPages
    };
  }
};

module.exports = VideoModel;
