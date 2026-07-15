const express = require('express');
const kanaController = require('../controllers/kanaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/progress', authMiddleware, kanaController.getProgress);
router.put('/progress', authMiddleware, kanaController.updateProgress);

module.exports = router;
