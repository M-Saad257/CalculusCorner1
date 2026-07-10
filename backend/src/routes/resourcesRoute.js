const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

router.get('/', adminController.getResources);
router.get('/:id/view', adminController.viewResource);

module.exports = router;