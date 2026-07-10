const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth protection & admin guard to all routes below
router.use(protect);
router.use(isAdmin);

// Courses CRUD
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.get('/courses/:id/quiz', adminController.getCourseQuiz);
router.post('/courses/:id/quiz', adminController.saveCourseQuiz);
router.get('/courses/:id/leaderboard', adminController.getCourseLeaderboard);
router.post('/courses/:id/award-badge', adminController.awardGoldBadge);

// Subjects CRUD
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);


// Students CRUD
router.get('/students', adminController.getStudents);
router.get('/students/unban-requests', adminController.getUnbanRequests);
router.put('/students/unban-requests/:id', adminController.reviewUnbanRequest);
router.put('/students/:id/ban', adminController.banStudent);
router.put('/students/:id/unban', adminController.unbanStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/:id/request-review', adminController.requestReview);

// Enrollments Management
router.get('/enrollments', adminController.getPendingEnrollments);
router.put('/enrollments/:id/approve', adminController.approveEnrollment);
router.put('/enrollments/:id/reject', adminController.rejectEnrollment);

// Announcements CRUD
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.put('/announcements/:id', adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

const upload = require('../middleware/uploadMiddleware');
const multer = require('multer');
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Resources CRUD
router.get('/resources', adminController.getResources);
router.get('/resources/:id/download', adminController.downloadResource);
router.post('/resources', upload.single('file'), adminController.createResource);
router.put('/resources/:id', upload.single('file'), adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);

// Videos CRUD
router.get('/videos', adminController.getVideos);
router.post('/videos', adminController.createVideo);
router.put('/videos/:id', adminController.updateVideo);
router.delete('/videos/:id', adminController.deleteVideo);

// Question Pool Management
router.get('/questions/stats', adminController.getQuestionPoolStats);
router.get('/questions', adminController.getQuestions);
router.post('/questions/upload', adminController.uploadQuestionPool);
router.post('/questions/parse-file', uploadMemory.single('file'), adminController.parseImportFile);
router.post('/questions/bulk-import', adminController.bulkImportQuestions);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.delete('/questions/topic/:topic', adminController.deleteTopic);

// AI Quiz Generation

// Analytics Dashboard
router.get('/analytics', adminController.getAnalytics);

// Admin Notifications
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);
router.put('/notifications/:id/read', adminController.markNotificationRead);

// Support Chat Messages
const supportController = require('../controllers/supportController');
router.get('/support-messages/students', supportController.getChatStudents);
router.get('/support-messages/:studentId', supportController.getStudentMessages);
router.post('/support-messages/:studentId', supportController.replyToStudent);

// Newsletter Subscriber Management (Admin)
router.get('/newsletter', adminController.getNewsletterSubscribers);
router.get('/newsletter/export', adminController.exportNewsletterSubscribers);
router.delete('/newsletter/:id', adminController.deleteNewsletterSubscriber);
router.patch('/newsletter/:id/status', adminController.updateNewsletterSubscriberStatus);

// Testimonial Management
const testimonialController = require('../controllers/testimonialController');
router.put('/testimonials/:id/status', testimonialController.updateTestimonialStatus);

module.exports = router;
