const TestResult = require('../models/testResult');

const VALID_TEST_TYPES = ['vocab', 'kanji', 'grammar'];
const VALID_MODES = ['practice', 'exam'];

function validateSubmitBody(body) {
    const { test_type, total_questions, correct_answers, score, time_taken, mode } = body;

    if (!test_type || total_questions === undefined || correct_answers === undefined || score === undefined) {
        return 'Thieu truong bat buoc: test_type, total_questions, correct_answers, score';
    }
    if (!VALID_TEST_TYPES.includes(test_type)) {
        return `test_type khong hop le. Gia tri hop le: ${VALID_TEST_TYPES.join(', ')}`;
    }
    if (!Number.isInteger(Number(total_questions)) || Number(total_questions) <= 0) {
        return 'total_questions phai la so nguyen duong';
    }
    if (!Number.isInteger(Number(correct_answers)) || Number(correct_answers) < 0) {
        return 'correct_answers phai la so nguyen khong am';
    }
    if (Number(correct_answers) > Number(total_questions)) {
        return 'correct_answers khong duoc lon hon total_questions';
    }
    if (!Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) {
        return 'score phai nam trong khoang 0-100';
    }
    if (time_taken !== undefined && time_taken !== null && (!Number.isInteger(Number(time_taken)) || Number(time_taken) < 0)) {
        return 'time_taken phai la so nguyen khong am';
    }
    if (mode && !VALID_MODES.includes(mode)) {
        return `mode khong hop le. Gia tri hop le: ${VALID_MODES.join(', ')}`;
    }
    return null;
}

const testController = {
    submit: async (req, res) => {
        try {
            const { test_type, level, lesson, total_questions, correct_answers, score, time_taken, mode, details } = req.body;

            const validationError = validateSubmitBody(req.body);
            if (validationError) return res.status(400).json({ error: validationError });

            const result = await TestResult.save({
                user_id: req.user.id,
                test_type,
                level,
                lesson,
                total_questions: Number(total_questions),
                correct_answers: Number(correct_answers),
                score: Number(score),
                time_taken: time_taken === undefined || time_taken === null ? null : Number(time_taken),
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
            const rawLimit = parseInt(req.query.limit, 10);
            const limit = Number.isNaN(rawLimit) ? 10 : Math.max(1, Math.min(rawLimit, 100));
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
