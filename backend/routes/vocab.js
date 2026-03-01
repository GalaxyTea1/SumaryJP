const express = require('express');
const vocabController = require('../controllers/vocabController');
const router = express.Router();

// Get all vocabulary
router.get('/', vocabController.getAll);

// Get vocabulary by id
router.get('/:id', vocabController.getById);

// Get vocabulary by lesson and level
router.get('/:level/:lesson', vocabController.getByLevelAndLesson);

// Add vocabulary
router.post('/', vocabController.create);

// Update vocabulary
router.put('/:id', vocabController.update);

// Delete vocabulary
router.delete('/:id', vocabController.delete);

module.exports = router;