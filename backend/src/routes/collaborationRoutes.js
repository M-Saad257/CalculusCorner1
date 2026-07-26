const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CollaborationModel = require('../models/CollaborationModel');
const emailService = require('../services/emailService');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { broadcastToAdmins, broadcastToAll } = require('../socket');

// Multer Storage Configuration for Business Logos
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'collab-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedExts.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, GIF, WebP, and SVG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter
});

// Public: Get visible, active collaborators list (for home display)
router.get('/', async (req, res, next) => {
  try {
    const collaborators = await CollaborationModel.getActive();
    res.status(200).json({
      success: true,
      data: collaborators
    });
  } catch (err) {
    next(err);
  }
});

// Public: Submit collaboration request with mandatory logo upload
router.post('/', upload.single('logo'), async (req, res, next) => {
  try {
    const { name, email, businessName, businessNiche, message } = req.body;

    if (!name || !email || !businessName || !businessNiche) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, business name, and business niche are required.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Business logo image is required.'
      });
    }

    const logoUrl = `/uploads/images/${req.file.filename}`;

    const submissionId = await CollaborationModel.create(name, email, businessName, businessNiche, message, logoUrl);
    
    // Trigger notification email (include logo url if present)
    emailService.sendCollabEmail({ name, email, businessName, businessNiche, message, logoUrl }).catch(err => {
      console.error('[CollabRoute] Email dispatch warning:', err.message);
    });

    // Notify admins via WebSocket
    try {
      broadcastToAdmins('collaboration:create', { id: submissionId, name, email, businessName, businessNiche, logoUrl });
    } catch (socketErr) {}

    res.status(201).json({
      success: true,
      message: 'Collaboration proposal submitted successfully!',
      data: { id: submissionId, logoUrl }
    });
  } catch (err) {
    next(err);
  }
});

// Admin-only: Get all collaboration submissions
router.get('/admin', protect, isAdmin, async (req, res, next) => {
  try {
    const submissions = await CollaborationModel.getAll();
    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (err) {
    next(err);
  }
});

// Admin-only: Update collaborator full details
router.put('/admin/:id', protect, isAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, businessName, businessNiche, message, description, tags, isVisible, sequence, isFeatured } = req.body;

    const logoUrl = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const fieldsToUpdate = {
      name,
      email,
      businessName,
      businessNiche,
      message,
      description,
      tags,
      isVisible: isVisible !== undefined ? (isVisible === 'true' || isVisible === '1' || isVisible === 1 || isVisible === true) : undefined,
      sequence: sequence !== undefined ? parseInt(sequence) : undefined,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === '1' || isFeatured === 1 || isFeatured === true) : undefined,
      logoUrl
    };

    const updated = await CollaborationModel.update(id, fieldsToUpdate);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or no changes made.'
      });
    }

    try {
      broadcastToAll('collaboration:update', { id });
    } catch (socketErr) {}

    res.status(200).json({
      success: true,
      message: 'Collaborator details updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// Admin-only: Delete collaboration submission
router.delete('/admin/:id', protect, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await CollaborationModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or already deleted.'
      });
    }

    try {
      broadcastToAll('collaboration:delete', { id });
    } catch (socketErr) {}

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
