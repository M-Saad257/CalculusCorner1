const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const resourceRoutes = require('./routes/resourcesRoute');
const subjectRoutes = require('./routes/subjectRoutes');

const app = express();

// Serve uploaded resources statically with security options
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// --- GLOBAL MIDDLEWARES ---

// Security headers
app.use(helmet());

// CORS settings
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// HTTP Request Logger
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Disable caching for API routes to prevent stale 304 states
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// JSON Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- REST API ENDPOINTS ---
const practiceController = require('./controllers/practiceController');
app.get('/api/practice/questions', practiceController.getQuestions);
app.get('/api/practice/topics', practiceController.getTopics);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/subjects', subjectRoutes);

// Base route test
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Calculus Corner REST API is running...',
    data: {
      version: '1.0.0',
      status: 'production-ready'
    }
  });
});

// ─── Dynamic Favicon & OG Image proxy routes ────────────────────────────────
// These routes resolve the admin-uploaded logo as the site favicon and OG image,
// so search engines, social platforms, and browsers always see the current logo.
const serveDynamicLogo = async (req, res, fallback) => {
  try {
    const db = require('./config/db');
    const [rows] = await db.query(
      "SELECT content_data FROM site_content WHERE section_name = 'logo' LIMIT 1"
    );
    if (rows.length > 0) {
      const data = typeof rows[0].content_data === 'string'
        ? JSON.parse(rows[0].content_data)
        : rows[0].content_data;
      if (data?.logo_url) {
        const imgPath = path.join(__dirname, '..', data.logo_url);
        if (require('fs').existsSync(imgPath)) {
          return res.sendFile(imgPath);
        }
      }
    }
  } catch { /* fall through to static fallback */ }
  res.sendFile(path.join(__dirname, '../public', fallback));
};

app.get('/favicon.ico', (req, res) => serveDynamicLogo(req, res, 'favicon.ico'));
app.get('/logo-og.png',  (req, res) => serveDynamicLogo(req, res, 'logo-og.png'));

// Catch-all 404 routes
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Endpoint Not Found - ${req.originalUrl}`);
  next(error);
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
