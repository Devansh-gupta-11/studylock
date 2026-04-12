const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    intent: { type: String, required: true },
    timeLimit: { type: Number, required: true }, // duration in minutes
    mode: { type: String, enum: ['Light', 'Deep'], default: 'Deep' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    focusScore: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('StudySession', StudySessionSchema);
