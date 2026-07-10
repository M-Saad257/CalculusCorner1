const db = require('../config/db');

const SubjectModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM subjects ORDER BY created_at ASC');
    return rows.map(row => {
      // Parse JSON fields
      try { row.topicsCovered = JSON.parse(row.topicsCovered); } catch(e) { row.topicsCovered = []; }
      try { row.learningOutcomes = JSON.parse(row.learningOutcomes); } catch(e) { row.learningOutcomes = []; }
      try { row.examPrepTips = JSON.parse(row.examPrepTips); } catch(e) { row.examPrepTips = []; }
      try { row.relatedSubjects = JSON.parse(row.relatedSubjects); } catch(e) { row.relatedSubjects = []; }
      return row;
    });
  },

  async getBySlug(slug) {
    const [rows] = await db.query('SELECT * FROM subjects WHERE slug = ?', [slug]);
    const row = rows[0] || null;
    if (row) {
      try { row.topicsCovered = JSON.parse(row.topicsCovered); } catch(e) { row.topicsCovered = []; }
      try { row.learningOutcomes = JSON.parse(row.learningOutcomes); } catch(e) { row.learningOutcomes = []; }
      try { row.examPrepTips = JSON.parse(row.examPrepTips); } catch(e) { row.examPrepTips = []; }
      try { row.relatedSubjects = JSON.parse(row.relatedSubjects); } catch(e) { row.relatedSubjects = []; }
    }
    return row;
  },

  async create(subjectData) {
    const {
      slug, title, subtitle, badge, icon, bgColor,
      seoTitle, seoDescription, overview, whyItMatters,
      topicsCovered = [], whoItIsFor, howWeHelp,
      learningOutcomes = [], examPrepTips = [],
      sidebarDifficulty, sidebarFocus, sidebarRecommendedGrade,
      sidebarStudyTime, relatedVideosCategory, relatedSubjects = []
    } = subjectData;

    const [result] = await db.query(
      `INSERT INTO subjects (
        slug, title, subtitle, badge, icon, bgColor,
        seoTitle, seoDescription, overview, whyItMatters,
        topicsCovered, whoItIsFor, howWeHelp,
        learningOutcomes, examPrepTips,
        sidebarDifficulty, sidebarFocus, sidebarRecommendedGrade,
        sidebarStudyTime, relatedVideosCategory, relatedSubjects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, title, subtitle, badge, icon, bgColor,
        seoTitle, seoDescription, overview, whyItMatters,
        JSON.stringify(topicsCovered), whoItIsFor, howWeHelp,
        JSON.stringify(learningOutcomes), JSON.stringify(examPrepTips),
        sidebarDifficulty, sidebarFocus, sidebarRecommendedGrade,
        sidebarStudyTime, relatedVideosCategory, JSON.stringify(relatedSubjects)
      ]
    );
    return result.insertId;
  },

  async update(id, subjectData) {
    const {
      slug, title, subtitle, badge, icon, bgColor,
      seoTitle, seoDescription, overview, whyItMatters,
      topicsCovered, whoItIsFor, howWeHelp,
      learningOutcomes, examPrepTips,
      sidebarDifficulty, sidebarFocus, sidebarRecommendedGrade,
      sidebarStudyTime, relatedVideosCategory, relatedSubjects
    } = subjectData;

    const [result] = await db.query(
      `UPDATE subjects SET 
        slug = COALESCE(?, slug),
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        badge = COALESCE(?, badge),
        icon = COALESCE(?, icon),
        bgColor = COALESCE(?, bgColor),
        seoTitle = COALESCE(?, seoTitle),
        seoDescription = COALESCE(?, seoDescription),
        overview = COALESCE(?, overview),
        whyItMatters = COALESCE(?, whyItMatters),
        topicsCovered = COALESCE(?, topicsCovered),
        whoItIsFor = COALESCE(?, whoItIsFor),
        howWeHelp = COALESCE(?, howWeHelp),
        learningOutcomes = COALESCE(?, learningOutcomes),
        examPrepTips = COALESCE(?, examPrepTips),
        sidebarDifficulty = COALESCE(?, sidebarDifficulty),
        sidebarFocus = COALESCE(?, sidebarFocus),
        sidebarRecommendedGrade = COALESCE(?, sidebarRecommendedGrade),
        sidebarStudyTime = COALESCE(?, sidebarStudyTime),
        relatedVideosCategory = COALESCE(?, relatedVideosCategory),
        relatedSubjects = COALESCE(?, relatedSubjects)
      WHERE id = ?`,
      [
        slug, title, subtitle, badge, icon, bgColor,
        seoTitle, seoDescription, overview, whyItMatters,
        topicsCovered ? JSON.stringify(topicsCovered) : null, 
        whoItIsFor, howWeHelp,
        learningOutcomes ? JSON.stringify(learningOutcomes) : null, 
        examPrepTips ? JSON.stringify(examPrepTips) : null,
        sidebarDifficulty, sidebarFocus, sidebarRecommendedGrade,
        sidebarStudyTime, relatedVideosCategory, 
        relatedSubjects ? JSON.stringify(relatedSubjects) : null,
        id
      ]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM subjects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = SubjectModel;
