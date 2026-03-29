const express = require('express');
const vocabController = require('../controllers/vocabController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Public routes — GET (ai cũng xem được từ vựng)
router.get('/', vocabController.getAll);
router.get('/:level/:lesson', vocabController.getByLevelAndLesson);
router.get('/:id', vocabController.getById);

// Protected routes — cần đăng nhập để thêm/sửa/xóa
router.post('/', authMiddleware, vocabController.create);
router.put('/:id', authMiddleware, vocabController.update);
router.delete('/:id', authMiddleware, vocabController.delete);

module.exports = router;