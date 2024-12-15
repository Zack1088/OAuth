// models/activeToken.model.js

const mongoose = require('mongoose');

const activeTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    deviceInfo: {
        type: String,
        required: true
    },
    isValid: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60 
    }
});

module.exports = mongoose.model('ActiveToken', activeTokenSchema);