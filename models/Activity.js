const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    stravaId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stravaUserId: {
        type: String,
        required: true
    },
    name: String,
    distance: {
        type: Number,
        required: true // in meters
    },
    movingTime: Number, // in seconds
    elapsedTime: Number,
    totalElevationGain: Number,
    type: {
        type: String,
        default: 'Run'
    },
    startDate: {
        type: Date,
        required: true
    },
    startDateLocal: Date,
    timezone: String,
    averageSpeed: Number,
    maxSpeed: Number,
    averageHeartrate: Number,
    maxHeartrate: Number,
    hasHeartrate: Boolean,
    map: {
        summaryPolyline: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
activitySchema.index({ stravaId: 1 });
activitySchema.index({ userId: 1 });
activitySchema.index({ stravaUserId: 1 });
activitySchema.index({ startDate: -1 });
activitySchema.index({ type: 1 });

// Compound index for leaderboard queries
activitySchema.index({ userId: 1, startDate: -1 });
activitySchema.index({ type: 1, startDate: -1 });

module.exports = mongoose.model('Activity', activitySchema);
