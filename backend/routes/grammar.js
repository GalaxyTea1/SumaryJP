const express = require('express');
const grammarController = require('../controllers/grammarController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Public routes
router.get('/', grammarController.getAll);
router.get('/:id', grammarController.getById);

// Protected routes
router.post('/', authMiddleware, grammarController.create);
router.put('/:id', authMiddleware, grammarController.update);
router.delete('/:id', authMiddleware, grammarController.delete);

module.exports = router;
