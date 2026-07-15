const KanaProgress = require('../models/kanaProgress');

function validateProgressBody(body) {
    const { kana_type, kanaType, character, status } = body;
    const type = kana_type || kanaType;

    if (!KanaProgress.VALID_KANA_TYPES.includes(type)) {
        return 'kana_type khong hop le';
    }
    if (typeof character !== 'string' || character.trim().length === 0 || character.trim().length > 10) {
        return 'character khong hop le';
    }
    if (!KanaProgress.VALID_STATUSES.includes(status)) {
        return 'status khong hop le';
    }
    return null;
}

const kanaController = {
    getProgress: async (req, res) => {
        try {
            const progress = await KanaProgress.getByUserId(req.user.id);
            res.json(progress);
        } catch (error) {
            console.error('Kana getProgress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updateProgress: async (req, res) => {
        try {
            const validationError = validateProgressBody(req.body);
            if (validationError) return res.status(400).json({ error: validationError });

            const kanaType = req.body.kana_type || req.body.kanaType;
            const character = req.body.character.trim();
            const progress = await KanaProgress.upsert(req.user.id, kanaType, character, req.body.status);
            res.json(progress);
        } catch (error) {
            console.error('Kana updateProgress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = kanaController;
