const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Logo Upload Storage ────────────────────────────────────────────────────
const logoUploadDir = path.join(__dirname, '../../uploads/logo');
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const logoFileFilter = (req, file, cb) => {
  const allowedExts = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedExts.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, WebP, and SVG files are allowed with valid mimetypes.'), false);
  }
};

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: logoFileFilter
});

// ─── General Image Upload Storage (thumbnails, about image, etc.) ───────────
const imagesUploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(imagesUploadDir)) {
  fs.mkdirSync(imagesUploadDir, { recursive: true });
}

const imagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedExts.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPG, JPEG, GIF, WebP, SVG) are allowed.'), false);
  }
};

const uploadImage = multer({
  storage: imagesStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: imageFileFilter
});

// ─── Public Routes ──────────────────────────────────────────────────────────
router.get('/', contentController.getAllContent);
router.get('/videos', contentController.getPublicVideos);
router.get('/announcements', contentController.getActiveAnnouncements);

// ─── Public: Content View/Download Tracking ─────────────────────────────────
router.post('/track', async (req, res) => {
  const { type, id, action } = req.body; // type: 'video'|'book'|'resource', action: 'view'|'download'
  if (!type || !id || !action) return res.status(200).json({ success: true }); // silently ignore bad requests
  try {
    const db = require('../config/db');
    let table = null;
    let column = action === 'download' ? 'downloads' : 'views';
    if (type === 'video') { table = 'videos'; column = 'views'; } // videos only have views
    else if (type === 'book') table = 'books';
    else if (type === 'resource') table = 'resources';
    if (table) {
      await db.query(`UPDATE ${table} SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = ?`, [id]);
    }
  } catch (e) { /* silently fail if column doesn't exist */ }
  res.status(200).json({ success: true });
});

router.put('/:section', protect, isAdmin, contentController.updateSectionContent);

// ─── Admin: Logo Upload ─────────────────────────────────────────────────────
router.post('/logo', protect, isAdmin, uploadLogo.single('logo'), contentController.uploadLogoContent);

// ─── Admin: General Image Upload (course thumbnails, about section, etc.) ──
router.post('/upload-image', protect, isAdmin, uploadImage.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image file (PNG, JPG, JPEG, GIF, WebP, SVG).');
    }
    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: imageUrl }
    });
  } catch (err) {
    next(err);
  }
});

// Custom IP Rate Limiter for Newsletter spam prevention
const ipRequests = new Map();
const rateLimitNewsletter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }

  const timestamps = ipRequests.get(ip).filter(t => now - t < windowMs);
  timestamps.push(now);
  ipRequests.set(ip, timestamps);

  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many subscription attempts. Please try again in a minute.'
    });
  }
  next();
};

// ─── Public: Newsletter Subscribe ──────────────────────────────────────────
router.post('/newsletter/subscribe', rateLimitNewsletter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400);
      throw new Error('A valid email address is required.');
    }

    const NewsletterModel = require('../models/NewsletterModel');
    const result = await NewsletterModel.subscribe(email.toLowerCase().trim());

    if (result.alreadySubscribed) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed.'
      });
    }

    const { broadcastToAdmins } = require('../socket');
    broadcastToAdmins('newsletter:update', { email });

    res.status(201).json({
      success: true,
      message: result.reactivated
        ? 'Welcome back! You have been re-subscribed to the newsletter.'
        : 'Thank you for subscribing to the Calculus Corner newsletter!'
    });
  } catch (err) {
    next(err);
  }
});

// ─── Public: Newsletter Unsubscribe Link ────────────────────────────────────
router.get('/newsletter/unsubscribe', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <h2 style="color: #ef4444;">Unsubscribe Link Invalid</h2>
          <p style="color: #4b5563; font-size: 14px;">The unsubscribe link is incomplete or missing its verification code.</p>
        </div>
      `);
    }

    const NewsletterModel = require('../models/NewsletterModel');
    const success = await NewsletterModel.unsubscribeByToken(token);

    if (success) {
      const { broadcastToAdmins } = require('../socket');
      broadcastToAdmins('newsletter:update', { token });

      return res.status(200).send(`
        <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <h2 style="color: #4f46e5;">Unsubscribed Successfully</h2>
          <p style="color: #4b5563; font-size: 14px;">You have been successfully removed from our subscriber lists. You will no longer receive any updates.</p>
          <a href={process.env.BACKEND_URL} style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Go to Calculus Corner</a>
        </div>
      `);
    } else {
      return res.status(400).send(`
        <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <h2 style="color: #ef4444;">Unsubscribe Failed</h2>
          <p style="color: #4b5563; font-size: 14px;">This subscription is already inactive or the token is invalid.</p>
        </div>
      `);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
