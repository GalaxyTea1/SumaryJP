const express = require('express');
const gamificationController = require('../controllers/gamificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, gamificationController.getMe);
router.post('/events', authMiddleware, gamificationController.trackEvent);

module.exports = router;
