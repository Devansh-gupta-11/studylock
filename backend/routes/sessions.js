const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const StudySession = require('../models/StudySession');

const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.userId = decoded.userId;
        
        // Backend Fix: Robust Recovery against In-Memory DB wipes
        const userExists = await User.findById(req.userId);
        if (!userExists) {
            const dummyUser = new User({ 
                _id: req.userId, 
                name: 'Session Recovered', 
                email: req.userId + '@recovered.com', 
                password: 'recovered' 
            });
            await dummyUser.save();
        }
        
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized token' });
    }
};

router.post('/start', verifyToken, async (req, res) => {
    try {
        const { intent, timeLimit, mode } = req.body;
        const session = new StudySession({
            user: req.userId,
            intent,
            timeLimit,
            mode: mode || 'Deep',
            startTime: new Date(),
            completed: false,
            focusScore: 0
        });
        await session.save();
        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/end/:id', verifyToken, async (req, res) => {
    try {
        const { focusScore } = req.body;
        const session = await StudySession.findById(req.params.id);
        
        if (!session) return res.status(404).json({ error: 'Session not found' });
        
        if (session.user.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to end this session' });
        }

        session.endTime = new Date();
        session.completed = true;
        session.focusScore = focusScore || 0;
        
        await session.save();

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const userSessions = await StudySession.find({ user: req.userId })
            .sort({ startTime: -1 });
            
        res.json(userSessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
