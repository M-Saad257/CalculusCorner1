const db = require('../config/db');

const getAllContent = async () => {
  const [rows] = await db.query('SELECT * FROM site_content');
  const contentMap = {};
  rows.forEach(row => {
    contentMap[row.section_name] = typeof row.content_data === 'string' ? JSON.parse(row.content_data) : row.content_data;
  });
  return contentMap;
};

const updateSectionContent = async (sectionName, contentData) => {
  const [result] = await db.query(
    'INSERT INTO site_content (section_name, content_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_data = VALUES(content_data)',
    [sectionName, JSON.stringify(contentData)]
  );
  return result.affectedRows > 0;
};

module.exports = {
  getAllContent,
  updateSectionContent
};
