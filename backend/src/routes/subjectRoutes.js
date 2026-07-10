const express = require('express');
const SubjectModel = require('../models/SubjectModel');
const router = express.Router();

// GET all subjects
router.get('/', async (req, res, next) => {
  try {
    const subjects = await SubjectModel.getAll();
    res.status(200).json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
});

// GET single subject by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const subject = await SubjectModel.getBySlug(slug);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    res.status(200).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
