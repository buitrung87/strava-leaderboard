const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    stravaId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    firstname: String,
    lastname: String,
    profile: String,
    profileMedium: String,
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Number,
        required: true
    },
    lastSyncedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ stravaId: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);
