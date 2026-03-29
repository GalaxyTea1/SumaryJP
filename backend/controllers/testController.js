const TestResult = require('../models/testResult');

const testController = {
    submit: async (req, res) => {
        try {
            const { test_type, level, lesson, total_questions, correct_answers, score, time_taken, mode, details } = req.body;

            if (!test_type || !total_questions || correct_answers === undefined || score === undefined) {
                return res.status(400).json({ error: 'Thiếu trường bắt buộc: test_type, total_questions, correct_answers, score' });
            }

            const result = await TestResult.save({
                user_id: req.user.id,
                test_type,
                level,
                lesson,
                total_questions,
                correct_answers,
                score,
                time_taken,
                mode,
                details
            });

            res.status(201).json(result);
        } catch (error) {
            console.error('Test submit error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getHistory: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const results = await TestResult.getByUserId(req.user.id, limit);
            res.json(results);
        } catch (error) {
            console.error('Test history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const result = await TestResult.getById(req.params.id);
            if (!result) return res.status(404).json({ error: 'Test result not found' });
            // Chỉ cho xem kết quả của chính mình
            if (result.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            res.json(result);
        } catch (error) {
            console.error('Test getById error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = testController;
