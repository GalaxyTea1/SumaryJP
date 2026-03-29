const Kanji = require('../models/kanji');

const MAX_STRING_LENGTH = 500;

function validateBody(body) {
    const { character, meaning, level } = body;
    if (!character || !meaning || !level) {
        return 'Thiếu trường bắt buộc: character, meaning, level';
    }
    if (character.length > 10 || meaning.length > MAX_STRING_LENGTH) {
        return `Nội dung không hợp lệ`;
    }
    return null;
}

const kanjiController = {
    getAll: async (req, res) => {
        try {
            const filters = {
                level: req.query.level || null,
                lesson: req.query.lesson || null,
            };
            const items = await Kanji.getAll(filters);
            res.json(items);
        } catch (error) {
            console.error('Kanji getAll error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const item = await Kanji.getById(req.params.id);
            if (!item) return res.status(404).json({ error: 'Kanji not found' });
            res.json(item);
        } catch (error) {
            console.error('Kanji getById error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        const validationError = validateBody(req.body);
        if (validationError) return res.status(400).json({ error: validationError });

        try {
            const item = await Kanji.create(req.body);
            res.status(201).json(item);
        } catch (error) {
            console.error('Kanji create error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    update: async (req, res) => {
        const validationError = validateBody(req.body);
        if (validationError) return res.status(400).json({ error: validationError });

        try {
            const existing = await Kanji.getById(req.params.id);
            if (!existing) return res.status(404).json({ error: 'Kanji not found' });

            const item = await Kanji.update(req.params.id, req.body);
            res.json(item);
        } catch (error) {
            console.error('Kanji update error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    delete: async (req, res) => {
        try {
            await Kanji.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            console.error('Kanji delete error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = kanjiController;
