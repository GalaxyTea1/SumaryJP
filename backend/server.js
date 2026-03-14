const express = require('express');
const cors = require('cors');
const vocabRoutes = require('./routes/vocab');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/vocab', vocabRoutes);
app.use('/api/history', historyRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});