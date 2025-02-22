const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all vocabulary
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vocabulary');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get vocabulary by lesson and level
router.get('/:level/:lesson', async (req, res) => {
    const { level, lesson } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM vocabulary WHERE level = $1 AND lesson = $2',
            [level, lesson]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add vocabulary
router.post('/', async (req, res) => {
    const { lesson, level, japanese, hiragana, meaning, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vocabulary (lesson, level, japanese, hiragana, meaning, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [lesson, level, japanese, hiragana, meaning, type]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update vocabulary
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, last_reviewed, review_count, is_difficult, japanese, hiragana, meaning, type } = req.body;
    try {
        const result = await pool.query(
            'UPDATE vocabulary SET status = $1, last_reviewed = $2, review_count = $3, is_difficult = $4, japanese = $5, hiragana = $6, meaning = $7, type = $8 WHERE id = $9 RETURNING *',
            [status, last_reviewed, review_count, is_difficult, japanese, hiragana, meaning, type, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete vocabulary
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM vocabulary WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;