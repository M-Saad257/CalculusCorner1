const express = require('express');
const updateController = require('../controllers/updateController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/updateUpload');

const router = express.Router();


// ===============================
// Public Route
// Get all updates
// ===============================
router.get(
  '/',
  updateController.getUpdates
);


// ===============================
// Admin Routes
// Create Update with Image Upload
// ===============================
router.post(
  '/admin',
  protect,
  isAdmin,
  upload.single('image'),
  updateController.createUpdate
);


// ===============================
// Update Existing Update with Image Upload
// ===============================
router.put(
  '/admin/:id',
  protect,
  isAdmin,
  upload.single('image'),
  updateController.updateUpdate
);


// ===============================
// Delete Update
// ===============================
router.delete(
  '/admin/:id',
  protect,
  isAdmin,
  updateController.deleteUpdate
);


module.exports = router;