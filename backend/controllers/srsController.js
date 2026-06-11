const SrsProgress = require('../models/srsProgress');
const Vocabulary = require('../models/vocabulary');
const Kanji = require('../models/kanji');
const Grammar = require('../models/grammar');

function validateReviewBody(body) {
    const { item_type, itemType, item_id, itemId, quality } = body;
    const type = item_type || itemType;
    const id = item_id ?? itemId;

    if (!SrsProgress.VALID_ITEM_TYPES.includes(type)) {
        return 'item_type khong hop le';
    }
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return 'item_id phai la so nguyen duong';
    }
    if (!Number.isInteger(Number(quality)) || Number(quality) < 1 || Number(quality) > 4) {
        return 'quality phai nam trong khoang 1-4';
    }
    return null;
}

async function findItem(itemType, itemId, userId) {
    if (itemType === 'vocab') return Vocabulary.getById(itemId, userId);
    if (itemType === 'kanji') return Kanji.getById(itemId);
    if (itemType === 'grammar') return Grammar.getById(itemId);
    return null;
}

const srsController = {
    getProgress: async (req, res) => {
        try {
            const progress = await SrsProgress.getByUserId(req.user.id);
            res.json(progress);
        } catch (error) {
            console.error('SRS getProgress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    review: async (req, res) => {
        try {
            const validationError = validateReviewBody(req.body);
            if (validationError) return res.status(400).json({ error: validationError });

            const itemType = req.body.item_type || req.body.itemType;
            const itemId = Number(req.body.item_id ?? req.body.itemId);
            const quality = Number(req.body.quality);
            const item = await findItem(itemType, itemId, req.user.id);
            if (!item) return res.status(404).json({ error: 'SRS item not found' });

            const progress = await SrsProgress.review(req.user.id, itemType, itemId, quality);
            res.json(progress);
        } catch (error) {
            console.error('SRS review error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = srsController;
