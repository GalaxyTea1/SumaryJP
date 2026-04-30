const express = require('express');
const cors = require('cors');
require('dotenv').config();
const vocabRoutes = require('./routes/vocab');
const historyRoutes = require('./routes/history');
const authRoutes = require('./routes/auth');
const grammarRoutes = require('./routes/grammar');
const kanjiRoutes = require('./routes/kanji');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://sumary-jp.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS: Origin not allowed'), false);
    },
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/vocab', vocabRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/kanji', kanjiRoutes);
app.use('/api/test', testRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message, // Send message to help debugging (can be removed in production)
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});