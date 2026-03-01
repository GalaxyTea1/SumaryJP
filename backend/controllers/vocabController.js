const Vocabulary = require('../models/vocabulary');

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
            const updatedVocab = await Vocabulary.update(id, req.body);
            if (!updatedVocab) {
                return res.status(404).json({ error: 'Vocabulary not found' });
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
