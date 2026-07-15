const express = require('express');
const bookController = require('../controllers/bookController');

const router = express.Router();

// Public route to fetch all books
router.get('/', bookController.getBooks);

module.exports = router;
