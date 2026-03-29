const Grammar = require('../models/grammar');

const MAX_STRING_LENGTH = 1000;

function validateBody(body) {
    const { pattern, meaning, level } = body;
    if (!pattern || !meaning || !level) {
        return 'Thiếu trường bắt buộc: pattern, meaning, level';
    }
    if (pattern.length > MAX_STRING_LENGTH || meaning.length > MAX_STRING_LENGTH) {
        return `Nội dung vượt quá ${MAX_STRING_LENGTH} ký tự`;
    }
    return null;
}

const grammarController = {
    getAll: async (req, res) => {
        try {
            const filters = {
                level: req.query.level || null,
                lesson: req.query.lesson || null,
                textbook: req.query.textbook || null,
            };
            const items = await Grammar.getAll(filters);
            res.json(items);
        } catch (error) {
            console.error('Grammar getAll error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const item = await Grammar.getById(req.params.id);
            if (!item) return res.status(404).json({ error: 'Grammar not found' });
            res.json(item);
        } catch (error) {
            console.error('Grammar getById error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        const validationError = validateBody(req.body);
        if (validationError) return res.status(400).json({ error: validationError });

        try {
            const item = await Grammar.create(req.body);
            res.status(201).json(item);
        } catch (error) {
            console.error('Grammar create error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    update: async (req, res) => {
        const validationError = validateBody(req.body);
        if (validationError) return res.status(400).json({ error: validationError });

        try {
            const existing = await Grammar.getById(req.params.id);
            if (!existing) return res.status(404).json({ error: 'Grammar not found' });

            const item = await Grammar.update(req.params.id, req.body);
            res.json(item);
        } catch (error) {
            console.error('Grammar update error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    delete: async (req, res) => {
        try {
            await Grammar.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            console.error('Grammar delete error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = grammarController;
