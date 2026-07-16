const express = require('express');
const bookController = require('../controllers/bookController');

const router = express.Router();

// Public route to fetch all books
router.get('/', bookController.getBooks);

// Public route to view a book PDF inline
router.get('/:id/view', bookController.viewBook);

// Public route to download a book PDF
router.get('/:id/download', bookController.downloadBook);

module.exports = router;
