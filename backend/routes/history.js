const express = require('express');
const historyController = require('../controllers/historyController');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/weekly-goal', optionalAuthMiddleware, historyController.getWeeklyGoal);
router.put('/weekly-goal', authMiddleware, historyController.updateWeeklyGoal);
router.get('/', optionalAuthMiddleware, historyController.getRecentHistory);

module.exports = router;
