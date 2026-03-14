const Vocabulary = require('../models/vocabulary');
const History = require('../models/history');

// Validation helpers
const VALID_STATUSES = ['not-learned', 'learning', 'mastered'];
const MAX_STRING_LENGTH = 500;

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

function validateUpdateBody(body) {
    if (body.status && !VALID_STATUSES.includes(body.status)) {
        return `Invalid status. Accepted values: ${VALID_STATUSES.join(', ')}`;
    }
    if (body.japanese && body.japanese.length > MAX_STRING_LENGTH) {
        return `Content exceeds ${MAX_STRING_LENGTH} characters`;
    }
    return null;
}

const vocabController = {
    getAll: async (req, res) => {
        try {
            const vocabularies = await Vocabulary.getAll();
            res.json(vocabularies);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const vocab = await Vocabulary.getById(id);
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
            const vocabularies = await Vocabulary.getByLevelAndLesson(level, lesson);
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

        const validationError = validateUpdateBody(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        try {
            const oldVocab = await Vocabulary.getById(id);
            if (!oldVocab) {
                return res.status(404).json({ error: 'Vocabulary not found' });
            }

            const updatedVocab = await Vocabulary.update(id, req.body);
            
            // Log status change to learning_history
            if (req.body.status && oldVocab.status !== req.body.status) {
                await History.logAction(id, 'status_changed', oldVocab.status, req.body.status);
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
