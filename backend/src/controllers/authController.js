const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { performance } = require('perf_hooks');
const UserModel = require('../models/UserModel');
const emailService = require('../services/emailService');

const login = async (req, res, next) => {
  const startTime = performance.now();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Validate from MySQL
    const user = await UserModel.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    if (user.status === 'banned') {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: 'Your account has been banned. Please contact support.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }



    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Stamp last_login timestamp and award Welcome Badge
    try {
      await UserModel.updateLastLogin(user.id);
      if (user.role === 'student') {
        const BadgeModel = require('../models/BadgeModel');
        await BadgeModel.awardBadge(user.id, 'Welcome Badge');
      }
    } catch (_) {}

    let studentClass = null;
    if (user.role === 'student') {
      const db = require('../config/db');
      const [pRows] = await db.query('SELECT class FROM students_profile WHERE user_id = ?', [user.id]);
      if (pRows.length > 0) {
        studentClass = pRows[0].class;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: studentClass
      },
      data: {
        token,
        user: {
          id: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          class: studentClass
        }
      }
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[PERF] Failed Login for ${req.body.email || 'unknown'} took ${duration.toFixed(2)}ms. Error: ${error.message}`);
    next(error);
  }
};

const register = async (req, res, next) => {
  const startTime = performance.now();
  try {
    const { name, email, password, courseId, class: className } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      if (existingUser.is_verified === 1) {
        res.status(400);
        throw new Error('Email address already registered');
      } else {
        // Delete unverified student records so they can register fresh
        const db = require('../config/db');
        await db.query('DELETE FROM students_profile WHERE user_id = ?', [existingUser.id]);
        await db.query('DELETE FROM users WHERE id = ?', [existingUser.id]);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student user and blank profile
    const userId = await UserModel.createStudent(name, email, hashedPassword, className);

    // Auto-enroll student if course is selected
    if (courseId) {
      try {
        const EnrollmentModel = require('../models/EnrollmentModel');
        const ProgressModel = require('../models/ProgressModel');
        const CourseModel = require('../models/CourseModel');
        await EnrollmentModel.enrollWithCheck(userId, courseId);
        await ProgressModel.upsertCourseProgress(userId, courseId, 0);

        // Also update class field in profile based on course grade
        const course = await CourseModel.getById(courseId);
        if (course && course.grade) {
          const db = require('../config/db');
          await db.query('UPDATE students_profile SET class = ? WHERE user_id = ?', [course.grade, userId]);
        }
      } catch (enrollErr) {
        console.error('Failed to auto-enroll student on registration:', enrollErr.message);
      }
    }

    // NEW: Generate OTP and send email instead of logging in
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiry = new Date(Date.now() + 10 * 60000); // Pass Date object to avoid timezone string issues

    await UserModel.setVerificationOTP(email, otp, expiry);
    await emailService.sendOTPVerificationEmail(email, name, otp);

    const duration = performance.now() - startTime;
    
    // Return requireOTP flag
    res.status(201).json({
      success: true,
      requireOTP: true,
      email: email,
      message: 'Registration successful. Please verify your email.'
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[PERF] Failed User Registration took ${duration.toFixed(2)}ms. Error: ${error.message}`);
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Email and OTP are required');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.is_verified === 1) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    if (user.verification_otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP code');
    }

    if (new Date() > new Date(user.otp_expiry)) {
      res.status(400);
      throw new Error('OTP code has expired. Please request a new one.');
    }

    // Mark as verified
    await UserModel.verifyStudent(email);

    // Create admin notification upon successful OTP verification
    try {
      const NotificationModel = require('../models/NotificationModel');
      await NotificationModel.create(null, 'New Student Registered', `Student ${user.name} (${email}) has joined the platform.`, 'registration', 'admin');
    } catch (notifErr) {
      console.error('Failed to create admin notification for registration', notifErr.message);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    let studentClass = null;
    if (user.role === 'student') {
      const db = require('../config/db');
      const [pRows] = await db.query('SELECT class FROM students_profile WHERE user_id = ?', [user.id]);
      if (pRows.length > 0) {
        studentClass = pRows[0].class;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: studentClass
      },
      data: {
        token,
        user: {
          id: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          class: studentClass
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.is_verified === 1) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    await UserModel.setVerificationOTP(email, otp, expiry);
    await emailService.sendOTPVerificationEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.'
    });

  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal user existence, just return success
      return res.status(200).json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000);

    await UserModel.setVerificationOTP(email, otp, expiry);
    // You could create a specific sendPasswordResetEmail, but reusing this for now or just genericizing it is okay.
    // Assuming emailService has a generic OTP or we can just use sendOTPVerificationEmail.
    await emailService.sendOTPVerificationEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset code has been sent.'
    });

  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Email, OTP, and new password are required');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.verification_otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP code');
    }

    if (new Date() > new Date(user.otp_expiry)) {
      res.status(400);
      throw new Error('OTP code has expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(user.id, hashedPassword);
    // Clear OTP
    await UserModel.verifyStudent(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Current and new passwords are required');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(userId, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword
};
