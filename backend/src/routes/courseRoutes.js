const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected course write operations (Admins only)
router.post('/', protect, isAdmin, courseController.createCourse);
router.put('/:id', protect, isAdmin, courseController.updateCourse);
router.delete('/:id', protect, isAdmin, courseController.deleteCourse);

module.exports = router;
