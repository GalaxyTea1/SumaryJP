const express = require('express');
const vocabController = require('../controllers/vocabController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const router = express.Router();

router.get('/', optionalAuthMiddleware, vocabController.getAll);
router.get('/:level/:lesson', optionalAuthMiddleware, vocabController.getByLevelAndLesson);
router.get('/:id', optionalAuthMiddleware, vocabController.getById);

router.post('/', authMiddleware, adminMiddleware, vocabController.create);
router.put('/:id', authMiddleware, vocabController.update);
router.delete('/:id', authMiddleware, adminMiddleware, vocabController.delete);

module.exports = router;
