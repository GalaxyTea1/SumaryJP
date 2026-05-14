const Vocabulary = require('../models/vocabulary');
const History = require('../models/history');
const User = require('../models/userModel');

const VALID_STATUSES = ['not-learned', 'learning', 'mastered'];
const MAX_STRING_LENGTH = 500;
const BASE_FIELDS = ['lesson', 'level', 'japanese', 'hiragana', 'meaning', 'type'];
const PROGRESS_FIELDS = ['status', 'last_reviewed', 'review_count', 'interval', 'ease_factor', 'next_review', 'is_difficult'];

function hasAnyField(body, fields) {
    return fields.some(field => Object.prototype.hasOwnProperty.call(body, field));
}

function validateCreateBody(body) {
    const { lesson, level, japanese, hiragana, meaning } = body;
    if (!japanese || !hiragana || !meaning) {
        return 'Missing required fields: japanese, hiragana, meaning';
    }
    if (!lesson || !level) {
        return 'Missing required fields: lesson, level';
    }
    if (japanese.length > MAX_STRING_LENGTH || hiragana.length > MAX_STRING_LENGTH || meaning.length > MAX_STRING_LENGTH) {
        return `Content exceeds ${MAX_STRING_LENGTH} characters`;
    }
    return null;
}

function validateBaseUpdateBody(body) {
    const { lesson, level, japanese, hiragana, meaning } = body;
    if (!japanese || !hiragana || !meaning || !lesson || !level) {
        return 'Missing required fields: lesson, level, japanese, hiragana, meaning';
    }
    if (japanese.length > MAX_STRING_LENGTH || hiragana.length > MAX_STRING_LENGTH || meaning.length > MAX_STRING_LENGTH) {
        return `Content exceeds ${MAX_STRING_LENGTH} characters`;
    }
    return null;
}

function validateUpdateBody(body) {
    if (body.status && !VALID_STATUSES.includes(body.status)) {
        return `Invalid status. Accepted values: ${VALID_STATUSES.join(', ')}`;
    }
    if (body.japanese && body.japanese.length > MAX_STRING_LENGTH) {
        return `Content exceeds ${MAX_STRING_LENGTH} characters`;
    }
    if (body.review_count !== undefined && (!Number.isInteger(Number(body.review_count)) || Number(body.review_count) < 0)) {
        return 'Invalid review_count. It must be a non-negative integer';
    }
    if (body.interval !== undefined && (!Number.isInteger(Number(body.interval)) || Number(body.interval) < 0)) {
        return 'Invalid interval. It must be a non-negative integer';
    }
    if (body.ease_factor !== undefined && (!Number.isFinite(Number(body.ease_factor)) || Number(body.ease_factor) < 1.3)) {
        return 'Invalid ease_factor. It must be at least 1.3';
    }
    if (body.next_review !== undefined && Number.isNaN(Date.parse(body.next_review))) {
        return 'Invalid next_review. It must be a valid date';
    }
    if (body.last_reviewed !== undefined && body.last_reviewed !== null && Number.isNaN(Date.parse(body.last_reviewed))) {
        return 'Invalid last_reviewed. It must be a valid date';
    }
    return null;
}

const vocabController = {
    getAll: async (req, res) => {
        try {
            const vocabularies = await Vocabulary.getAll(req.user?.id || null);
            res.json(vocabularies);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const vocab = await Vocabulary.getById(id, req.user?.id || null);
            if (!vocab) {
                return res.status(404).json({ error: 'Vocabulary not found' });
            }
            res.json(vocab);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getByLevelAndLesson: async (req, res) => {
        const { level, lesson } = req.params;
        try {
            const vocabularies = await Vocabulary.getByLevelAndLesson(level, lesson, req.user?.id || null);
            res.json(vocabularies);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        const validationError = validateCreateBody(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        try {
            const newVocab = await Vocabulary.create(req.body);
            res.status(201).json(newVocab);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;

        try {
            const oldVocab = await Vocabulary.getById(id, req.user.id);
            if (!oldVocab) {
                return res.status(404).json({ error: 'Vocabulary not found' });
            }

            if (hasAnyField(req.body, BASE_FIELDS)) {
                const user = await User.findById(req.user.id);
                if (!user || user.role !== 'admin') {
                    return res.status(403).json({ error: 'Only admins can edit vocabulary content' });
                }

                const validationError = validateBaseUpdateBody({ ...oldVocab, ...req.body });
                if (validationError) return res.status(400).json({ error: validationError });

                const updatedVocab = await Vocabulary.updateBase(id, { ...oldVocab, ...req.body });
                return res.json(updatedVocab);
            }

            if (!hasAnyField(req.body, PROGRESS_FIELDS)) {
                return res.status(400).json({ error: 'No supported vocabulary progress fields provided' });
            }

            const validationError = validateUpdateBody(req.body);
            if (validationError) return res.status(400).json({ error: validationError });

            const updatedVocab = await Vocabulary.upsertProgress(req.user.id, id, { ...oldVocab, ...req.body });

            if (req.body.status && oldVocab.status !== req.body.status) {
                await History.logAction(id, 'status_changed', oldVocab.status, req.body.status, req.user.id);
            }
            res.json(updatedVocab);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        try {
            await Vocabulary.delete(id);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = vocabController;
