const express = require('express');
const cors = require('cors');
const vocabRoutes = require('./routes/vocab');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/vocab', vocabRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});