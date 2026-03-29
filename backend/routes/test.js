const express = require('express');
const testController = require('../controllers/testController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Tất cả đều cần auth
router.post('/submit', authMiddleware, testController.submit);
router.get('/history', authMiddleware, testController.getHistory);
router.get('/:id', authMiddleware, testController.getById);

module.exports = router;
