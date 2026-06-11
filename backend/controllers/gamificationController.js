const Gamification = require('../models/gamification');

const VALID_EVENT_TYPES = new Set([
    'first_login',
    'daily_login',
    'test_complete',
    'flashcard_flip',
    'flashcard_complete',
    'srs_session',
    'srs_card_good',
    'vocab_review',
    'kanji_review',
]);

const gamificationController = {
    getMe: async (req, res) => {
        try {
            const data = await Gamification.getByUserId(req.user.id);
            res.json(data);
        } catch (error) {
            console.error('Gamification getMe error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    trackEvent: async (req, res) => {
        try {
            const { event_type, eventType, extra } = req.body;
            const type = event_type || eventType;

            if (!VALID_EVENT_TYPES.has(type)) {
                return res.status(400).json({ error: 'event_type khong hop le' });
            }

            const data = await Gamification.trackEvent(req.user.id, type, extra || {});
            res.json(data);
        } catch (error) {
            console.error('Gamification trackEvent error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = gamificationController;
