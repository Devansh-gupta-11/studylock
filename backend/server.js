const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

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
