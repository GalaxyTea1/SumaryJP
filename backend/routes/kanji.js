const express = require('express');
const kanjiController = require('../controllers/kanjiController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Public routes
router.get('/', kanjiController.getAll);
router.get('/:id', kanjiController.getById);

// Protected routes
router.post('/', authMiddleware, kanjiController.create);
router.put('/:id', authMiddleware, kanjiController.update);
router.delete('/:id', authMiddleware, kanjiController.delete);

module.exports = router;
