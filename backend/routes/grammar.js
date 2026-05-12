const express = require('express');
const grammarController = require('../controllers/grammarController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

// Public routes
router.get('/', grammarController.getAll);
router.get('/:id', grammarController.getById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, grammarController.create);
router.put('/:id', authMiddleware, adminMiddleware, grammarController.update);
router.delete('/:id', authMiddleware, adminMiddleware, grammarController.delete);

module.exports = router;
