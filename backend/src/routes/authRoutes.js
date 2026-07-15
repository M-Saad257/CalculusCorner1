const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    success: false,
    message: 'Too many attempts. Try again later.'
  },
  skip: (req) => req.body && req.body.email === 'Thecalculuscornerofficial@gmail.com',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
