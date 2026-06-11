const History = require('../models/history');
const UserLearningSettings = require('../models/userLearningSettings');

const historyController = {
    getWeeklyGoal: async (req, res) => {
        try {
            const goalCount = await History.getWeeklyGoal(req.user?.id || null);
            const settings = req.user?.id
                ? await UserLearningSettings.getByUserId(req.user.id)
                : { weeklyGoalTarget: UserLearningSettings.DEFAULT_WEEKLY_GOAL_TARGET };
            res.json({ goalCount, goalTarget: settings.weeklyGoalTarget });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error calculating weekly goal' });
        }
    },

    updateWeeklyGoal: async (req, res) => {
        const rawTarget = req.body.goalTarget ?? req.body.weeklyGoalTarget;
        const goalTarget = Number(rawTarget);

        if (!Number.isInteger(goalTarget) || goalTarget < 1 || goalTarget > 500) {
            return res.status(400).json({ error: 'goalTarget phai la so nguyen trong khoang 1-500' });
        }

        try {
            const settings = await UserLearningSettings.updateWeeklyGoalTarget(req.user.id, goalTarget);
            const goalCount = await History.getWeeklyGoal(req.user.id);
            res.json({ goalCount, goalTarget: settings.weeklyGoalTarget });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error updating weekly goal' });
        }
    },

    getRecentHistory: async (req, res) => {
        const rawLimit = parseInt(req.query.limit, 10);
        const limit = Number.isNaN(rawLimit) ? 20 : Math.max(1, Math.min(rawLimit, 100));
        try {
            const history = await History.getRecentHistory(limit, req.user?.id || null);
            res.json(history);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error fetching history' });
        }
    }
};

module.exports = historyController;
