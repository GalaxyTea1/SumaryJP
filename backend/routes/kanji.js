const express = require('express');
const kanjiController = require('../controllers/kanjiController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

// Public routes
router.get('/', kanjiController.getAll);
router.get('/:id', kanjiController.getById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, kanjiController.create);
router.put('/:id', authMiddleware, adminMiddleware, kanjiController.update);
router.delete('/:id', authMiddleware, adminMiddleware, kanjiController.delete);

module.exports = router;
