const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes (Guest)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (Requires JWT)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
