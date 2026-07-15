const express = require('express');
const srsController = require('../controllers/srsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/progress', authMiddleware, srsController.getProgress);
router.post('/review', authMiddleware, srsController.review);

module.exports = router;
