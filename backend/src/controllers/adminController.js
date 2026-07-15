const CourseModel = require('../models/CourseModel');
const UserModel = require('../models/UserModel');
const ResourceModel = require('../models/ResourceModel');
const VideoModel = require('../models/VideoModel');
const AnnouncementModel = require('../models/AnnouncementModel');
const NotificationModel = require('../models/NotificationModel');
const UnbanRequestModel = require('../models/UnbanRequestModel');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { broadcastToAll, broadcastToAdmins, broadcastToStudents, getIO } = require('../socket');
const { sendUpdatedDashboardStats } = require('../socket/handlers/users');
const { clearUserStatusCache } = require('../middleware/authMiddleware');
const { sendUnbanEmail } = require('../services/emailService');

const adminController = {
  // --- COURSES CRUD ---
  async getCourses(req, res, next) {
    try {
      const courses = await CourseModel.getAll();
      res.status(200).json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  },

  async createCourse(req, res, next) {
    try {
      const { grade, title, description, features, price, popular, thumbnail, external_drive_links, certificate_price, quiz_required } = req.body;
      if (!title || !description) {
        res.status(400);
        throw new Error('Title and description are required');
      }

      const courseId = await CourseModel.create({
        grade,
        title,
        description,
        features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
        price,
        popular: popular ? 1 : 0,
        thumbnail: thumbnail || null,
        external_drive_links: Array.isArray(external_drive_links) ? external_drive_links : (external_drive_links ? [external_drive_links] : []),
        certificate_price: certificate_price || '0',
        quiz_required: quiz_required ? 1 : 0
      });

      const newCourse = await CourseModel.getById(courseId);

      // Real-time broadcasts
      broadcastToAll('course:create', newCourse);
      const notificationId = await NotificationModel.create(null, 'New Course Added!', `A new course "${newCourse.title}" is now available.`, 'course');
      const notification = { id: notificationId, userId: null, title: 'New Course Added!', text: `A new course "${newCourse.title}" is now available.`, type: 'course', isRead: 0, createdAt: new Date() };
      broadcastToStudents('notification:new', notification);
      sendUpdatedDashboardStats(getIO());

      res.status(201).json({ success: true, message: 'Course created successfully', data: newCourse });
    } catch (err) {
      next(err);
    }
  },

  async updateCourse(req, res, next) {
    try {
      const { id } = req.params;
      const { grade, title, description, features, price, popular, thumbnail, external_drive_links, certificate_price, quiz_required } = req.body;

      const course = await CourseModel.getById(id);
      if (!course) {
        res.status(404);
        throw new Error('Course not found');
      }

      await CourseModel.update(id, {
        grade: grade || course.grade,
        title: title || course.title,
        description: description || course.description,
        features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : course.features),
        price: price !== undefined ? price : course.price,
        popular: popular !== undefined ? (popular ? 1 : 0) : course.popular,
        thumbnail: thumbnail !== undefined ? thumbnail : course.thumbnail,
        external_drive_links: external_drive_links !== undefined ? (Array.isArray(external_drive_links) ? external_drive_links : [external_drive_links]) : course.external_drive_links,
        certificate_price: certificate_price !== undefined ? certificate_price : course.certificate_price,
        quiz_required: quiz_required !== undefined ? (quiz_required ? 1 : 0) : course.quiz_required
      });

      const updatedCourse = await CourseModel.getById(id);

      // Real-time updates
      broadcastToAll('course:update', updatedCourse);
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Course updated successfully', data: updatedCourse });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req, res, next) {
    try {
      const { id } = req.params;
      const course = await CourseModel.getById(id);
      if (!course) {
        res.status(404);
        throw new Error('Course not found');
      }

      await CourseModel.delete(id);

      // Real-time updates
      broadcastToAll('course:delete', { id: parseInt(id) });
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getCourseQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT questions FROM course_quizzes WHERE course_id = ?', [id]);
      let questions = [];
      if (rows.length > 0) {
        questions = typeof rows[0].questions === 'string' ? JSON.parse(rows[0].questions) : rows[0].questions;
      }
      res.status(200).json({ success: true, data: questions });
    } catch (err) {
      next(err);
    }
  },

  async saveCourseQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const { questions } = req.body;

      const qJson = JSON.stringify(questions || []);

      await db.query(
        `INSERT INTO course_quizzes (course_id, questions) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE questions = VALUES(questions)`,
        [id, qJson]
      );

      const { broadcastToAll } = require('../socket');
      broadcastToAll('quiz:update', { courseId: id });

      res.status(200).json({ success: true, message: 'Course quiz updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getCourseLeaderboard(req, res, next) {
    try {
      const { id } = req.params;
      // Note: In a real app we would join quiz_attempts with users to get the name, email and highest score per user for this course.
      // Since we don't have course_id in quiz_attempts natively (only topic), we'll do a basic query matching topic to course_id.
      const [rows] = await db.query(
        `SELECT qa.userId, u.name as userName, u.email as userEmail, MAX(qa.percentage) as score
         FROM quiz_attempts qa
         JOIN users u ON qa.userId = u.id
         WHERE qa.topic = ? OR qa.quizType = 'course_final'
         GROUP BY qa.userId, u.name, u.email
         ORDER BY score DESC
         LIMIT 50`,
        [id]
      );

      // Get awarded badges
      const [badges] = await db.query(
        `SELECT userId FROM user_badges WHERE badgeName = 'Gold Scholar' AND earnedAt IS NOT NULL`
      );
      const awardedUsers = new Set(badges.map(b => b.userId));

      const leaderboard = rows.map(r => ({
        ...r,
        hasBadge: awardedUsers.has(r.userId)
      }));

      res.status(200).json({ success: true, data: leaderboard });
    } catch (err) {
      next(err);
    }
  },

  async awardGoldBadge(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const [insertRes] = await db.query(
        `INSERT INTO user_badges (userId, badgeName, badgeIcon, description, earnedAt)
         VALUES (?, 'Gold Scholar', 'Award', 'Awarded for highest score in a course final assessment', CURRENT_TIMESTAMP)`,
        [userId]
      );
      res.status(200).json({ success: true, message: 'Badge awarded successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- STUDENTS CRUD ---
  async getStudents(req, res, next) {
    try {
      const students = await UserModel.getAllStudents();
      res.status(200).json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  },

  async getUnbanRequests(req, res, next) {
    try {
      // Return only pending requests to remove reviewed ones from active view
      const requests = await UnbanRequestModel.getAllPending();
      res.status(200).json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  },

  async reviewUnbanRequest(req, res, next) {
    try {
      const { id } = req.params;
      // Accept lowercase or capitalized status for flexibility
      const rawStatus = req.body.status || '';
      const { adminResponse } = req.body; // Optional message to student
      const reviewedBy = req.user.id;

      // Normalize to lowercase
      const status = rawStatus.toLowerCase();

      if (!['approved', 'rejected'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status. Must be \'approved\' or \'rejected\'');
      }

      const request = await UnbanRequestModel.getById(id);
      if (!request) {
        res.status(404);
        throw new Error('Unban request not found');
      }

      if (request.status !== 'pending') {
        res.status(400);
        throw new Error(`This request has already been ${request.status}.`);
      }

      await UnbanRequestModel.updateWithResponse(id, status, adminResponse || null, reviewedBy);

      if (status === 'approved') {
        // Restore student account
        await UserModel.unbanStudent(request.student_id);
        await UserModel.updateStatus(request.student_id, 'active');

        // Notify student — approval
        try {
          const responseMsg = adminResponse
            ? `Admin note: ${adminResponse}`
            : 'Your account has been fully restored. You can now access all study materials.';
          const notifId = await NotificationModel.create(
            request.student_id,
            'Unban Request Approved',
            responseMsg,
            'unban_request',
            'student'
          );
          try {
            getIO().to(`student-${request.student_id}`).emit('notification:new', {
              id: notifId,
              userId: request.student_id,
              title: 'Unban Request Approved',
              text: responseMsg,
              type: 'unban_request',
              role: 'student',
              isRead: 0,
              createdAt: new Date().toISOString()
            });
          } catch (e) {}
        } catch (notifErr) {
          console.error('Student approval notification failed:', notifErr.message);
        }

        // Broadcast restore to live client
        broadcastToAll('student:unbanned', { studentId: request.student_id });
      } else {
        // Notify student — rejection
        try {
          const responseMsg = adminResponse
            ? `Reason: ${adminResponse}`
            : 'Your unban request has been reviewed and was not approved at this time.';
          const notifId = await NotificationModel.create(
            request.student_id,
            'Unban Request Rejected',
            responseMsg,
            'unban_request',
            'student'
          );
          try {
            getIO().to(`student-${request.student_id}`).emit('notification:new', {
              id: notifId,
              userId: request.student_id,
              title: 'Unban Request Rejected',
              text: responseMsg,
              type: 'unban_request',
              role: 'student',
              isRead: 0,
              createdAt: new Date().toISOString()
            });
          } catch (e) {}
        } catch (notifErr) {
          console.error('Student rejection notification failed:', notifErr.message);
        }
      }

      // Notify clients and refresh dashboard stats
      const ioInstance = getIO();
      sendUpdatedDashboardStats(ioInstance);

      // Send unban email if request was approved (non-blocking)
      if (status === 'approved') {
        const studentUser = await UserModel.findById(request.student_id);
        sendUnbanEmail(studentUser).catch(err =>
          console.error('[EmailService] Unban approval email failed:', err.message)
        );
      }

      res.status(200).json({
        success: true,
        message: `Unban request has been ${status} successfully.`
      });
    } catch (err) {
      next(err);
    }
  },

  async banStudent(req, res, next) {
    try {
      const { id } = req.params;
      const { reason = '' } = req.body || {};
      const bannedBy = req.user.id;

      const student = await UserModel.findById(id);
      if (!student || student.role !== 'student') {
        res.status(404);
        throw new Error('Student not found');
      }

      const banReason = reason || 'No reason specified';
      await UserModel.banStudent(id, banReason, bannedBy);
      await UserModel.updateStatus(id, 'banned');
      clearUserStatusCache(id);

      // Live disconnect of the banned student
      const ioInstance = getIO();
      for (let [socketId, socket] of ioInstance.of("/").sockets) {
        if (socket.user && String(socket.user.id) === String(id)) {
          socket.emit('auth:banned', { message: `Your account has been banned...` });
          socket.disconnect(true);
        }
      }
      sendUpdatedDashboardStats(ioInstance);

      res.status(200).json({ success: true, message: 'Student account has been banned successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async unbanStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await UserModel.findById(id);
      if (!student || student.role !== 'student') {
        res.status(404);
        throw new Error('Student not found');
      }

      await UserModel.unbanStudent(id);
      await UserModel.updateStatus(id, 'active');
      clearUserStatusCache(id);
      sendUpdatedDashboardStats(getIO());

      // Broadcast unban event
      broadcastToAll('student:unbanned', { studentId: parseInt(id) });

      // Send unban email (non-blocking — failure never prevents unban)
      sendUnbanEmail(student).catch(err =>
        console.error('[EmailService] Unban email failed:', err.message)
      );

      res.status(200).json({ success: true, message: 'Student account has been unbanned successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await UserModel.findById(id);
      if (!student || student.role !== 'student') {
        res.status(404);
        throw new Error('Student not found');
      }

      // Live disconnect before deleting
      const ioInstance = getIO();
      for (let [socketId, socket] of ioInstance.of("/").sockets) {
        if (socket.user && String(socket.user.id) === String(id)) {
          socket.emit('auth:deleted', { message: 'Your account has been deleted.' });
          socket.disconnect(true);
        }
      }

      await UserModel.deleteStudent(id);
      sendUpdatedDashboardStats(ioInstance);

      res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- ENROLLMENTS MANAGEMENT ---
  async getPendingEnrollments(req, res, next) {
    try {
      const EnrollmentModel = require('../models/EnrollmentModel');
      const pending = await EnrollmentModel.getPendingEnrollments();
      res.status(200).json({ success: true, data: pending });
    } catch (err) {
      next(err);
    }
  },

  async approveEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const EnrollmentModel = require('../models/EnrollmentModel');

      const success = await EnrollmentModel.approveEnrollment(id);
      if (!success) {
        res.status(404);
        throw new Error('Enrollment not found or already approved.');
      }

      // We should probably notify the student here. 
      // Need the studentId for notification, which means we should fetch enrollment details.
      const db = require('../config/db');
      const [rows] = await db.query('SELECT student_id, course_id FROM enrollments WHERE id = ?', [id]);
      if (rows.length > 0) {
        const studentId = rows[0].student_id;
        const course = await CourseModel.getById(rows[0].course_id);

        await NotificationModel.create(
          studentId,
          'Enrollment Approved',
          `Your payment was verified and enrollment in "${course?.title || 'a course'}" has been approved!`,
          'enrollment',
          'student'
        );
      }

      res.status(200).json({ success: true, message: 'Enrollment approved successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- RESOURCES CRUD ---
  async getResources(req, res, next) {
    try {
      const resources = await ResourceModel.getAll();
      res.status(200).json({ success: true, data: resources });
    } catch (err) {
      next(err);
    }
  },

  async createResource(req, res, next) {
    try {
      const { title, category, subcategory } = req.body;
      if (!title) {
        res.status(400);
        throw new Error('Resource title is required');
      }

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (!fileObj) {
        res.status(400);
        throw new Error('Please upload a file');
      }

      const file_url = '/uploads/resources/' + fileObj.filename;
      const original_filename = fileObj.originalname || fileObj.filename;
      let thumbnail_url = null;
      if (thumbObj) {
         thumbnail_url = '/uploads/resources/' + thumbObj.filename;
      }

      // Automatically extract and persist file metadata
      const path = require('path');
      const ext = path.extname(original_filename).replace('.', '').toLowerCase();
      const metadata = {
        size_bytes: fileObj.size,
        extension: ext,
        mime_type: fileObj.mimetype || 'application/octet-stream'
      };

      const ResourceModel = require('../models/ResourceModel');
      const NotificationModel = require('../models/NotificationModel');
      const { broadcastToAll, broadcastToStudents, getIO } = require('../socket');
      const { sendUpdatedDashboardStats } = require('../socket/handlers/users');

      const resourceId = await ResourceModel.create(title, file_url, original_filename, metadata, category || 'General', subcategory || null, thumbnail_url);
      const newResource = await ResourceModel.getById(resourceId);

      // Real-time broadcasts & notifications
      broadcastToAll('resource:create', newResource);
      const notificationId = await NotificationModel.create(null, 'New Resource Uploaded', `Study Sheet: ${newResource.title}`, 'resource');
      const notification = { id: notificationId, userId: null, title: 'New Resource Uploaded', text: `Study Sheet: ${newResource.title}`, type: 'resource', isRead: 0, createdAt: new Date() };
      broadcastToStudents('notification:new', notification);
      sendUpdatedDashboardStats(getIO());

      res.status(201).json({ success: true, message: 'Resource created successfully', data: newResource });
    } catch (err) {
      next(err);
    }
  },

  async updateResource(req, res, next) {
    try {
      const { id } = req.params;
      const { title, category, subcategory } = req.body;
      const ResourceModel = require('../models/ResourceModel');
      const path = require('path');
      const fs = require('fs');

      const resource = await ResourceModel.getById(id);
      if (!resource) {
        res.status(404);
        throw new Error('Resource not found');
      }

      let file_url = resource.file_url;
      let original_filename = resource.original_filename || null;
      let metadata = resource.metadata || null;
      let thumbnail_url = resource.thumbnail_url || null;

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (fileObj) {
        file_url = '/uploads/resources/' + fileObj.filename;
        original_filename = fileObj.originalname || fileObj.filename;

        // Re-extract metadata for the new file
        const ext = path.extname(original_filename).replace('.', '').toLowerCase();
        metadata = {
          size_bytes: fileObj.size,
          extension: ext,
          mime_type: fileObj.mimetype || 'application/octet-stream'
        };

        // Delete old file if it was a local upload
        if (resource.file_url && resource.file_url.startsWith('/uploads/resources/')) {
          const oldFilePath = path.join(__dirname, '../..', resource.file_url);
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Failed to delete old resource file:', err.message);
          });
        }
      }

      if (thumbObj) {
        thumbnail_url = '/uploads/resources/' + thumbObj.filename;
        if (resource.thumbnail_url && resource.thumbnail_url.startsWith('/uploads/resources/')) {
          const oldFilePath = path.join(__dirname, '../..', resource.thumbnail_url);
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Failed to delete old resource thumbnail:', err.message);
          });
        }
      }

      await ResourceModel.update(id, title || resource.title, file_url, original_filename, metadata, category || resource.category, subcategory !== undefined ? subcategory : resource.subcategory, thumbnail_url);
      const updatedResource = await ResourceModel.getById(id);

      const { broadcastToAll, getIO } = require('../socket');
      const { sendUpdatedDashboardStats } = require('../socket/handlers/users');

      // Real-time broadcasts
      broadcastToAll('resource:update', updatedResource);
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Resource updated successfully', data: updatedResource });
    } catch (err) {
      next(err);
    }
  },

  async deleteResource(req, res, next) {
    try {
      const { id } = req.params;
      const ResourceModel = require('../models/ResourceModel');
      const path = require('path');
      const fs = require('fs');

      const resource = await ResourceModel.getById(id);
      if (!resource) {
        res.status(404);
        throw new Error('Resource not found');
      }

      // delete file on disk
      if (resource.file_url && resource.file_url.startsWith('/uploads/resources/')) {
        const filePath = path.join(__dirname, '../..', resource.file_url);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete resource file:', err.message);
        });
      }

      // delete thumb on disk
      if (resource.thumbnail_url && resource.thumbnail_url.startsWith('/uploads/resources/')) {
        const filePath = path.join(__dirname, '../..', resource.thumbnail_url);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete resource thumbnail:', err.message);
        });
      }

      await ResourceModel.delete(id);

      const { broadcastToAll, getIO } = require('../socket');
      const { sendUpdatedDashboardStats } = require('../socket/handlers/users');

      // Real-time broadcasts
      broadcastToAll('resource:delete', { id: parseInt(id) });
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Videos CRUD
  async getVideos(req, res, next) {
    try {
      const videos = await VideoModel.getAll();
      res.status(200).json({ success: true, data: videos });
    } catch (err) {
      next(err);
    }
  },

  async createVideo(req, res, next) {
    try {
      const { title, url, videoId, thumbnail, category } = req.body;
      if (!title || !url || !videoId) {
        res.status(400);
        throw new Error('Title, video URL, and videoId are required');
      }

      // Check if duplicate videoId exists
      const existing = await VideoModel.getByVideoId(videoId);
      if (existing) {
        res.status(400);
        throw new Error('This video has already been added to the library.');
      }

      const insertedId = await VideoModel.create(title, url, videoId, thumbnail, category);
      const newVideo = await VideoModel.getById(insertedId);

      // Real-time broadcasts & notifications
      broadcastToAll('video:create', newVideo);
      const notificationId = await NotificationModel.create(null, 'New Video Added', `New Lecture: ${newVideo.title}`, 'video');
      const notification = { id: notificationId, userId: null, title: 'New Video Added', text: `New Lecture: ${newVideo.title}`, type: 'video', isRead: 0, createdAt: new Date() };
      broadcastToStudents('notification:new', notification);
      sendUpdatedDashboardStats(getIO());

      res.status(201).json({ success: true, message: 'Video created successfully', data: newVideo });
    } catch (err) {
      next(err);
    }
  },

  async updateVideo(req, res, next) {
    try {
      const { id } = req.params;
      const { title, url, videoId, thumbnail, category } = req.body;

      const video = await VideoModel.getById(id);
      if (!video) {
        res.status(404);
        throw new Error('Video not found');
      }

      // Check duplicate videoId if it is changing
      if (videoId && videoId !== video.videoId) {
        const existing = await VideoModel.getByVideoId(videoId);
        if (existing) {
          res.status(400);
          throw new Error('Another video with this YouTube ID already exists.');
        }
      }

      await VideoModel.update(
        id,
        title || video.title,
        url || video.url,
        videoId || video.videoId,
        thumbnail || video.thumbnail,
        category || video.category
      );
      const updatedVideo = await VideoModel.getById(id);

      // Real-time updates
      broadcastToAll('video:update', updatedVideo);
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Video updated successfully', data: updatedVideo });
    } catch (err) {
      next(err);
    }
  },

  async deleteVideo(req, res, next) {
    try {
      const { id } = req.params;
      const video = await VideoModel.getById(id);
      if (!video) {
        res.status(404);
        throw new Error('Video not found');
      }

      await VideoModel.delete(id);

      // Real-time updates
      broadcastToAll('video:delete', { id: parseInt(id) });
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Video deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- ENROLLMENTS ---
  async getPendingEnrollments(req, res, next) {
    try {
      const db = require('../config/db');
      const [rows] = await db.query(
        `SELECT e.id as enrollmentId, e.created_at, e.status, e.certificate_status,
                u.name as studentName, u.email as studentEmail,
                c.title as courseTitle, c.price as coursePrice, c.certificate_price
         FROM enrollments e
         JOIN users u ON e.student_id = u.id
         JOIN courses c ON e.course_id = c.id
         ORDER BY 
           (e.status = 'pending_payment' OR e.certificate_status = 'pending_payment') DESC, 
           e.created_at DESC`
      );

      const requests = rows.map(r => {
        let type = 'Course Enrollment';
        if (r.certificate_status === 'pending_payment' || r.certificate_status === 'issued') {
          type = 'Certificate Request';
        }
        return {
          ...r,
          type
        };
      });

      res.status(200).json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  },

  async approveEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const db = require('../config/db');

      const [enrollRows] = await db.query('SELECT status, certificate_status, student_id, course_id FROM enrollments WHERE id = ?', [id]);
      if (enrollRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      const enroll = enrollRows[0];
      const CourseModel = require('../models/CourseModel');
      const NotificationModel = require('../models/NotificationModel');
      const { getIO } = require('../socket');
      
      const course = await CourseModel.getById(enroll.course_id);
      const courseName = course ? course.title : 'Course';

      if (enroll.status === 'pending_payment') {
        await db.query("UPDATE enrollments SET status = 'approved' WHERE id = ?", [id]);
        
        const notifId = await NotificationModel.create(
          enroll.student_id,
          'Enrollment Approved',
          `Your enrollment in "${courseName}" has been approved!`,
          'enrollment',
          'student'
        );
        try {
          getIO().to(`student-${enroll.student_id}`).emit('notification:new', {
            id: notifId,
            userId: enroll.student_id,
            title: 'Enrollment Approved',
            text: `Your enrollment in "${courseName}" has been approved!`,
            type: 'enrollment',
            role: 'student',
            isRead: 0,
            createdAt: new Date().toISOString()
          });
          getIO().to(`student-${enroll.student_id}`).emit('enrollment:updated', { courseId: enroll.course_id });
          getIO().to('admins').emit('admin:enrollment:update');
        } catch (e) { console.error(e.message); }
      } else if (enroll.certificate_status === 'pending_payment') {
        await db.query("UPDATE enrollments SET certificate_status = 'issued' WHERE id = ?", [id]);
        
        const notifId = await NotificationModel.create(
          enroll.student_id,
          'Certificate Issued',
          `Your certificate for "${courseName}" has been issued!`,
          'certificate',
          'student'
        );
        try {
          getIO().to(`student-${enroll.student_id}`).emit('notification:new', {
            id: notifId,
            userId: enroll.student_id,
            title: 'Certificate Issued',
            text: `Your certificate for "${courseName}" has been issued!`,
            type: 'certificate',
            role: 'student',
            isRead: 0,
            createdAt: new Date().toISOString()
          });
          getIO().to(`student-${enroll.student_id}`).emit('enrollment:updated', { courseId: enroll.course_id });
          getIO().to('admins').emit('admin:enrollment:update');
        } catch (e) { console.error(e.message); }
      }

      sendUpdatedDashboardStats(getIO());
      const { broadcastToAdmins } = require('../socket');
      broadcastToAdmins('admin:enrollment-approved', { id });

      res.status(200).json({ success: true, message: 'Request approved' });
    } catch (err) {
      next(err);
    }
  },

  async rejectEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const db = require('../config/db');

      const [enrollRows] = await db.query('SELECT status, certificate_status, student_id, course_id FROM enrollments WHERE id = ?', [id]);
      if (enrollRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      const enroll = enrollRows[0];
      const CourseModel = require('../models/CourseModel');
      const NotificationModel = require('../models/NotificationModel');
      const { getIO, broadcastToAdmins } = require('../socket');
      
      const course = await CourseModel.getById(enroll.course_id);
      const courseName = course ? course.title : 'Course';

      if (enroll.status === 'pending_payment') {
        await db.query("UPDATE enrollments SET status = 'rejected' WHERE id = ?", [id]);
        
        const notifId = await NotificationModel.create(
          enroll.student_id,
          'Enrollment Rejected',
          `Your enrollment in "${courseName}" has been rejected. Please contact support if you believe this is an error.`,
          'enrollment',
          'student'
        );
        try {
          getIO().to(`student-${enroll.student_id}`).emit('notification:new', {
            id: notifId,
            userId: enroll.student_id,
            title: 'Enrollment Rejected',
            text: `Your enrollment in "${courseName}" has been rejected. Please contact support if you believe this is an error.`,
            type: 'enrollment',
            role: 'student',
            isRead: 0,
            createdAt: new Date().toISOString()
          });
          getIO().to(`student-${enroll.student_id}`).emit('enrollment:updated', { courseId: enroll.course_id });
        } catch (e) { console.error(e.message); }
      } else if (enroll.certificate_status === 'pending_payment') {
        await db.query("UPDATE enrollments SET certificate_status = 'rejected' WHERE id = ?", [id]);
        
        const notifId = await NotificationModel.create(
          enroll.student_id,
          'Certificate Request Rejected',
          `Your certificate request for "${courseName}" has been rejected.`,
          'certificate',
          'student'
        );
        try {
          getIO().to(`student-${enroll.student_id}`).emit('notification:new', {
            id: notifId,
            userId: enroll.student_id,
            title: 'Certificate Request Rejected',
            text: `Your certificate request for "${courseName}" has been rejected.`,
            type: 'certificate',
            role: 'student',
            isRead: 0,
            createdAt: new Date().toISOString()
          });
          getIO().to(`student-${enroll.student_id}`).emit('enrollment:updated', { courseId: enroll.course_id });
          getIO().to('admins').emit('admin:enrollment:update');
        } catch (e) { console.error(e.message); }
      }

      sendUpdatedDashboardStats(getIO());
      broadcastToAdmins('admin:enrollment-approved', { id }); // reuse event to refresh admin dashboard

      res.status(200).json({ success: true, message: 'Request rejected' });
    } catch (err) {
      next(err);
    }
  },

  // --- ANNOUNCEMENTS CRUD ---
  async getAnnouncements(req, res, next) {
    try {
      const announcements = await AnnouncementModel.getAll();
      res.status(200).json({ success: true, data: announcements });
    } catch (err) {
      next(err);
    }
  },

  async createAnnouncement(req, res, next) {
    try {
      const { title, text, link, active, priority, start_date, end_date, display_order } = req.body;
      if (!text) {
        res.status(400);
        throw new Error('Announcement text is required');
      }

      const insertId = await AnnouncementModel.create({
        title,
        text,
        link,
        active,
        priority: parseInt(priority) || 0,
        start_date: start_date || null,
        end_date: end_date || null,
        display_order: parseInt(display_order) || 0
      });

      const newAnnouncement = await AnnouncementModel.getById(insertId);

      // Real-time updates
      broadcastToAll('announcement:create', newAnnouncement);
      if (newAnnouncement.active) {
        const notificationId = await NotificationModel.create(null, 'New Announcement Published', newAnnouncement.text, 'announcement');
        const notification = { id: notificationId, userId: null, title: 'New Announcement Published', text: newAnnouncement.text, type: 'announcement', isRead: 0, createdAt: new Date() };
        broadcastToStudents('notification:new', notification);

        // Asynchronously email active subscribers (fire-and-forget)
        const emailService = require('../services/emailService');
        emailService.sendAnnouncementEmailToSubscribers(newAnnouncement).catch(err => {
          console.error('[AdminController] Announcement email trigger failed:', err);
        });
      }
      sendUpdatedDashboardStats(getIO());

      res.status(201).json({ success: true, message: 'Announcement created successfully', data: newAnnouncement });
    } catch (err) {
      next(err);
    }
  },

  async updateAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const { title, text, link, active, priority, start_date, end_date, display_order } = req.body;

      const announcement = await AnnouncementModel.getById(id);
      if (!announcement) {
        res.status(404);
        throw new Error('Announcement not found');
      }

      await AnnouncementModel.update(id, {
        title: title !== undefined ? title : announcement.title,
        text: text !== undefined ? text : announcement.text,
        link: link !== undefined ? link : announcement.link,
        active: active !== undefined ? active : announcement.active,
        priority: priority !== undefined ? parseInt(priority) : announcement.priority,
        start_date: start_date !== undefined ? start_date : announcement.start_date,
        end_date: end_date !== undefined ? end_date : announcement.end_date,
        display_order: display_order !== undefined ? parseInt(display_order) : announcement.display_order
      });

      const updatedAnnouncement = await AnnouncementModel.getById(id);

      // Real-time updates
      broadcastToAll('announcement:update', updatedAnnouncement);

      const wasActive = announcement.active;
      const isNowActive = updatedAnnouncement.active;
      if (isNowActive && !wasActive) {
        // Asynchronously email active subscribers (fire-and-forget)
        const emailService = require('../services/emailService');
        emailService.sendAnnouncementEmailToSubscribers(updatedAnnouncement).catch(err => {
          console.error('[AdminController] Announcement email trigger failed:', err);
        });
      }

      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Announcement updated successfully', data: updatedAnnouncement });
    } catch (err) {
      next(err);
    }
  },

  async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const announcement = await AnnouncementModel.getById(id);
      if (!announcement) {
        res.status(404);
        throw new Error('Announcement not found');
      }

      await AnnouncementModel.delete(id);

      // Real-time updates
      broadcastToAll('announcement:delete', { id: parseInt(id) });
      sendUpdatedDashboardStats(getIO());

      res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- ANALYTICS ---
  async getAnalytics(req, res, next) {
    try {
      const studentsCount = await UserModel.getStudentsCount();
      const coursesCount = await CourseModel.getCount();
      const resourcesCount = await ResourceModel.getCount();
      const videosCount = await VideoModel.getCount();

      // AI features were removed, mock the analytics so the frontend doesn't crash
      const aiStats = { totalConversations: 0, totalMessages: 0 };

      const [annRows] = await db.query("SELECT COUNT(*) as count FROM announcements");

      res.status(200).json({
        success: true,
        data: {
          studentsCount,
          coursesCount,
          resourcesCount,
          videosCount,
          announcementsCount: annRows[0].count,
          aiSessionsCount: aiStats.totalConversations,
          aiMessagesCount: aiStats.totalMessages,
          // placeholder reviews/views count
          viewsCount: 1540,
          reviewsCount: 3
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // --- QUESTION POOL MANAGEMENT ---
  async getQuestionPoolStats(req, res, next) {
    try {
      const QuestionModel = require('../models/QuestionModel');
      const stats = await QuestionModel.getStats();

      // --- AI FEATURES DISABLED ---
      /*
      const db = require('../config/db');
      
      const [logs] = await db.query(
        'SELECT created_at FROM ai_generation_logs ORDER BY created_at DESC LIMIT 1'
      );
      
      
      stats.aiRestricted = false;
      stats.aiRestrictionTimeLeft = 0;
      
      if (logs.length > 0) {
        const lastLogTime = new Date(logs[0].created_at).getTime();
        const now = Date.now();
        const hoursSinceLast = (now - lastLogTime) / (1000 * 60 * 60);
        

        if (hoursSinceLast < 8 && hoursSinceLast >= 0) {
          stats.aiRestricted = true;
          stats.aiRestrictionTimeLeft = Math.ceil((8 - hoursSinceLast) * 60 * 60); // in seconds
        } else if (hoursSinceLast < 0) {
           // Timezone issue: DB time is in the future relative to Node.
           // E.g. DB is local (+5) but Node is parsing as UTC, or something similar.
           stats.aiRestricted = true;
           // If it's a 5 hour diff, maybe we just use 8 hours from now?
           // Let's calculate based on exact seconds difference
           const exactSeconds = Math.ceil(8 * 60 * 60 + (lastLogTime - now) / 1000);
           stats.aiRestrictionTimeLeft = exactSeconds;
        }
      }
      */

      stats.aiRestricted = true;
      stats.aiRestrictionTimeLeft = 0;

      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  async getQuestions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      const QuestionModel = require('../models/QuestionModel');
      const questions = await QuestionModel.getPaginated(offset, limit, search);
      const total = await QuestionModel.getCount(search);

      const formattedQuestions = questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      res.status(200).json({
        success: true,
        data: formattedQuestions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const { topic, question, options, correctAnswer, difficulty } = req.body;

      if (!topic || !question || !options || !correctAnswer || !difficulty) {
        res.status(400);
        throw new Error('All fields are required.');
      }

      if (!Array.isArray(options) || options.length < 2) {
        res.status(400);
        throw new Error('Options must be an array with at least 2 items.');
      }

      if (!options.includes(correctAnswer)) {
        res.status(400);
        throw new Error('Correct answer must be one of the options.');
      }

      const QuestionModel = require('../models/QuestionModel');
      const existing = await QuestionModel.getById(id);
      if (!existing) {
        res.status(404);
        throw new Error('Question not found');
      }

      await QuestionModel.update(id, { topic, question, options, correctAnswer, difficulty });
      const updated = await QuestionModel.getById(id);
      updated.options = typeof updated.options === 'string' ? JSON.parse(updated.options) : updated.options;

      // Broadcast update
      const stats = await QuestionModel.getStats();
      broadcastToAll('question_pool:update', stats);

      res.status(200).json({ success: true, message: 'Question updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const QuestionModel = require('../models/QuestionModel');
      const existing = await QuestionModel.getById(id);
      if (!existing) {
        res.status(404);
        throw new Error('Question not found');
      }

      await QuestionModel.deleteById(id);

      // Broadcast update
      const stats = await QuestionModel.getStats();
      broadcastToAll('question_pool:update', stats);

      res.status(200).json({ success: true, message: 'Question deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteTopic(req, res, next) {
    try {
      const { topic } = req.params;
      const QuestionModel = require('../models/QuestionModel');
      await QuestionModel.deleteByTopic(topic);

      // Broadcast update
      const stats = await QuestionModel.getStats();
      broadcastToAll('question_pool:update', stats);

      res.status(200).json({ success: true, message: `Topic "${topic}" and all its questions deleted successfully` });
    } catch (err) {
      next(err);
    }
  },

  async uploadQuestionPool(req, res, next) {
    try {
      const { mode, questions } = req.body; // mode: 'replace' or 'append'

      if (!questions || (!questions.topics && !Array.isArray(questions))) {
        res.status(400);
        throw new Error('Invalid JSON format. Must contain a "topics" array or a flat list of questions.');
      }

      const questionsToInsert = [];
      const seenIdsInFile = new Set();

      const processQuestion = (q, topicName) => {
        if (!q.id || !q.question || !q.options || !q.correctAnswer) {
          throw new Error(`Invalid question format. Missing required fields in question ID: ${q.id || 'unknown'}`);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`Question ID ${q.id} must have at least 2 options.`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ID ${q.id} correct answer "${q.correctAnswer}" must be one of the options [${q.options.join(', ')}].`);
        }
        if (seenIdsInFile.has(q.id)) {
          throw new Error(`Duplicate question ID "${q.id}" found within the uploaded file.`);
        }
        seenIdsInFile.add(q.id);

        questionsToInsert.push({
          id: q.id,
          topic: topicName || q.topic || 'General',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty || 'easy'
        });
      };

      if (questions.topics) {
        if (!Array.isArray(questions.topics)) {
          res.status(400);
          throw new Error('"topics" must be an array.');
        }
        for (const topic of questions.topics) {
          if (!topic.name || !Array.isArray(topic.questions)) {
            res.status(400);
            throw new Error('Each topic must have a "name" and a "questions" array.');
          }
          for (const q of topic.questions) {
            processQuestion(q, topic.name);
          }
        }
      } else if (Array.isArray(questions)) {
        for (const q of questions) {
          processQuestion(q, q.topic);
        }
      }

      const QuestionModel = require('../models/QuestionModel');

      // Check duplicates against DB if mode is append
      if (mode === 'append') {
        for (const q of questionsToInsert) {
          const existing = await QuestionModel.getById(q.id);
          if (existing) {
            res.status(400);
            throw new Error(`Question with ID "${q.id}" already exists in the question pool. Import canceled.`);
          }
        }
      }

      // Perform DB changes
      if (mode === 'replace') {
        await QuestionModel.clearPool();
      }

      // Insert all
      for (const q of questionsToInsert) {
        await QuestionModel.create(q);
      }

      // Broadcast update
      const stats = await QuestionModel.getStats();
      broadcastToAll('question_pool:update', stats);

      res.status(200).json({
        success: true,
        message: `Successfully uploaded question pool. Inserted ${questionsToInsert.length} questions.`,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  },

  async parseImportFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const originalName = req.file.originalname || '';
      const extension = originalName.split('.').pop().toLowerCase();

      const {
        QuizParserContext,
        PDFQuizParserStrategy,
        DocxQuizParserStrategy,
        TextQuizParserStrategy,
        XlsxQuizParserStrategy,
        JsonQuizParserStrategy
      } = require('../services/pdfParser');
      const { validateBatch } = require('../services/quizValidator');

      let strategy;
      if (extension === 'pdf') {
        strategy = new PDFQuizParserStrategy();
      } else if (extension === 'docx' || extension === 'doc') {
        strategy = new DocxQuizParserStrategy();
      } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
        strategy = new XlsxQuizParserStrategy();
      } else if (extension === 'txt') {
        strategy = new TextQuizParserStrategy();
      } else if (extension === 'json') {
        strategy = new JsonQuizParserStrategy();
      } else {
        return res.status(400).json({ success: false, message: `Unsupported file extension: .${extension}` });
      }

      const context = new QuizParserContext(strategy);
      let parsedQuestions = [];
      try {
        parsedQuestions = await context.parse(req.file.buffer);
      } catch (parseError) {
        console.error('Parsing failed:', parseError);
        let userMsg = 'Failed to parse document. The file might be corrupted, password-protected, or in an invalid format.';
        if (parseError.message && parseError.message.includes('password')) {
          userMsg = 'Parsing failed: The PDF file is password-protected.';
        }
        return res.status(400).json({ success: false, message: userMsg });
      }

      if (!parsedQuestions || parsedQuestions.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid questions could be detected in the document. Please verify the layout and formatting.' });
      }

      const validation = validateBatch(parsedQuestions);
      const invalidCount = parsedQuestions.filter(q => q.needsReview).length;
      const confidence = parsedQuestions.length > 0
        ? Math.round(((parsedQuestions.length - invalidCount) / parsedQuestions.length) * 100)
        : 100;

      res.status(200).json({
        success: true,
        questions: parsedQuestions,
        confidence,
        validation
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message || 'An unexpected error occurred while parsing the document.' });
    }
  },

  async bulkImportQuestions(req, res, next) {
    try {
      const { questions, topic, difficulty, mode } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: 'No questions provided for import.' });
      }

      if (!topic || !topic.trim()) {
        return res.status(400).json({ success: false, message: 'Target topic name is required.' });
      }

      const QuestionModel = require('../models/QuestionModel');

      // Fetch all existing questions to detect duplicates by text
      const allExistingQuestions = await QuestionModel.getAll();
      const existingQuestionTexts = new Set(
        allExistingQuestions.map(q => q.question.trim().toLowerCase())
      );
      const existingIds = new Set(
        allExistingQuestions.map(q => String(q.id).trim().toLowerCase())
      );

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;

      if (mode === 'replace') {
        const questionsInTopic = await QuestionModel.getByTopic(topic);
        for (const q of questionsInTopic) {
          await QuestionModel.deleteById(q.id);
        }
      }

      const seenInBatch = new Set();

      for (const q of questions) {
        if (!q.question || !q.question.trim()) {
          failCount++;
          continue;
        }

        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          failCount++;
          continue;
        }

        if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === '') {
          failCount++;
          continue;
        }

        const normalizedText = q.question.trim().toLowerCase();
        if (seenInBatch.has(normalizedText)) {
          skipCount++;
          continue;
        }
        seenInBatch.add(normalizedText);

        if (mode === 'append' && (existingQuestionTexts.has(normalizedText) || (q.id && existingIds.has(String(q.id).trim().toLowerCase())))) {
          skipCount++;
          continue;
        }

        // Resolve correctAnswer to option string if it's an index
        let resolvedAnswer = q.correctAnswer;
        if (typeof q.correctAnswer === 'number' && q.options[q.correctAnswer] !== undefined) {
          resolvedAnswer = q.options[q.correctAnswer];
        } else if (typeof q.correctAnswer === 'string') {
          const charCode = q.correctAnswer.toUpperCase().charCodeAt(0);
          if (charCode >= 65 && charCode <= 68) {
            const idx = charCode - 65;
            if (q.options[idx] !== undefined) {
              resolvedAnswer = q.options[idx];
            }
          }
        }

        resolvedAnswer = String(resolvedAnswer).trim();

        if (!q.options.map(o => String(o).trim().toLowerCase()).includes(resolvedAnswer.toLowerCase())) {
          failCount++;
          continue;
        }

        const newId = q.id && !String(q.id).startsWith('q_manual') && !String(q.id).startsWith('q_xlsx') && !String(q.id).startsWith('q_json')
          ? q.id
          : `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const payload = {
          id: newId,
          topic: topic.trim(),
          question: q.question.trim(),
          options: q.options.map(opt => String(opt).trim()),
          correctAnswer: resolvedAnswer,
          difficulty: q.difficulty || difficulty || 'easy'
        };

        try {
          await QuestionModel.create(payload);
          successCount++;
        } catch (dbError) {
          console.error('Failed to create question in database:', dbError);
          failCount++;
        }
      }

      const stats = await QuestionModel.getStats();
      broadcastToAll('question_pool:update', stats);

      res.status(200).json({
        success: true,
        message: 'Import completed.',
        stats: {
          successCount,
          skipCount,
          failCount
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'An error occurred during bulk import.' });
    }
  },

  async getNotifications(req, res, next) {
    try {
      const notifications = await NotificationModel.getAdminNotifications();
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;
      await NotificationModel.markAdminAsRead(id);
      res.status(200).json({ success: true, message: 'Admin notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  async markAllNotificationsRead(req, res, next) {
    try {
      await NotificationModel.markAllAdminAsRead();
      res.status(200).json({ success: true, message: 'All admin notifications marked as read' });
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

      const originalFilename = resource.original_filename || path.basename(resource.file_url);
      res.download(filePath, originalFilename);
    } catch (err) {
      next(err);
    }
  },
  async viewResource(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await ResourceModel.getById(id);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(__dirname, '../..', resource.file_url);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.setHeader(
        'Content-Disposition',
        `inline; filename="${resource.original_filename}"`
      );

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  },

  // --- NEWSLETTER MANAGEMENT ---
  async getNewsletterSubscribers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const status = req.query.status || '';

      const NewsletterModel = require('../models/NewsletterModel');
      const result = await NewsletterModel.getPaginated({ page, limit, search, status });
      const analytics = await NewsletterModel.getAnalytics();

      res.status(200).json({
        success: true,
        data: result.subscribers,
        total: result.totalCount,
        analytics
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteNewsletterSubscriber(req, res, next) {
    try {
      const { id } = req.params;
      const NewsletterModel = require('../models/NewsletterModel');
      const deleted = await NewsletterModel.deleteById(id);
      if (!deleted) {
        res.status(404);
        throw new Error('Subscriber not found');
      }
      res.status(200).json({ success: true, message: 'Subscriber removed successfully' });
    } catch (err) {
      next(err);
    }
  },

  async updateNewsletterSubscriberStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value. Must be active or inactive.' });
      }

      const NewsletterModel = require('../models/NewsletterModel');
      const updated = await NewsletterModel.updateStatus(id, status);
      if (!updated) {
        res.status(404);
        throw new Error('Subscriber not found');
      }

      res.status(200).json({ success: true, message: 'Subscriber status updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async exportNewsletterSubscribers(req, res, next) {
    try {
      const format = req.query.format || 'csv';
      const NewsletterModel = require('../models/NewsletterModel');

      // Fetch all subscribers for full export
      const result = await NewsletterModel.getPaginated({ page: 1, limit: 1000000 });
      const subscribers = result.subscribers;

      const exportData = subscribers.map(s => ({
        ID: s.id,
        Email: s.email,
        Status: s.status,
        'Subscribed On': new Date(s.created_at).toLocaleString(),
        'Last Email Sent': s.last_email_sent ? new Date(s.last_email_sent).toLocaleString() : 'Never'
      }));

      if (format === 'excel') {
        const xlsx = require('xlsx');
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Subscribers');
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.xlsx"');
        return res.status(200).send(buffer);
      }

      // Default CSV export
      const header = 'id,email,status,subscribed_at,last_email_sent\n';
      const rows = subscribers
        .map(s => `${s.id},"${s.email}","${s.status}","${new Date(s.created_at).toISOString()}","${s.last_email_sent ? new Date(s.last_email_sent).toISOString() : 'never'}"`)
        .join('\n');
      const csv = header + rows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  },

  async generateAIQuiz(req, res, next) {
    try {
      // --- AI FEATURES DISABLED ---
      /*
      const { topic, difficulty } = req.body;
      const adminId = req.user?.id;
      

      if (!topic || !difficulty) {
        return res.status(400).json({ success: false, message: 'Topic and difficulty are required.' });
      }

      const db = require('../config/db');

      // Check Rate Limits: 1 per 8 hours
      const [logs] = await db.query(
        'SELECT created_at FROM ai_generation_logs ORDER BY created_at DESC LIMIT 1'
      );

      if (logs.length > 0) {
        const lastLogTime = new Date(logs[0].created_at).getTime();
        const now = Date.now();
        const hoursSinceLast = (now - lastLogTime) / (1000 * 60 * 60);

        if (hoursSinceLast < 8 && hoursSinceLast >= 0) {
          return res.status(429).json({ success: false, message: \`Please wait \${Math.ceil(8 - hoursSinceLast)} hours before generating another quiz.\` });
        } else if (hoursSinceLast < 0) {
          return res.status(429).json({ success: false, message: \`Please wait 8 hours before generating another quiz.\` });
        }
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // Try models in order — if one hits quota, fall back to the next
      const modelsToTry = [
        'gemini-2.5-flash',
      ];

      const prompt = \`You are an expert Mathematics professor. Generate exactly 30 unique multiple-choice questions on the topic of "\${topic}" at a "\${difficulty}" difficulty level.
RULES:
- Every question must be completely different — absolutely NO repeated or similar questions.
- Each question must have exactly 4 answer options.
- Only one option must be the correct answer.
- The correctAnswer field MUST exactly match one of the strings in the options array.
Return ONLY a raw JSON array with no markdown, no code fences, no extra text. Format:
[
  {
    "question": "What is the derivative of x^2?",
    "options": ["2x", "x", "x^2", "2"],
    "correctAnswer": "2x"
  }
]\`;

      let text = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          break; // success — stop trying other models
        } catch (modelErr) {
          lastError = modelErr;
          if (modelErr.status === 429) {
            continue; // try next model
          }
          throw modelErr; // non-quota error — rethrow immediately
        }
      }

      if (!text) {
        // All models failed due to quota
        const retrySeconds = lastError?.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay?.replace('s', '') || 60;
        return res.status(429).json({
          success: false,
          message: \`Your Gemini API free tier quota is exhausted. Please get a new API key from https://aistudio.google.com or retry in \${retrySeconds} seconds.\`
        });
      }

      // Clean up potential markdown formatting
      text = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/gi, '').trim();

      const generatedQuestions = JSON.parse(text);

      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("AI returned invalid format");
      }

      // Ensure exact 30
      const finalQuestions = generatedQuestions.slice(0, 30);

      // Log generation
      await db.query('INSERT INTO ai_generation_logs (user_id) VALUES (?)', [adminId]);

      res.status(200).json({ success: true, data: finalQuestions });
      */

      return res.status(403).json({ success: false, message: 'AI Quiz Generation is disabled.' });

    } catch (err) {
      console.error('AI Generation Error:', err);
      res.status(500).json({ success: false, message: 'Failed to generate AI Quiz. Please try again.' });
    }
  },

  // --- SUBJECTS (Books) CRUD ---
  async getSubjects(req, res, next) {
    try {
      const BookModel = require('../models/BookModel');
      const books = await BookModel.getAll();
      res.status(200).json({ success: true, data: books });
    } catch (err) {
      next(err);
    }
  },

  async createSubject(req, res, next) {
    try {
      const { title, category, subcategory } = req.body;
      if (!title) {
        res.status(400);
        throw new Error('Book title is required');
      }

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (!fileObj) {
        res.status(400);
        throw new Error('Please upload a file');
      }

      const file_url = '/uploads/resources/' + fileObj.filename;
      const original_filename = fileObj.originalname || fileObj.filename;
      let thumbnail_url = null;
      if (thumbObj) {
         thumbnail_url = '/uploads/resources/' + thumbObj.filename;
      }

      const path = require('path');
      const ext = path.extname(original_filename).replace('.', '').toLowerCase();
      const metadata = {
        size_bytes: fileObj.size,
        extension: ext,
        mime_type: fileObj.mimetype || 'application/octet-stream'
      };

      const BookModel = require('../models/BookModel');
      const bookId = await BookModel.create(title, file_url, original_filename, metadata, category || 'General', subcategory || null, thumbnail_url);
      const newBook = await BookModel.getById(bookId);

      const { broadcastToAll } = require('../socket');
      broadcastToAll('subject:create', newBook);

      res.status(201).json({ success: true, message: 'Book created successfully', data: newBook });
    } catch (err) {
      next(err);
    }
  },

  async updateSubject(req, res, next) {
    try {
      const { id } = req.params;
      const { title, category, subcategory } = req.body;
      const BookModel = require('../models/BookModel');
      const path = require('path');
      const fs = require('fs');

      const book = await BookModel.getById(id);
      if (!book) {
        res.status(404);
        throw new Error('Book not found');
      }

      let file_url = book.file_url;
      let original_filename = book.original_filename || null;
      let metadata = book.metadata || null;
      let thumbnail_url = book.thumbnail_url || null;

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (fileObj) {
        file_url = '/uploads/resources/' + fileObj.filename;
        original_filename = fileObj.originalname || fileObj.filename;
        const ext = path.extname(original_filename).replace('.', '').toLowerCase();
        metadata = {
          size_bytes: fileObj.size,
          extension: ext,
          mime_type: fileObj.mimetype || 'application/octet-stream'
        };

        if (book.file_url && book.file_url.startsWith('/uploads/resources/')) {
          const oldFilePath = path.join(__dirname, '../..', book.file_url);
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Failed to delete old book file:', err.message);
          });
        }
      }

      if (thumbObj) {
        thumbnail_url = '/uploads/resources/' + thumbObj.filename;
        if (book.thumbnail_url && book.thumbnail_url.startsWith('/uploads/resources/')) {
          const oldFilePath = path.join(__dirname, '../..', book.thumbnail_url);
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Failed to delete old book thumbnail:', err.message);
          });
        }
      }

      await BookModel.update(id, title || book.title, file_url, original_filename, metadata, category || book.category, subcategory !== undefined ? subcategory : book.subcategory, thumbnail_url);
      const updatedBook = await BookModel.getById(id);

      const { broadcastToAll } = require('../socket');
      broadcastToAll('subject:update', updatedBook);

      res.status(200).json({ success: true, message: 'Book updated successfully', data: updatedBook });
    } catch (err) {
      next(err);
    }
  },

  async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;
      const BookModel = require('../models/BookModel');
      const path = require('path');
      const fs = require('fs');

      const book = await BookModel.getById(id);
      if (!book) {
        res.status(404);
        throw new Error('Book not found');
      }

      if (book.file_url && book.file_url.startsWith('/uploads/resources/')) {
        const filePath = path.join(__dirname, '../..', book.file_url);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete book file:', err.message);
        });
      }

      if (book.thumbnail_url && book.thumbnail_url.startsWith('/uploads/resources/')) {
        const filePath = path.join(__dirname, '../..', book.thumbnail_url);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete book thumbnail:', err.message);
        });
      }

      await BookModel.delete(id);

      const { broadcastToAll } = require('../socket');
      broadcastToAll('subject:delete', { id: parseInt(id) });

      res.status(200).json({ success: true, message: 'Book deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async requestReview(req, res, next) {
    try {
      const { id } = req.params; // student_id
      
      const { getIO } = require('../socket');
      const io = getIO();
      
      io.to(`student-${id}`).emit('student:review-request', {
        title: 'Review Requested',
        message: 'Admin has requested you to share your feedback.'
      });
      
      res.status(200).json({ success: true, message: 'Review request sent successfully' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = adminController;
