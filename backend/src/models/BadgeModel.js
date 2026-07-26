const db = require('../config/db');

// Generate a unique Certificate ID in format CCXX-0000
function generateCertId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '0123456789';
  const c1 = chars[Math.floor(Math.random() * chars.length)];
  const c2 = chars[Math.floor(Math.random() * chars.length)];
  const n = Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * 10)]).join('');
  return `CC${c1}${c2}-${n}`;
}

async function uniqueCertId() {
  let id, exists = true;
  while (exists) {
    id = generateCertId();
    const [[{ cnt }]] = await db.query(
      'SELECT (SELECT COUNT(*) FROM user_badges WHERE certificate_id=?) + (SELECT COUNT(*) FROM certificates WHERE certificate_id=?) AS cnt',
      [id, id]
    );
    exists = cnt > 0;
  }
  return id;
}

const BadgeModel = {
  async awardBadge(userId, badgeName) {
    // Prevent duplicate badge awarding
    const [existing] = await db.query(
      'SELECT id, certificate_id FROM user_badges WHERE userId = ? AND badgeName = ?',
      [userId, badgeName]
    );

    if (existing.length > 0) {
      return null; // Already earned
    }

    // Generate unique certificate ID
    const certId = await uniqueCertId();

    const [result] = await db.query(
      'INSERT INTO user_badges (userId, badgeName, certificate_id) VALUES (?, ?, ?)',
      [userId, badgeName, certId]
    );
    return result.insertId;
  },

  async getByUserId(userId) {
    if (userId) {
      try {
        await this.awardBadge(userId, 'Welcome Badge');
      } catch (e) {}
    }
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

    // 3. Speed Solver: Finish with >50% time remaining (and got at least 60% correct)
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
  },

  async checkAndAwardVideoBadges(userId) {
    const newlyAwarded = [];

    // Count completed videos
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM video_progress WHERE user_id = ? AND (is_completed = 1 OR progress_percent >= 90.0)',
      [userId]
    );
    const completedCount = rows[0]?.count || 0;

    // 0. Fast Starter: watched first video
    if (completedCount >= 1) {
      const id = await this.awardBadge(userId, 'Fast Starter');
      if (id) newlyAwarded.push({ badgeName: 'Fast Starter', description: 'Started watching your first lecture video!' });
    }

    // 1. Bronze Learner: 5 videos
    if (completedCount >= 5) {
      const id1 = await this.awardBadge(userId, 'Bronze Learner');
      const id2 = await this.awardBadge(userId, 'Bronze Milestone');
      if (id1 || id2) newlyAwarded.push({ badgeName: 'Bronze Learner', description: 'Watched 5 math videos completely!' });
    }

    // 2. Silver Learner: 15 videos
    if (completedCount >= 15) {
      const id1 = await this.awardBadge(userId, 'Silver Learner');
      const id2 = await this.awardBadge(userId, 'Silver Milestone');
      if (id1 || id2) newlyAwarded.push({ badgeName: 'Silver Learner', description: 'Watched 15 math videos completely!' });
    }

    // 3. Gold Learner: 30 videos
    if (completedCount >= 30) {
      const id1 = await this.awardBadge(userId, 'Gold Learner');
      const id2 = await this.awardBadge(userId, 'Gold Milestone');
      if (id1 || id2) newlyAwarded.push({ badgeName: 'Gold Learner', description: 'Watched 30 math videos completely!' });
    }

    // 4. Master Learner: 50 videos
    if (completedCount >= 50) {
      const id1 = await this.awardBadge(userId, 'Master Learner');
      const id2 = await this.awardBadge(userId, 'Master Milestone');
      if (id1 || id2) newlyAwarded.push({ badgeName: 'Master Learner', description: 'Watched 50 math videos completely!' });
    }

    // 5. Consistency Badge: 5 quizzes completed (auto-check)
    const [quizRows] = await db.query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE userId = ?',
      [userId]
    );
    const quizCount = quizRows[0]?.count || 0;
    if (quizCount >= 5) {
      const id = await this.awardBadge(userId, 'Consistency Badge');
      if (id) newlyAwarded.push({ badgeName: 'Consistency Badge', description: 'Completed 5 quiz assessments!' });
    }

    // 6. Calculus Champion: 10 high-scoring (>=80%) quizzes (auto-check)
    const [highRows] = await db.query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE userId = ? AND percentage >= 80',
      [userId]
    );
    const highCount = highRows[0]?.count || 0;
    if (highCount >= 10) {
      const id = await this.awardBadge(userId, 'Calculus Champion');
      if (id) newlyAwarded.push({ badgeName: 'Calculus Champion', description: 'Completed 10 high-scoring quizzes (80% or higher)!' });
    }

    return newlyAwarded;
  },

  // Verify a certificate by ID — checks both user_badges and course certificates
  async verifyCertificate(certId) {
    if (!certId) return null;
    const upperCertId = certId.toUpperCase().trim();

    // 1. Check badge certificates
    const [badgeRows] = await db.query(
      `SELECT ub.certificate_id, ub.badgeName, ub.earnedAt,
              u.name AS studentName
       FROM user_badges ub
       JOIN users u ON u.id = ub.userId
       WHERE ub.certificate_id = ?`,
      [upperCertId]
    );
    if (badgeRows.length > 0) {
      const r = badgeRows[0];
      return {
        type: 'achievement',
        certificateId: r.certificate_id,
        studentName: r.studentName,
        certificateName: r.badgeName,
        issuedAt: r.earnedAt,
      };
    }

    // 2. Check course certificates
    const [certRows] = await db.query(
      `SELECT c.certificate_id, c.issued_at,
              u.name AS studentName,
              co.title AS courseName
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       JOIN courses co ON co.id = c.course_id
       WHERE c.certificate_id = ?`,
      [upperCertId]
    );
    if (certRows.length > 0) {
      const r = certRows[0];
      return {
        type: 'course',
        certificateId: r.certificate_id,
        studentName: r.studentName,
        certificateName: r.courseName,
        issuedAt: r.issued_at,
      };
    }

    return null;
  }
};

module.exports = BadgeModel;
