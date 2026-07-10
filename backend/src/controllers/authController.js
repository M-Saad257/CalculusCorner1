const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { performance } = require('perf_hooks');
const UserModel = require('../models/UserModel');

const login = async (req, res, next) => {
  const startTime = performance.now();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // 1. Check if Hardcoded Admin
    if (email === 'Thecalculuscornerofficial@gmail.com' && password === '#1Maths.Teacher@com') {
      const adminToken = jwt.sign(
        { id: 0, email: 'Thecalculuscornerofficial@gmail.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const duration = performance.now() - startTime;

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token: adminToken,
        user: {
          id: 0,
          name: 'System Admin',
          email: 'Thecalculuscornerofficial@gmail.com',
          role: 'admin'
        },
        data: {
          token: adminToken,
          user: {
            id: 0,
            username: 'admin',
            email: 'Thecalculuscornerofficial@gmail.com',
            role: 'admin'
          }
        }
      });
    }

    // 2. Otherwise validate Student from MySQL
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
      
      const duration = performance.now() - startTime;

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

    const duration = performance.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      data: {
        token,
        user: {
          id: user.id,
          username: user.name,
          email: user.email,
          role: user.role
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400);
      throw new Error('Email address already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student user and blank profile
    const userId = await UserModel.createStudent(name, email, hashedPassword);

    // Create admin notification
    try {
      const NotificationModel = require('../models/NotificationModel');
      await NotificationModel.create(null, 'New Student Registered', `Student ${name} (${email}) has joined the platform.`, 'registration', 'admin');
    } catch (notifErr) {
      console.error('Failed to create admin notification for registration', notifErr.message);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email: email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const duration = performance.now() - startTime;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'student'
      },
      data: {
        token,
        user: {
          id: userId,
          username: name,
          email,
          role: 'student'
        }
      }
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[PERF] Failed User Registration took ${duration.toFixed(2)}ms. Error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  login,
  register
};
