const express = require('express');
const historyController = require('../controllers/historyController');
const router = express.Router();

router.get('/weekly-goal', historyController.getWeeklyGoal);
router.get('/', historyController.getRecentHistory);

module.exports = router;
