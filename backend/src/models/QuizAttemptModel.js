const db = require('../config/db');

const QuizAttemptModel = {
  async create(userId, { score, totalQuestions, percentage, answers, timeTaken, quizType, topic }) {
    const [result] = await db.query(
      `INSERT INTO quiz_attempts (userId, score, totalQuestions, percentage, answers, timeTaken, quizType, topic) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        score,
        totalQuestions,
        percentage,
        Array.isArray(answers) ? JSON.stringify(answers) : answers,
        timeTaken,
        quizType,
        topic || null
      ]
    );
    return result.insertId;
  },

  async getByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM quiz_attempts WHERE userId = ? ORDER BY completedAt DESC',
      [userId]
    );
    return rows;
  },

  async getAnalytics(userId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as totalQuizzes,
        IFNULL(AVG(percentage), 0) as averagePercentage,
        IFNULL(MAX(percentage), 0) as bestPercentage,
        IFNULL(MIN(percentage), 0) as worstPercentage,
        IFNULL(SUM(totalQuestions), 0) as totalQuestionsAnswered,
        IFNULL(SUM(score), 0) as totalCorrectAnswers,
        IFNULL(SUM(timeTaken), 0) as totalTimeSpentSeconds
       FROM quiz_attempts 
       WHERE userId = ?`,
      [userId]
    );

    const stats = rows[0];
    const totalAnswered = stats.totalQuestionsAnswered;
    const accuracy = totalAnswered > 0 ? (stats.totalCorrectAnswers / totalAnswered) * 100 : 0;

    // Convert total seconds to hours + minutes for realistic display
    // timeTaken is stored in SECONDS (e.g. a 10-minute quiz = 600 seconds)
    const totalSeconds = Math.floor(Number(stats.totalTimeSpentSeconds) || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let studyTimeFormatted;
    if (hours === 0 && minutes === 0) {
      studyTimeFormatted = '0m';
    } else if (hours === 0) {
      studyTimeFormatted = `${minutes}m`;
    } else if (minutes === 0) {
      studyTimeFormatted = `${hours}h`;
    } else {
      studyTimeFormatted = `${hours}h ${minutes}m`;
    }

    return {
      totalQuizzes: stats.totalQuizzes || 0,
      averageScore: parseFloat(Number(stats.averagePercentage).toFixed(1)),
      bestScore: parseFloat(Number(stats.bestPercentage).toFixed(1)),
      worstScore: parseFloat(Number(stats.worstPercentage).toFixed(1)),
      questionsAnswered: totalAnswered,
      accuracy: parseFloat(accuracy.toFixed(1)),
      // Structured study time — never confuse seconds with hours
      timeSpent: {
        totalSeconds,
        hours,
        minutes,
        formatted: studyTimeFormatted
      }
    };
  },

  async getTopicBreakdown(userId) {
    // Topic breakdown for quizzes that have a topic specified
    const [rows] = await db.query(
      `SELECT 
        topic,
        COUNT(*) as attempts,
        IFNULL(AVG(percentage), 0) as averageScore,
        IFNULL(SUM(totalQuestions), 0) as totalQuestions,
        IFNULL(SUM(score), 0) as totalCorrect
       FROM quiz_attempts 
       WHERE userId = ? AND topic IS NOT NULL
       GROUP BY topic
       ORDER BY topic ASC`,
      [userId]
    );

    return rows.map(r => {
      const accuracy = r.totalQuestions > 0 ? (r.totalCorrect / r.totalQuestions) * 100 : 0;
      return {
        topic: r.topic,
        attempts: r.attempts,
        averageScore: parseFloat(Number(r.averageScore).toFixed(1)),
        accuracy: parseFloat(accuracy.toFixed(1))
      };
    });
  },

  async getWeeklyActivity(userId) {
    // Query count of quizzes completed per day for the last 7 days (formatted like 'YYYY-MM-DD')
    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(completedAt, '%Y-%m-%d') as date,
        COUNT(*) as count
       FROM quiz_attempts
       WHERE userId = ? AND completedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(completedAt, '%Y-%m-%d')
       ORDER BY date ASC`,
      [userId]
    );
    return rows;
  },

  async getScoreTrend(userId, limit = 10) {
    // Recent attempts for score trend line plotting
    const [rows] = await db.query(
      `SELECT id, percentage, quizType, completedAt 
       FROM quiz_attempts 
       WHERE userId = ? 
       ORDER BY completedAt ASC 
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    return rows;
  }
};

module.exports = QuizAttemptModel;
