const History = require('../models/history');

const historyController = {
    getWeeklyGoal: async (req, res) => {
        try {
            const goalCount = await History.getWeeklyGoal();
            res.json({ goalCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error calculating weekly goal' });
        }
    },

    getRecentHistory: async (req, res) => {
        const rawLimit = parseInt(req.query.limit, 10);
        const limit = Number.isNaN(rawLimit) ? 20 : Math.max(1, Math.min(rawLimit, 100));
        try {
            const history = await History.getRecentHistory(limit);
            res.json(history);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error fetching history' });
        }
    }
};

module.exports = historyController;
