const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', testimonialController.getAllTestimonials);

// Protected testimonial write operations (Admins only)
router.post('/', protect, isAdmin, testimonialController.createTestimonial);
router.delete('/:id', protect, isAdmin, testimonialController.deleteTestimonial);

module.exports = router;
