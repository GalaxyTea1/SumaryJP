const express = require('express');
const vocabController = require('../controllers/vocabController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

// Public routes — GET 
router.get('/', vocabController.getAll);
router.get('/:level/:lesson', vocabController.getByLevelAndLesson);
router.get('/:id', vocabController.getById);

// Admin routes 
router.post('/', authMiddleware, adminMiddleware, vocabController.create);
router.put('/:id', authMiddleware, adminMiddleware, vocabController.update);
router.delete('/:id', authMiddleware, adminMiddleware, vocabController.delete);

module.exports = router;
