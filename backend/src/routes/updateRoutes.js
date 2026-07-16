const express = require('express');
const updateController = require('../controllers/updateController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route to view all updates
router.get('/', updateController.getUpdates);

// Admin-guarded routes
router.post('/admin', protect, isAdmin, updateController.createUpdate);
router.put('/admin/:id', protect, isAdmin, updateController.updateUpdate);
router.delete('/admin/:id', protect, isAdmin, updateController.deleteUpdate);

module.exports = router;
