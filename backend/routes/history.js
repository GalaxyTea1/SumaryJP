const express = require('express');
const historyController = require('../controllers/historyController');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const router = express.Router();

router.get('/weekly-goal', optionalAuthMiddleware, historyController.getWeeklyGoal);
router.get('/', optionalAuthMiddleware, historyController.getRecentHistory);

module.exports = router;
