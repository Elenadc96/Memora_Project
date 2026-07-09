const express = require('express');
const router = express.Router();
const controller = require('../controllers/badgeControllers');

router.get('/me', controller.getMine);

module.exports = router;