const express = require('express');
const studentController = require('../controllers/studentController');
const progressController = require('../controllers/progressController');
const { protect, isStudent } = require('../middleware/authMiddleware');
const imageUpload = require('../middleware/imageUploadMiddleware');

const router = express.Router();

// Apply auth protection & student guard to all routes below
router.use(protect);
router.use(isStudent);

// Student Profile
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.post('/profile/avatar', imageUpload.single('avatar'), studentController.uploadAvatar);
router.get('/dashboard', studentController.getDashboard);

// Learning Materials
router.get('/courses', studentController.getCourses);
router.get('/resources', studentController.getResources);
router.get('/resources/:id/download', studentController.downloadResource);
router.get('/videos', studentController.getVideos);

// Progress Tracking
router.post('/progress/video/:videoId', progressController.updateVideoProgress);
router.get('/progress/recent', progressController.getRecentlyWatched);
router.get('/progress/summary', progressController.getProgressSummary);

// Course Enrollment
router.post('/enroll', studentController.enrollCourse);

// Course specific routes
router.get('/courses/:id/quiz', studentController.getCourseQuiz);
router.post('/courses/:id/quiz/submit', studentController.submitCourseQuiz);
router.post('/courses/:id/certificate/pay', studentController.payForCertificate);
router.get('/courses/:id/certificate', studentController.downloadCertificate);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);
router.put('/notifications/:id/read', studentController.markNotificationRead);

// Practice & Assessments
router.post('/practice/attempt', studentController.submitQuizAttempt);
router.get('/practice/analytics', studentController.getPerformanceAnalytics);
router.get('/practice/badges', studentController.getBadgesList);

// AI Math Tutor
router.get('/tutor/stats', studentController.getAiTutorStats);
router.post('/tutor/solve', imageUpload.single('equationImage'), studentController.solveAiMathEquation);

// Unban Requests
router.post('/unban-request', studentController.submitUnbanRequest);
router.get('/unban-request', studentController.getUnbanRequest);

// Testimonials (Student Review)
router.post('/testimonials', studentController.submitTestimonial);

// Support Chat Messages
const supportController = require('../controllers/supportController');
router.get('/support-messages', supportController.getMessages);
router.post('/support-messages', supportController.sendMessage);

module.exports = router;
