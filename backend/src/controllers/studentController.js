const CourseModel = require('../models/CourseModel');
const UserModel = require('../models/UserModel');
const ResourceModel = require('../models/ResourceModel');
const VideoModel = require('../models/VideoModel');
const NotificationModel = require('../models/NotificationModel');
const QuizAttemptModel = require('../models/QuizAttemptModel');
const BadgeModel = require('../models/BadgeModel');
const QuestionModel = require('../models/QuestionModel');
const UnbanRequestModel = require('../models/UnbanRequestModel');
const EnrollmentModel = require('../models/EnrollmentModel');
const ProgressModel = require('../models/ProgressModel');
const { getIO } = require('../socket');

// Simple in-memory cache for student dashboards
const dashboardCache = new Map();

const studentController = {
  // Clear dashboard cache helper
  clearDashboardCache(userId) {
    dashboardCache.delete(String(userId));
  },
  // --- PROFILE ---
  async getProfile(req, res, next) {
    try {
      const studentId = req.user.id;
      const profile = await UserModel.getProfile(studentId);
      if (!profile) {
        res.status(404);
        throw new Error('Student profile not found');
      }

      // If they were restored, clear the notified flag so it's a one-time message
      if (profile.restore_notified === 1) {
        await UserModel.clearRestoreNotified(studentId);
      }

      const latestRequest = await UnbanRequestModel.getLatestByStudentId(studentId);
      profile.hasPendingRequest = latestRequest ? latestRequest.status === 'pending' : false;
      profile.unbanRequest = latestRequest;

      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const studentId = req.user.id;
      const { bio, avatar, class: studentClass, name, email, password } = req.body;

      const profile = await UserModel.getProfile(studentId);
      if (!profile) {
        res.status(404);
        throw new Error('Student profile not found');
      }

      // 1. If name or email are changed, update users table
      if ((name && name !== profile.name) || (email && email !== profile.email)) {
        const finalName = name || profile.name;
        const finalEmail = email || profile.email;

        if (email && email !== profile.email) {
          const existing = await UserModel.findByEmail(email);
          if (existing && existing.id !== studentId) {
            res.status(400);
            throw new Error('Email is already taken by another student');
          }
        }

        await UserModel.updateStudent(studentId, finalName, finalEmail);
      }

      // 2. If password is changed, hash and update it
      if (password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await UserModel.updatePassword(studentId, hashedPassword);
      }

      // 3. Update bio, avatar, and class in profile
      await UserModel.updateProfile(
        studentId,
        bio !== undefined ? bio : profile.bio,
        avatar !== undefined ? avatar : profile.avatar,
        studentClass !== undefined ? studentClass : profile.class
      );

      // Clear cached dashboard data for this student
      studentController.clearDashboardCache(studentId);

      const updatedProfile = await UserModel.getProfile(studentId);
      res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedProfile });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      const studentId = req.user.id;

      if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
      }

      const profile = await UserModel.getProfile(studentId);
      if (!profile) {
        res.status(404);
        throw new Error('Student profile not found');
      }

      const avatarUrl = `/uploads/images/${req.file.filename}`;

      await UserModel.updateProfile(studentId, profile.bio, avatarUrl, profile.class);

      const updatedProfile = await UserModel.getProfile(studentId);
      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: updatedProfile,
        avatar_url: avatarUrl
      });
    } catch (err) {
      next(err);
    }
  },

  // --- LEARNING MATERIAL ---

  /**
   * Returns only courses the student is enrolled in.
   * Never falls back to returning all courses.
   */
  async getCourses(req, res, next) {
    try {
      const studentId = req.user.id;
      const courses = await EnrollmentModel.getByUserId(studentId);
      res.status(200).json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Enroll a student in a single course.
   * Validates: course exists, not already enrolled, student is active.
   */
  async enrollCourse(req, res, next) {
    try {
      const studentId = req.user.id;
      const { courseId } = req.body;

      if (!courseId) {
        res.status(400);
        throw new Error('courseId is required.');
      }

      const course = await CourseModel.getById(courseId);
      if (!course) {
        res.status(404);
        throw new Error('Course not found.');
      }

      // Save receipt screenshot path if uploaded
      const receiptPath = req.file ? `/uploads/enrollments/${req.file.filename}` : null;

      const result = await EnrollmentModel.enrollWithCheck(studentId, courseId, receiptPath);

      if (result.alreadyEnrolled) {
        return res.status(200).json({
          success: true,
          alreadyEnrolled: true,
          message: 'You are already enrolled in this course.'
        });
      }

      // Notify the student
      const studentNotifId = await NotificationModel.create(
        studentId,
        'Course Enrollment Confirmed',
        `You have been successfully enrolled in "${course.title}".`,
        'course',
        'student'
      );

      try {
        const io = getIO();
        io.to(`student-${studentId}`).emit('notification:new', {
          id: studentNotifId,
          userId: studentId,
          title: 'Course Enrollment Confirmed',
          text: `You have been successfully enrolled in "${course.title}".`,
          type: 'course',
          role: 'student',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
        io.to(`student-${studentId}`).emit('enrollment:updated', { courseId });
      } catch (err) {
        console.error('Socket student emit failed:', err.message);
      }

      // Notify admins
      try {
        const adminNotifId = await NotificationModel.create(
          null,
          'New Course Enrollment',
          `Student ${req.user.email} enrolled in "${course.title}".`,
          'enrollment',
          'admin'
        );
        const io = getIO();
        io.to('admins').emit('notification:new', {
          id: adminNotifId,
          userId: null,
          title: 'New Course Enrollment',
          text: `Student ${req.user.email} enrolled in "${course.title}".`,
          type: 'enrollment',
          role: 'admin',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
        io.to('admins').emit('admin:enrollment:update');
      } catch (notifErr) {
        console.error('Admin enrollment notification failed:', notifErr.message);
      }

      res.status(201).json({
        success: true,
        enrolled: true,
        message: `Enrollment successful. Welcome to "${course.title}"!`,
        data: { enrollmentId: result.enrollmentId, courseId, courseTitle: course.title }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Aggregated dashboard endpoint — avoids multiple client round-trips.
   * Computes: profile, enrolled courses, analytics, study time, streak, timeline, course progress.
   */
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const userIdStr = String(userId);

      // Check Cache
      const cached = dashboardCache.get(userIdStr);
      if (cached && (Date.now() - cached.timestamp < 15000)) { // 15-second cache TTL
        return res.status(200).json({ success: true, data: cached.data });
      }

      // Profile
      const profile = await UserModel.getProfile(userId);
      if (profile && profile.created_at && !profile.createdAt) {
        profile.createdAt = profile.created_at;
      }

      const latestRequest = await UnbanRequestModel.getLatestByStudentId(userId);
      const hasPending = latestRequest ? latestRequest.status === 'pending' : false;
      if (profile) {
        profile.hasPendingRequest = hasPending;
        profile.unbanRequest = latestRequest;
      }

      // Enrolled courses — NEVER fall back to all courses
      let enrolled = [];
      try {
        enrolled = await EnrollmentModel.getByUserId(userId);
      } catch (e) {
        console.error('Failed to fetch enrollments:', e.message);
        enrolled = [];
      }

      // Badges & attempts list (only 1 DB fetch instead of multiple aggregate queries)
      const badges = await BadgeModel.getByUserId(userId);
      const attempts = await QuizAttemptModel.getByUserId(userId);

      // --- Compute Analytics in Memory ---
      const totalQuizzes = attempts.length;
      let totalQuestionsAnswered = 0;
      let totalCorrectAnswers = 0;
      let totalTimeSpentSeconds = 0;
      let bestPercentage = 0;
      let worstPercentage = totalQuizzes > 0 ? 100 : 0;
      let sumPercentage = 0;

      for (const a of attempts) {
        const pct = parseFloat(a.percentage) || 0;
        sumPercentage += pct;
        if (pct > bestPercentage) bestPercentage = pct;
        if (pct < worstPercentage) worstPercentage = pct;
        totalQuestionsAnswered += parseInt(a.totalQuestions) || 0;
        totalCorrectAnswers += parseInt(a.score) || 0;
        totalTimeSpentSeconds += parseInt(a.timeTaken) || 0;
      }

      const averagePercentage = totalQuizzes > 0 ? (sumPercentage / totalQuizzes) : 0;
      const accuracy = totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0;

      const hours = Math.floor(totalTimeSpentSeconds / 3600);
      const minutes = Math.floor((totalTimeSpentSeconds % 3600) / 60);
      let studyTimeFormatted = '0m';
      if (hours === 0 && minutes > 0) studyTimeFormatted = `${minutes}m`;
      else if (hours > 0 && minutes === 0) studyTimeFormatted = `${hours}h`;
      else if (hours > 0 && minutes > 0) studyTimeFormatted = `${hours}h ${minutes}m`;

      const analytics = {
        totalQuizzes,
        averageScore: parseFloat(averagePercentage.toFixed(1)),
        bestScore: parseFloat(bestPercentage.toFixed(1)),
        worstScore: parseFloat(worstPercentage.toFixed(1)),
        questionsAnswered: totalQuestionsAnswered,
        accuracy: parseFloat(accuracy.toFixed(1)),
        timeSpent: {
          totalSeconds: totalTimeSpentSeconds,
          hours,
          minutes,
          formatted: studyTimeFormatted
        }
      };

      // --- Compute Topic Breakdown in Memory ---
      const topicGroups = {};
      for (const a of attempts) {
        if (!a.topic) continue;
        if (!topicGroups[a.topic]) {
          topicGroups[a.topic] = { attempts: 0, sumPercentage: 0, totalQuestions: 0, totalCorrect: 0 };
        }
        const g = topicGroups[a.topic];
        g.attempts++;
        g.sumPercentage += parseFloat(a.percentage) || 0;
        g.totalQuestions += parseInt(a.totalQuestions) || 0;
        g.totalCorrect += parseInt(a.score) || 0;
      }

      const topicBreakdown = Object.keys(topicGroups).sort().map(topicName => {
        const g = topicGroups[topicName];
        const topicAccuracy = g.totalQuestions > 0 ? (g.totalCorrect / g.totalQuestions) * 100 : 0;
        return {
          topic: topicName,
          attempts: g.attempts,
          averageScore: parseFloat((g.sumPercentage / g.attempts).toFixed(1)),
          accuracy: parseFloat(topicAccuracy.toFixed(1))
        };
      });

      // --- Compute Weekly Activity in Memory ---
      const weeklyActivityMap = {};
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const yyyymmdd = d.toISOString().split('T')[0];
        weeklyActivityMap[yyyymmdd] = 0;
      }

      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(today.getDate() - 6);
      sixDaysAgo.setHours(0, 0, 0, 0);

      for (const a of attempts) {
        const attemptDate = new Date(a.completedAt);
        if (attemptDate >= sixDaysAgo) {
          const yyyymmdd = attemptDate.toISOString().split('T')[0];
          if (weeklyActivityMap[yyyymmdd] !== undefined) {
            weeklyActivityMap[yyyymmdd]++;
          }
        }
      }

      const weeklyActivity = Object.keys(weeklyActivityMap).sort().map(date => ({
        date,
        count: weeklyActivityMap[date]
      }));

      // --- Compute Score Trend in Memory ---
      const trendAttempts = [...attempts].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(0, 10);
      const scoreTrend = trendAttempts.map(a => ({
        id: a.id,
        percentage: a.percentage,
        quizType: a.quizType,
        completedAt: a.completedAt
      }));

      // Per-course progress: calculate quiz completion per course (by topic)
      const courseProgress = enrolled.map(course => {
        const relatedAttempts = attempts.filter(a =>
          a.topic && course.title &&
          (a.topic.toLowerCase().includes(course.grade ? course.grade.toLowerCase() : '') ||
            a.quizType === 'topic')
        );
        const completedItems = relatedAttempts.length;
        const totalItems = 10;
        const progressPct = Math.min(100, Math.round((completedItems / totalItems) * 100));

        return {
          courseId: course.courseId || course.id,
          courseTitle: course.title,
          grade: course.grade,
          progressPercent: progressPct,
          completedItems,
          totalItems
        };
      });

      // Overall completion: average of all course progresses, or 0
      const overallCompletion = courseProgress.length > 0
        ? Math.round(courseProgress.reduce((sum, cp) => sum + cp.progressPercent, 0) / courseProgress.length)
        : 0;

      // Activity timeline
      const timeline = [];

      // Account created
      if (profile && profile.created_at) {
        timeline.push({
          type: 'account_created',
          title: 'Account Created',
          description: `Account created for ${profile.name || profile.email}`,
          timestamp: profile.created_at
        });
      }

      // Last Login event (only add if last_login differs from created_at)
      if (profile && profile.last_login) {
        const loginTime = new Date(profile.last_login).getTime();
        const createTime = new Date(profile.created_at).getTime();
        if (Math.abs(loginTime - createTime) > 5000) { // more than 5 sec apart
          timeline.push({
            type: 'login',
            title: 'Logged In',
            description: 'Session started',
            timestamp: profile.last_login
          });
        }
      }

      // Enrollments
      enrolled.forEach(c => {
        if (c.enrolledAt) {
          timeline.push({
            type: 'course_enrolled',
            title: 'Course Enrolled',
            description: `Enrolled in ${c.title}`,
            timestamp: c.enrolledAt
          });
        }
      });

      // Quiz attempts - Limit to latest 3
      attempts.slice(0, 3).forEach(a => {
        timeline.push({
          type: 'quiz_attempt',
          title: 'Quiz Submitted',
          description: `Score: ${a.score}/${a.totalQuestions} (${a.percentage}%)`,
          timestamp: a.completedAt
        });
      });

      // Badges
      badges.forEach(b => {
        timeline.push({
          type: 'badge_earned',
          title: 'Badge Earned',
          description: b.badgeName,
          timestamp: b.earnedAt || b.createdAt || new Date()
        });
      });

      // Unban request events
      if (latestRequest) {
        timeline.push({
          type: 'unban_request',
          title: latestRequest.status === 'pending'
            ? 'Unban Appeal Received'
            : latestRequest.status === 'approved'
              ? 'Unban Request Approved'
              : 'Unban Request Rejected',
          description: latestRequest.status === 'pending'
            ? 'Your account appeal is currently under review by our admin team.'
            : latestRequest.status === 'approved'
              ? 'Your account has been successfully restored.'
              : 'Your appeal was reviewed and rejected.',
          timestamp: latestRequest.created_at
        });
      }

      // Sort timeline newest first
      timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Streak: consecutive days with activity
      const activityDates = new Set();
      attempts.forEach(a => activityDates.add(new Date(a.completedAt).toISOString().slice(0, 10)));
      badges.forEach(b => activityDates.add(new Date(b.earnedAt || b.createdAt || Date.now()).toISOString().slice(0, 10)));
      enrolled.forEach(e => { if (e.enrolledAt) activityDates.add(new Date(e.enrolledAt).toISOString().slice(0, 10)); });

      let streak = 0;
      const todayVal = new Date();
      const todayKey = todayVal.toISOString().slice(0, 10);
      const yesterdayVal = new Date(todayVal);
      yesterdayVal.setDate(todayVal.getDate() - 1);
      const yesterdayKey = yesterdayVal.toISOString().slice(0, 10);

      let startOffset = 0;
      if (!activityDates.has(todayKey) && activityDates.has(yesterdayKey)) {
        startOffset = 1;
      }

      for (let i = startOffset; ; i++) {
        const d = new Date(todayVal);
        d.setDate(todayVal.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (activityDates.has(key)) {
          streak += 1;
        } else {
          break;
        }
      }

      // Study time — already formatted
      const studyTime = analytics.timeSpent || { totalSeconds: 0, hours: 0, minutes: 0, formatted: '0m' };

      // --- AI Tutor Stats ---
      /*
      const db = require('../config/db');
      const [dailyLogs] = await db.query(
        'SELECT COUNT(*) as count FROM ai_tutor_logs WHERE student_id = ? AND created_at >= NOW() - INTERVAL 1 DAY',
        [userId]
      );
      const creditsUsed = dailyLogs[0].count;
      const totalCredits = 2;
      const creditsLeft = Math.max(0, totalCredits - creditsUsed);

      const [lastLog] = await db.query(
        'SELECT created_at FROM ai_tutor_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      let isLocked = false;
      let lockoutRemainingMs = 0;
      if (lastLog.length > 0) {
        const lastLogTime = new Date(lastLog[0].created_at).getTime();
        const now = Date.now();
        const hoursSinceLast = (now - lastLogTime) / (1000 * 60 * 60);

        if (hoursSinceLast < 6) {
          isLocked = true;
          lockoutRemainingMs = Math.floor((6 * 60 * 60 * 1000) - (now - lastLogTime));
        }
      }

      const aiTutorStats = {
        creditsLeft,
        totalCredits,
        isLocked,
        lockoutRemainingMs
      };
      */

      // Recent watched videos
      const recentVideos = await ProgressModel.getRecentlyWatchedVideos(userId, 6);
      const syllabusProgress =
        await ProgressModel.getSyllabusProgress(userId, profile.class);
      const dashboardData = {
        profile,
        enrolled,
        analytics: {
          analytics,
          topicBreakdown,
          weeklyActivity,
          scoreTrend,
          syllabusProgress
        },
        badges,
        timeline,
        courseProgress,
        recentVideos,
        stats: {
          streak,
          studyTime,
          hoursSpent: studyTime.formatted,
          lessonsFinished: attempts.length,
          completion: overallCompletion
        }
        // aiTutorStats // Removed since AI is disabled
      };

      // Cache the result
      dashboardCache.set(userIdStr, {
        data: dashboardData,
        timestamp: Date.now()
      });

      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (err) {
      next(err);
    }
  },

  async getResources(req, res, next) {
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      let category = req.query.category;
      const subcategory = req.query.subcategory;
      const search = req.query.search;
      const is_past_paper = req.query.is_past_paper;

      const db = require('../config/db');
      const [profileRows] = await db.query('SELECT class FROM students_profile WHERE user_id = ?', [req.user.id]);
      const studentClass = profileRows[0]?.class || null;

      if (studentClass && studentClass !== 'All') {
        category = studentClass;
      }

      if (page && limit) {
        const { data, totalItems, totalPages } = await ResourceModel.getPaginated(page, limit, category, subcategory, search, is_past_paper);
        return res.status(200).json({
          success: true,
          data,
          page,
          limit,
          totalPages,
          totalItems
        });
      }

      let resources = await ResourceModel.getAll();
      if (studentClass && studentClass !== 'All') {
        resources = resources.filter(r => (r.category || '').toLowerCase() === studentClass.toLowerCase());
      }
      res.status(200).json({ success: true, data: resources });
    } catch (err) {
      next(err);
    }
  },

  async getVideos(req, res, next) {
    console.log("===== GET VIDEOS HIT =====");
    console.log(req.user);

    try {
      const studentId = req.user.id;
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      let category = req.query.category;
      const subcategory = req.query.subcategory;
      const search = req.query.search;
      const is_past_paper = req.query.is_past_paper;
      const sort = req.query.sort || 'lecture_asc';

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

      const db = require('../config/db');
      const [profileRows] = await db.query('SELECT class FROM students_profile WHERE user_id = ?', [studentId]);
      const studentClass = profileRows[0]?.class || null;

      if (studentClass && studentClass !== 'All') {
        category = studentClass;
      }

      if (page && limit) {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const queryParams = [];

        if (category && category !== 'All') {
          whereClauses.push('v.category = ?');
          queryParams.push(category);
        }
        if (subcategory && subcategory !== 'All') {
          whereClauses.push('v.subcategory = ?');
          queryParams.push(subcategory);
        }
        if (search) {
          whereClauses.push('v.title LIKE ?');
          queryParams.push(`%${search}%`);
        }
        if (is_past_paper !== undefined && is_past_paper !== null && is_past_paper !== 'all') {
          whereClauses.push('v.is_past_paper = ?');
          queryParams.push(is_past_paper === 'past_papers' || is_past_paper === '1' || is_past_paper === 1 || is_past_paper === true ? 1 : 0);
        }

        whereSql = '';
        if (whereClauses.length > 0) {
          whereSql = 'WHERE ' + whereClauses.join(' AND ');
        }

        // Count query
        const [countRows] = await db.query(
          `SELECT COUNT(*) as count FROM videos v ${whereSql}`,
          queryParams
        );
        const totalItems = countRows[0].count;
        const totalPages = Math.ceil(totalItems / limit);

        if (sort === 'lecture_asc' || sort === 'title_az' || sort === 'category' || !sort) {

          const [rows] = await db.query(
            `SELECT v.id, v.title, v.url, v.video_id AS videoId, v.duration, v.thumbnail,
            v.category, v.subcategory, v.is_past_paper,
            v.created_at AS createdAt,
            COALESCE(vp.progress_percent, 0.00) AS progressPercent,
            COALESCE(vp.is_completed, 0) AS isCompleted,
            COALESCE(vp.last_position, 0) AS lastPosition
     FROM videos v
     LEFT JOIN video_progress vp
     ON v.id = vp.video_id AND vp.user_id = ?
     ${whereSql}`,
            [studentId, ...queryParams]
          );


          // Sirf All category pe natural sorting
          if (!category || category === 'All') {
            rows.sort(sortLecturesNaturally);
          }


          const paginatedData = rows.slice(offset, offset + limit);

          return res.status(200).json({
            success: true,
            data: paginatedData,
            page,
            limit,
            totalPages,
            totalItems
          });
        }
        // Fallback non-paginated
        // Fallback non-paginated
        let fallbackWhereSql = '';
        let fallbackQueryParams = [studentId];

        if (studentClass && studentClass !== 'All') {
          fallbackWhereSql = 'WHERE v.category = ?';
          fallbackQueryParams.push(studentClass);
        }

        const [rows] = await db.query(
          `SELECT v.id, v.title, v.url, v.video_id AS videoId, v.duration, v.thumbnail,
          v.category, v.subcategory, v.is_past_paper,
          v.created_at AS createdAt,
          COALESCE(vp.progress_percent, 0.00) AS progressPercent,
          COALESCE(vp.is_completed, 0) AS isCompleted,
          COALESCE(vp.last_position, 0) AS lastPosition
   FROM videos v
   LEFT JOIN video_progress vp
   ON v.id = vp.video_id AND vp.user_id = ?
   ${fallbackWhereSql}`,
          fallbackQueryParams
        );

        rows.sort(sortLecturesNaturally);

        res.status(200).json({
          success: true,
          data: rows
        });

      } // close if(page && limit)

    } catch (err) {
      next(err);
    }
  },

  // --- NOTIFICATIONS ---
  async getNotifications(req, res, next) {
    try {
      const studentId = req.user.id;
      const notifications = await NotificationModel.getByUserId(studentId);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markNotificationRead(req, res, next) {
    try {
      const studentId = req.user.id;
      const { id } = req.params;
      await NotificationModel.markAsRead(id, studentId);
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  async markAllNotificationsRead(req, res, next) {
    try {
      const studentId = req.user.id;
      await NotificationModel.markAllAsRead(studentId);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },

  // --- PRACTICE & ASSESSMENT SYSTEM ---
  async submitQuizAttempt(req, res, next) {
    try {
      const userId = req.user.id;
      const { answers, timeTaken, quizType, topic } = req.body;

      if (!answers || !Array.isArray(answers) || answers.length === 0 || timeTaken === undefined || !quizType) {
        res.status(400);
        throw new Error('Missing required quiz attempt fields.');
      }

      // Secure Server-Side Quiz Grading Engine
      const db = require('../config/db');
      const questionIds = answers.map(a => a.questionId);

      const [questions] = await db.query(
        'SELECT id, correctAnswer FROM question_pool WHERE id IN (?)',
        [questionIds]
      );

      const answerKey = {};
      questions.forEach(q => {
        answerKey[q.id] = q.correctAnswer;
      });

      let score = 0;
      const gradedAnswers = answers.map(a => {
        const correctAns = answerKey[a.questionId] || null;
        const isCorrect = a.selectedAnswer !== null && a.selectedAnswer !== undefined && String(a.selectedAnswer) === String(correctAns);
        if (isCorrect) {
          score++;
        }
        return {
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          correctAnswer: correctAns,
          isCorrect
        };
      });

      const totalQuestionsCount = answers.length;
      const percentage = totalQuestionsCount > 0 ? (score / totalQuestionsCount) * 100 : 0;

      // 1. Create attempt record
      const attemptId = await QuizAttemptModel.create(userId, {
        score,
        totalQuestions: totalQuestionsCount,
        percentage,
        answers: gradedAnswers,
        timeTaken,
        quizType,
        topic
      });

      // 2. Fetch all attempts to evaluate badges
      const allAttempts = await QuizAttemptModel.getByUserId(userId);
      const newAttempt = { score, totalQuestions: totalQuestionsCount, percentage, timeTaken, quizType, topic };

      // 3. Check and award badges
      const newBadges = await BadgeModel.checkAndAwardBadges(userId, newAttempt, allAttempts);

      // 4. Create notifications for any newly earned badges
      for (const badge of newBadges) {
        const title = 'New Achievement Unlocked!';
        const text = `Congratulations! You earned the "${badge.badgeName}" badge: ${badge.description}`;
        await NotificationModel.create(userId, title, text, 'badge');
      }

      // Create admin notification for quiz completion
      try {
        await NotificationModel.create(null, 'Quiz Completed', `Student ${req.user.email || 'Student'} completed a quiz: score ${score}/${totalQuestionsCount}.`, 'quiz_submission', 'admin');
      } catch (notifErr) {
        console.error('Failed to create admin notification for quiz completion', notifErr.message);
      }

      // Real-time update dashboard stats via Socket.io
      const { sendUpdatedDashboardStats } = require('../socket/handlers/users');
      const { getIO } = require('../socket');
      try {
        sendUpdatedDashboardStats(getIO());
      } catch (ioErr) {
        console.error('Socket stats update failed', ioErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Quiz attempt saved successfully.',
        data: {
          attemptId,
          percentage,
          newBadges
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getPerformanceAnalytics(req, res, next) {
    try {
      const userId = req.user.id;

      const analytics = await QuizAttemptModel.getAnalytics(userId);
      const topicBreakdown = await QuizAttemptModel.getTopicBreakdown(userId);
      const weeklyActivity = await QuizAttemptModel.getWeeklyActivity(userId);
      const scoreTrend = await QuizAttemptModel.getScoreTrend(userId, 10);
      const history = await QuizAttemptModel.getByUserId(userId);

      res.status(200).json({
        success: true,
        data: {
          analytics,
          topicBreakdown,
          weeklyActivity,
          scoreTrend,
          history: history.slice(0, 10)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getBadgesList(req, res, next) {
    try {
      const userId = req.user.id;
      // Auto-award any eligible badges before returning the list
      await BadgeModel.checkAndAwardVideoBadges(userId);
      const badges = await BadgeModel.getByUserId(userId);
      res.status(200).json({ success: true, data: badges });
    } catch (err) {
      next(err);
    }
  },

  async downloadResource(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await ResourceModel.getById(id);
      if (!resource) {
        res.status(404);
        throw new Error('Resource not found');
      }

      const path = require('path');
      const filePath = path.join(__dirname, '../..', resource.file_url);
      const fs = require('fs');

      if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error('Resource file does not exist on server');
      }

      // Increment downloads count in database
      const db = require('../config/db');
      await db.query('UPDATE resources SET downloads = downloads + 1 WHERE id = ?', [id]).catch(e => console.error('Failed to increment resource downloads:', e));
      try {
        const { broadcastToAdmins } = require('../socket');
        broadcastToAdmins('admin:analytics:update', { type: 'resource_download', id });
      } catch (socketErr) { }

      const originalFilename = resource.original_filename || path.basename(resource.file_url);
      res.download(filePath, originalFilename);
    } catch (err) {
      next(err);
    }
  },

  // --- UNBAN REQUESTS ---

  /**
   * Submit an unban request.
   * A student can only submit a new request if they have no current 'pending' request.
   * They may resubmit after a previous request was 'approved' or 'rejected'.
   */
  async submitUnbanRequest(req, res, next) {
    try {
      const studentId = req.user.id;
      const { message, reason = 'other', additionalExplanation } = req.body;

      if (!message || !message.trim()) {
        res.status(400);
        throw new Error('Please provide an appeal message.');
      }

      if (!reason || !reason.trim()) {
        res.status(400);
        throw new Error('Please provide a reason for your appeal.');
      }

      // Block if there's already a pending request
      const existing = await UnbanRequestModel.getPendingByStudentId(studentId);
      if (existing) {
        res.status(400);
        throw new Error('You already have a pending unban request. Please wait for admin review.');
      }

      const requestId = await UnbanRequestModel.create(
        studentId,
        message.trim(),
        reason.trim(),
        additionalExplanation ? additionalExplanation.trim() : null
      );

      // Notify the student that their request was received
      try {
        const notifId = await NotificationModel.create(
          studentId,
          'Unban Request Submitted',
          'Your account appeal has been submitted. The admin team will review it shortly.',
          'unban_request',
          'student'
        );
        const { getIO } = require('../socket');
        getIO().to(`student-${studentId}`).emit('notification:new', {
          id: notifId,
          userId: studentId,
          title: 'Unban Request Submitted',
          text: 'Your account appeal has been submitted. The admin team will review it shortly.',
          type: 'unban_request',
          role: 'student',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
      } catch (notifErr) {
        console.error('Student unban notification failed:', notifErr.message);
      }

      // Notify all admins about new unban request
      try {
        const profile = await UserModel.getProfile(studentId);
        const name = profile ? profile.name : 'Unknown';
        const email = profile ? profile.email : studentId;
        const notifId = await NotificationModel.create(
          null,
          'New Unban Request',
          `Student ${name} (${email}) has submitted an unban appeal.`,
          'unban_request',
          'admin'
        );
        const { getIO } = require('../socket');
        getIO().to('admins').emit('notification:new', {
          id: notifId,
          userId: null,
          title: 'New Unban Request',
          text: `Student ${name} (${email}) has submitted an unban appeal.`,
          type: 'unban_request',
          role: 'admin',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
      } catch (notifErr) {
        console.error('Admin unban notification failed:', notifErr.message);
      }

      // Broadcast to admins via socket
      try {
        const { broadcastToAdmins } = require('../socket');
        const profile = await UserModel.getProfile(studentId);
        broadcastToAdmins('admin:unban-request', {
          requestId,
          studentId,
          studentName: profile ? profile.name : req.user.email,
          message: message.trim(),
          createdAt: new Date()
        });
      } catch (socketErr) {
        console.error('Socket broadcast for unban request failed:', socketErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Your unban request has been submitted successfully. You will be notified once reviewed.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get the latest unban request for the current student (any status).
   */
  async getUnbanRequest(req, res, next) {
    try {
      const studentId = req.user.id;
      const latestRequest = await UnbanRequestModel.getLatestByStudentId(studentId);
      const profile = await UserModel.findById(studentId);
      res.status(200).json({
        success: true,
        data: {
          status: profile ? profile.status : 'active',
          hasPendingRequest: latestRequest ? latestRequest.status === 'pending' : false,
          unbanRequest: latestRequest
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // --- COURSE SPECIFIC ACTIONS ---
  async getCourseQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const db = require('../config/db');
      const [rows] = await db.query('SELECT questions FROM course_quizzes WHERE course_id = ?', [id]);
      let questions = [];
      if (rows.length > 0) {
        questions = typeof rows[0].questions === 'string' ? JSON.parse(rows[0].questions) : rows[0].questions;
      }

      // Strip correct answers before sending to student
      const studentQuestions = questions.map(q => ({
        question: q.question,
        options: q.options
      }));

      res.status(200).json({ success: true, data: studentQuestions });
    } catch (err) {
      next(err);
    }
  },

  async submitCourseQuiz(req, res, next) {
    try {
      const studentId = req.user.id;
      const { id } = req.params;
      const { answers } = req.body;
      const db = require('../config/db');

      const [rows] = await db.query('SELECT questions FROM course_quizzes WHERE course_id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      const questions = typeof rows[0].questions === 'string' ? JSON.parse(rows[0].questions) : rows[0].questions;

      let score = 0;
      answers.forEach(a => {
        const q = questions[a.questionId];
        if (q && q.correctAnswer === a.selectedAnswer) {
          score++;
        }
      });

      const total = questions.length;
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      const passed = percentage >= 80; // 80% passing grade

      // Format answers for DB
      const gradedAnswers = answers.map(a => {
        const q = questions[a.questionId] || {};
        return {
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.correctAnswer === a.selectedAnswer
        };
      });

      // Insert into quiz_attempts
      const QuizAttemptModel = require('../models/QuizAttemptModel');
      await QuizAttemptModel.create(studentId, {
        score,
        totalQuestions: total,
        percentage,
        answers: gradedAnswers,
        timeTaken: 0,
        quizType: 'course_final',
        topic: String(id) // use course ID as topic
      });

      if (passed) {
        // Record passing grade by keeping certificate_status as 'none'
      }

      res.status(200).json({
        success: true,
        data: {
          score: percentage,
          passed,
          totalQuestions: total,
          correctAnswers: score
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async payForCertificate(req, res, next) {
    try {
      const studentId = req.user.id;
      const { id } = req.params;
      const db = require('../config/db');

      // Update enrollment certificate status to pending_payment
      const [updateRes] = await db.query(
        'UPDATE enrollments SET certificate_status = ? WHERE student_id = ? AND course_id = ?',
        ['pending_payment', studentId, id]
      );

      if (updateRes.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      // Notify admins via socket
      try {
        const CourseModel = require('../models/CourseModel');
        const NotificationModel = require('../models/NotificationModel');
        const course = await CourseModel.getById(id);
        const courseName = course ? course.title : 'Course';

        const adminNotifId = await NotificationModel.create(
          null,
          'Certificate Request',
          `Student ${req.user.email} requested a certificate for "${courseName}".`,
          'enrollment', // Keep it enrollment type so ManageEnrollments auto-refreshes
          'admin'
        );
        const { getIO } = require('../socket');
        const io = getIO();
        io.to('admins').emit('notification:new', {
          id: adminNotifId,
          userId: null,
          title: 'Certificate Request',
          text: `Student ${req.user.email} requested a certificate for "${courseName}".`,
          type: 'enrollment',
          role: 'admin',
          isRead: 0,
          createdAt: new Date().toISOString()
        });
      } catch (notifErr) {
        console.error('Admin certificate request notification failed:', notifErr.message);
      }

      res.status(200).json({ success: true, message: 'Payment confirmed' });
    } catch (err) {
      next(err);
    }
  },

  async downloadCertificate(req, res, next) {
    try {
      const studentId = req.user.id;
      const { id } = req.params;
      const db = require('../config/db');

      // Check if certificate is issued
      const [enrollRows] = await db.query(
        'SELECT certificate_status FROM enrollments WHERE student_id = ? AND course_id = ?',
        [studentId, id]
      );

      if (enrollRows.length === 0 || enrollRows[0].certificate_status !== 'issued') {
        return res.status(403).json({ success: false, message: 'Certificate not issued yet' });
      }

      // Generate dynamic certificate image using Jimp
      const Jimp = require('jimp');
      const path = require('path');
      const fs = require('fs');

      const profile = await UserModel.getProfile(studentId);
      const templatePath = path.join(__dirname, '../../../frontend/public/CalculusCorner-Certificate.png');
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({ success: false, message: 'Template not found' });
      }

      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `attachment; filename="certificate-template.png"`);
      res.sendFile(templatePath);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching certificate' });
    }
  },

  async downloadMilestoneCertificate(req, res, next) {
    try {
      const studentId = req.user.id;
      const { milestone } = req.params;
      const db = require('../config/db');

      // Map milestone/badge parameter to Badge Name & Achievement Description
      let badgeName = 'Gold Learner Badge';
      let achievementDesc = 'in recognition of completing 30 educational video lessons and demonstrating commitment to continuous learning on Calculus Corner.';

      if (milestone.startsWith('Welcome')) {
        badgeName = 'Welcome Badge';
        achievementDesc = 'in recognition of your first successful login and joining the learning community on Calculus Corner.';
        const BadgeModel = require('../models/BadgeModel');
        await BadgeModel.awardBadge(studentId, 'Welcome Badge');
      } else if (milestone.startsWith('Fast')) {
        badgeName = 'Fast Starter Badge';
        achievementDesc = 'in recognition of starting your first educational video lesson on Calculus Corner.';
      } else if (milestone.startsWith('Consistency')) {
        badgeName = 'Consistency Badge';
        achievementDesc = 'in recognition of successfully completing 5 practice quiz assessments on Calculus Corner.';
      } else if (milestone.startsWith('Calculus')) {
        badgeName = 'Calculus Champion Badge';
        achievementDesc = 'in recognition of completing 10 high-scoring practice quizzes with 80% or higher accuracy on Calculus Corner.';
      } else if (milestone.startsWith('Bronze')) {
        badgeName = 'Bronze Learner Badge';
        achievementDesc = 'in recognition of completing 5 educational video lessons and demonstrating commitment to continuous learning on Calculus Corner.';
      } else if (milestone.startsWith('Silver')) {
        badgeName = 'Silver Learner Badge';
        achievementDesc = 'in recognition of completing 15 educational video lessons and demonstrating commitment to continuous learning on Calculus Corner.';
      } else if (milestone.startsWith('Gold')) {
        badgeName = 'Gold Learner Badge';
        achievementDesc = 'in recognition of completing 30 educational video lessons and demonstrating commitment to continuous learning on Calculus Corner.';
      } else if (milestone.startsWith('Master')) {
        badgeName = 'Master Learner Badge';
        achievementDesc = 'in recognition of completing 50 educational video lessons and demonstrating commitment to continuous learning on Calculus Corner.';
      }

      // Check and auto-evaluate video badges
      const BadgeModel = require('../models/BadgeModel');
      await BadgeModel.checkAndAwardVideoBadges(studentId);

      // Verify student has earned this badge
      const [badgeRows] = await db.query(
        'SELECT earnedAt FROM user_badges WHERE userId = ? AND (badgeName = ? OR badgeName LIKE ?)',
        [studentId, badgeName, `%${milestone}%`]
      );

      if (badgeRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: `You have not earned the ${milestone} certificate yet.`
        });
      }

      // Dynamic Image generation with Jimp
      const Jimp = require('jimp');
      const path = require('path');
      const fs = require('fs');

      const profile = await UserModel.getProfile(studentId);
      const studentName = profile ? (profile.name || 'Student') : 'Student';

      // Load All.png template (or fallback)
      // __dirname = backend/src/controllers → ../../../ = CalculusCorner root
      let templatePath = path.join(__dirname, '../../../frontend/public/All.png');
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(__dirname, '../../../frontend/public/CalculusCorner-Milestone-Certificate.png');
      }
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({ success: false, message: 'Certificate template not found' });
      }

      const image = await Jimp.read(templatePath);
      const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      const width = image.bitmap.width;   // 2000
      const height = image.bitmap.height;  // 1414

      // Transparent layers for each colored text section
      const nameLayer = new Jimp(width, height, 0x00000000); // Student Name   → blue
      const prefixLayer = new Jimp(width, height, 0x00000000); // prefix text    → dark navy
      const badgeLayer = new Jimp(width, height, 0x00000000); // Badge Name     → gold
      const suffixLayer = new Jimp(width, height, 0x00000000); // achievement desc → dark navy

      const printBold = (targetLayer, font, x, y, textOptions, boxWidth) => {
        targetLayer.print(font, x, y, textOptions, boxWidth);
        targetLayer.print(font, x + 1, y, textOptions, boxWidth);
        targetLayer.print(font, x, y + 1, textOptions, boxWidth);
      };

      // Build achievement description suffix per badge (with line break for readability)
      const achievementSuffix = achievementDesc.replace(
        ' and demonstrating',
        ' and\ndemonstrating'
      );

      // 1. STUDENT NAME — centered, X=350, Y=650, blue
      printBold(nameLayer, fontLarge, 350, 650, {
        text: studentName,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, 1300);

      // 2. PREFIX TEXT — centered, X=350, Y=750, dark navy
      printBold(prefixLayer, fontMed, 350, 750, {
        text: 'has successfully earned the',
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, 1300);

      // 3. BADGE NAME — centered, X=350, Y=810, gold
      printBold(badgeLayer, fontLarge, 350, 810, {
        text: badgeName,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, 1300);

      // 4. ACHIEVEMENT DESCRIPTION — centered, X=550, Y=930, dark navy
      printBold(suffixLayer, fontMed, 550, 930, {
        text: achievementSuffix,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, 1300);

      // ── Colorize each layer ──

      // Student Name → vibrant blue #2761f0 (39, 97, 240)
      nameLayer.scan(0, 0, nameLayer.bitmap.width, nameLayer.bitmap.height, function (x, y, idx) {
        if (this.bitmap.data[idx + 3] > 10) {
          this.bitmap.data[idx] = 39;
          this.bitmap.data[idx + 1] = 97;
          this.bitmap.data[idx + 2] = 240;
        }
      });

      // Prefix text → dark navy #1e293b (30, 41, 59)
      prefixLayer.scan(0, 0, prefixLayer.bitmap.width, prefixLayer.bitmap.height, function (x, y, idx) {
        if (this.bitmap.data[idx + 3] > 10) {
          this.bitmap.data[idx] = 30;
          this.bitmap.data[idx + 1] = 41;
          this.bitmap.data[idx + 2] = 59;
        }
      });

      // Badge Name → gold #D4981A (212, 152, 26)
      badgeLayer.scan(0, 0, badgeLayer.bitmap.width, badgeLayer.bitmap.height, function (x, y, idx) {
        if (this.bitmap.data[idx + 3] > 10) {
          this.bitmap.data[idx] = 212;
          this.bitmap.data[idx + 1] = 152;
          this.bitmap.data[idx + 2] = 26;
        }
      });

      // Achievement description → dark navy #1e293b (30, 41, 59)
      suffixLayer.scan(0, 0, suffixLayer.bitmap.width, suffixLayer.bitmap.height, function (x, y, idx) {
        if (this.bitmap.data[idx + 3] > 10) {
          this.bitmap.data[idx] = 30;
          this.bitmap.data[idx + 1] = 41;
          this.bitmap.data[idx + 2] = 59;
        }
      });

      // Composite all layers onto the certificate image
      image.composite(nameLayer, 0, 0);
      image.composite(prefixLayer, 0, 0);
      image.composite(badgeLayer, 0, 0);
      image.composite(suffixLayer, 0, 0);

      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `attachment; filename="CalculusCorner_${milestone}_Certificate.png"`);
      res.send(buffer);
    } catch (err) {
      console.error('Error generating certificate:', err);
      res.status(500).json({ success: false, message: 'Error generating certificate file' });
    }
  },

  // --- AI Math Tutor ---
  async getAiTutorStats(req, res, next) {
    try {
      // --- AI FEATURES DISABLED ---
      /*
      const studentId = req.user.id;
      const db = require('../config/db');
 
      const [dailyLogs] = await db.query(
        'SELECT COUNT(*) as count FROM ai_tutor_logs WHERE student_id = ? AND created_at >= NOW() - INTERVAL 1 DAY',
        [studentId]
      );
      const creditsUsed = dailyLogs[0].count;
      const totalCredits = 2;
      const creditsLeft = Math.max(0, totalCredits - creditsUsed);
 
      const [lastLog] = await db.query(
        'SELECT created_at FROM ai_tutor_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
        [studentId]
      );
 
      let isLocked = false;
      let lockoutRemainingMs = 0;
      if (lastLog.length > 0) {
        const lastLogTime = new Date(lastLog[0].created_at).getTime();
        const now = Date.now();
        const hoursSinceLast = (now - lastLogTime) / (1000 * 60 * 60);
 
        if (hoursSinceLast < 6) {
          isLocked = true;
          lockoutRemainingMs = Math.floor((6 * 60 * 60 * 1000) - (now - lastLogTime));
        }
      }
 
      res.status(200).json({ success: true, data: { creditsLeft, totalCredits, isLocked, lockoutRemainingMs } });
      */

      res.status(200).json({
        success: true,
        data: {
          creditsLeft: 0,
          totalCredits: 2,
          isLocked: true,
          lockoutRemainingMs: 0
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch AI tutor stats.' });
    }
  },

  async solveAiMathEquation(req, res, next) {
    try {
      // --- AI FEATURES DISABLED ---
      /*
      const studentId = req.user.id;
 
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Equation image is required.' });
      }
 
      const fs = require('fs');
      const db = require('../config/db');
 
      // Helper function to get stats
      const getStats = async () => {
        const [dailyLogs] = await db.query(
          'SELECT COUNT(*) as count FROM ai_tutor_logs WHERE student_id = ? AND created_at >= NOW() - INTERVAL 1 DAY',
          [studentId]
        );
        const creditsUsed = dailyLogs[0].count;
        const totalCredits = 2;
        const creditsLeft = Math.max(0, totalCredits - creditsUsed);
 
        const [lastLog] = await db.query(
          'SELECT created_at FROM ai_tutor_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
          [studentId]
        );
 
        let isLocked = false;
        let lockoutRemainingMs = 0;
        if (lastLog.length > 0) {
          const lastLogTime = new Date(lastLog[0].created_at).getTime();
          const now = Date.now();
          const hoursSinceLast = (now - lastLogTime) / (1000 * 60 * 60);
 
          if (hoursSinceLast < 6) {
            isLocked = true;
            lockoutRemainingMs = Math.floor((6 * 60 * 60 * 1000) - (now - lastLogTime));
          }
        }
        return { creditsLeft, totalCredits, isLocked, lockoutRemainingMs };
      };
 
      // 1. Check max 2 queries in the last 24 hours
      let currentStats = await getStats();
      if (currentStats.creditsLeft <= 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(429).json({ success: false, message: 'You have reached the daily limit of 2 AI Tutor queries.', aiTutorStats: currentStats });
      }
 
      // 2. Check 6-hour gap between queries
      if (currentStats.isLocked) {
        const remainingHours = Math.ceil(currentStats.lockoutRemainingMs / (1000 * 60 * 60));
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(429).json({ success: false, message: `Please wait ${remainingHours} more hour(s) before using the AI Tutor again.`, aiTutorStats: currentStats });
      }
 
 
 
      // 3. Call Gemini
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      if (!process.env.GEMINI_API_KEY_STD) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: 'GEMINI_API_KEY_STD is not configured on the server.' });
      }
 
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_STD);
      // Gemini 2.5 flash is multimodal and recommended
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
 
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Image = fileBuffer.toString('base64');
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype
        }
      };
 
      const prompt = `
       Analyze this image WITH EXTREME ACCURACY and high visual precision. Pay absolute attention to math notation: strictly differentiate between standard multiplication (e.g., 2x) and exponents/superscripts (e.g., 2ˣ).
 
CRITICAL VISUAL CHECK:
1. First, perform a strict visual parsing of the math problem. Check if any variable or number is written as an exponent/superscript (raised power) versus sitting on the baseline.
2. Specifically check terms like '2^x' vs '2x' or 'x^2' vs '2x'. Do NOT misinterpret a superscript exponent as a standard coefficient or multiplier.
3. Count how many SEPARATE, independent mathematical problems (equations or expressions to simplify/integrate) are present in the image. A single fraction within an integral sign represents ONE single problem. Do NOT count the numerator and denominator as separate entities.
4. If the image contains zero mathematical problems OR multiple separate/independent problems, stop immediately and return EXACTLY this JSON array: ["Error: Please upload an image containing exactly ONE math equation."]
 
If it contains EXACTLY ONE valid mathematical equation, expression, or integral, act as an AI Math Tutor. Solve or evaluate it step-by-step, and return a strict JSON array of strings where each element is a step.
 
IMPORTANT FORMATTING RULES:
- Do NOT use the caret (^) symbol for exponents in the final output steps.
- Use standard Unicode superscripts (e.g., x², x³, 2ˣ, eˣ) for a proper mathematical presentation.
- Use Unicode for fractions and integrals where possible.
Wrap any important formulas or key concepts in double asterisks (e.g. **Power Rule**) so they can be highlighted.
The final element in the array MUST start with exactly "Final Result: ". Do NOT output any markdown blocks like \`\`\`json, only raw valid JSON array.
      `;
 
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();
 
      if (req.file) fs.unlinkSync(req.file.path);
 
      // Clean up markdown wrapping if present
      text = text.replace(/```(json)?/gi, '').trim();
 
      let steps = [];
      try {
        let parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          steps = parsed;
        } else if (parsed && parsed.steps && Array.isArray(parsed.steps)) {
          steps = parsed.steps;
        } else {
          throw new Error("Gemini returned non-array JSON");
        }
      } catch (parseErr) {
        console.error("Gemini Parse Error:", parseErr, "\\nRaw output:", text);
        return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again later.' });
      }
 
      // Check if Gemini returned our instructed error message (which was valid JSON)
      if (steps.length > 0 && typeof steps[0] === 'string' && steps[0].startsWith("Error:")) {
        return res.status(400).json({ success: false, message: steps[0].replace("Error: ", "") });
      }
 
      // 4. Log the query
      await db.query(
        'INSERT INTO ai_tutor_logs (student_id) VALUES (?)',
        [studentId]
      );
 
      // Re-fetch stats after insert
      const newStats = await getStats();
 
      res.status(200).json({ success: true, data: { steps }, aiTutorStats: newStats });
      */

      if (req.file) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ success: false, message: 'AI Tutor has been disabled by Admin' });

    } catch (err) {
      if (req.file) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
      console.error("AI Tutor Error:", err);
      // Handle quota error
      if (err.status === 429 || (err.message && (err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('exhausted') || err.message.includes('429')))) {
        return res.status(429).json({ success: false, message: 'AI tutor has been disabled by Admin' });
      }
      res.status(500).json({ success: false, message: 'Server error processing AI Tutor query.' });
    }
  },

  async submitTestimonial(req, res, next) {
    try {
      const studentId = req.user.id;
      const { name, role, text, rating } = req.body;

      if (!text) {
        res.status(400);
        throw new Error('Review text is required');
      }

      const testimonialService = require('../services/testimonialService');
      const existing = await testimonialService.getTestimonialByStudentId(studentId);
      if (existing) {
        res.status(400);
        throw new Error('You have already submitted a review.');
      }

      const newId = await testimonialService.createTestimonial({
        name: name || req.user.name,
        role: role || 'Student',
        text,
        rating: rating || 5,
        status: 'pending',
        student_id: studentId
      });

      // Notify admin
      const NotificationModel = require('../models/NotificationModel');
      const adminNotifId = await NotificationModel.create(
        null,
        'New Student Review',
        `${name || req.user.name} submitted a new review. Pending approval.`,
        'testimonial',
        'admin'
      );

      const { getIO } = require('../socket');
      const io = getIO();
      io.to('admins').emit('notification:new', {
        id: adminNotifId,
        title: 'New Student Review',
        text: `${name || req.user.name} submitted a new review. Pending approval.`,
        type: 'testimonial',
        role: 'admin',
        isRead: 0,
        createdAt: new Date().toISOString()
      });

      // Also emit a general testimonial update so admin panel refreshes
      io.emit('site:testimonial-update');

      res.status(201).json({ success: true, message: 'Review submitted successfully and is pending approval.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = studentController;