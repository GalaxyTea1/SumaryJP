const pool = require('../db');

const DEFAULT_WEEKLY_GOAL_TARGET = 20;

function normalize(row) {
    return {
        userId: row.user_id,
        weeklyGoalTarget: Number(row.weekly_goal_target || DEFAULT_WEEKLY_GOAL_TARGET),
    };
}

const UserLearningSettings = {
    DEFAULT_WEEKLY_GOAL_TARGET,

    getByUserId: async (userId) => {
        const result = await pool.query(
            `INSERT INTO user_learning_settings (user_id)
             VALUES ($1)
             ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
             RETURNING *`,
            [userId]
        );
        return normalize(result.rows[0]);
    },

    updateWeeklyGoalTarget: async (userId, weeklyGoalTarget) => {
        const result = await pool.query(
            `INSERT INTO user_learning_settings (user_id, weekly_goal_target)
             VALUES ($1, $2)
             ON CONFLICT (user_id)
             DO UPDATE SET
                 weekly_goal_target = EXCLUDED.weekly_goal_target,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, weeklyGoalTarget]
        );
        return normalize(result.rows[0]);
    },
};

module.exports = UserLearningSettings;
