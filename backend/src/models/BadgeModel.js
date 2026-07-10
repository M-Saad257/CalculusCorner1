const db = require('../config/db');

const BadgeModel = {
  async awardBadge(userId, badgeName) {
    // Prevent duplicate badge awarding
    const [existing] = await db.query(
      'SELECT id FROM user_badges WHERE userId = ? AND badgeName = ?',
      [userId, badgeName]
    );

    if (existing.length > 0) {
      return null; // Already earned
    }

    const [result] = await db.query(
      'INSERT INTO user_badges (userId, badgeName) VALUES (?, ?)',
      [userId, badgeName]
    );
    return result.insertId;
  },

  async getByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM user_badges WHERE userId = ? ORDER BY earnedAt DESC',
      [userId]
    );
    return rows;
  },

  async checkAndAwardBadges(userId, newAttempt, allAttempts) {
    const newlyAwarded = [];

    // 1. First Attempt: Completed first quiz
    if (allAttempts.length >= 1) {
      const id = await this.awardBadge(userId, 'First Attempt');
      if (id) newlyAwarded.push({ badgeName: 'First Attempt', description: 'Awarded after completing your first quiz attempt!' });
    }

    // 2. Quiz Master: Got score >= 80% on any quiz
    if (newAttempt.percentage >= 80) {
      const id = await this.awardBadge(userId, 'Quiz Master');
      if (id) newlyAwarded.push({ badgeName: 'Quiz Master', description: 'Scored 80% or higher on a quiz!' });
    }

    // 3. Speed Solver: Finish with >50% time remaining (and got at least 60% correct to prevent spamming empty skips)
    const timeLimit = newAttempt.totalQuestions === 5 ? 180 : (newAttempt.totalQuestions === 20 ? 900 : 420);
    if (newAttempt.timeTaken < (timeLimit / 2) && newAttempt.percentage >= 60) {
      const id = await this.awardBadge(userId, 'Speed Solver');
      if (id) newlyAwarded.push({ badgeName: 'Speed Solver', description: 'Finished a quiz with more than 50% time remaining and at least 60% score!' });
    }

    // 4. Consistency Badge: 5 quizzes completed
    if (allAttempts.length >= 5) {
      const id = await this.awardBadge(userId, 'Consistency Badge');
      if (id) newlyAwarded.push({ badgeName: 'Consistency Badge', description: 'Completed 5 quiz assessments!' });
    }

    // 5. Calculus Champion: 10 high-scoring (>=80%) quizzes completed
    const highScoringCount = allAttempts.filter(a => a.percentage >= 80).length;
    if (highScoringCount >= 10) {
      const id = await this.awardBadge(userId, 'Calculus Champion');
      if (id) newlyAwarded.push({ badgeName: 'Calculus Champion', description: 'Completed 10 high-scoring quizzes (80% or higher)!' });
    }

    return newlyAwarded;
  }
};

module.exports = BadgeModel;
