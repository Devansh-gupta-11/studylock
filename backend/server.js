const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(cors());
app.use(express.json());

// Force cache clearing and log everything
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // We intentionally don't set Clear-Site-Data so we don't accidentally log them out continuously, but this busts standard cache.
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check endpoint just to test cloud deployment!
app.get('/api/ping', (req, res) => {
    res.json({ message: 'StudyLock is ALIVE in the cloud! 🚀', timestamp: new Date() });
});

const https = require('https');

app.get('/api/search-video', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    https.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, (ytRes) => {
        let data = '';
        ytRes.on('data', chunk => data += chunk);
        ytRes.on('end', () => {
            const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
                res.json({ videoId: match[1] });
            } else {
                res.status(404).json({ error: 'No video found' });
            }
        });
    }).on('error', (err) => {
        res.status(500).json({ error: err.message });
    });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve the React app
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
});

async function startServer() {
    try {
        let mongoUri = process.env.MONGODB_URI;
        
        try {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
            console.log('MongoDB successfully connected');
        } catch (err) {
            console.log('Local MongoDB not found. Starting In-Memory MongoDB Server...');
            const mongoServer = await MongoMemoryServer.create();
            mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
            console.log('In-Memory MongoDB successfully connected');
        }

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`StudyLock Backend running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start backend server:', err);
    }
}

startServer();
