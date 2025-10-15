const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { syncUserActivities } = require('../services/stravaService');

const router = express.Router();

/**
 * Get leaderboard by time period
 */
router.get('/leaderboard/:period', async (req, res) => {
    const { period } = req.params; // 'day', 'week', 'month'
    
    try {
        let startDate;
        const now = new Date();
        
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                return res.status(400).json({ error: 'Invalid period. Use: day, week, or month' });
        }

        // Aggregate activities by user
        const leaderboard = await Activity.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate },
                    type: { $in: ['Run', 'VirtualRun'] }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalDistance: { $sum: '$distance' },
                    totalTime: { $sum: '$movingTime' },
                    activityCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    username: '$user.username',
                    firstname: '$user.firstname',
                    lastname: '$user.lastname',
                    profile: '$user.profile',
                    profileMedium: '$user.profileMedium',
                    totalDistance: 1,
                    totalKm: { $divide: ['$totalDistance', 1000] },
                    totalTime: 1,
                    activityCount: 1,
                    averageSpeed: { $divide: ['$totalDistance', '$totalTime'] }
                }
            },
            {
                $sort: { totalDistance: -1 }
            },
            {
                $limit: 100
            }
        ]);

        // Add rank
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        res.json({
            period,
            startDate,
            leaderboard: rankedLeaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

/**
 * Get user statistics
 */
router.get('/stats/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const now = new Date();
        
        // Today
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayStats = await Activity.aggregate([
            {
                $match: {
                    userId: user._id,
                    startDate: { $gte: todayStart },
                    type: { $in: ['Run', 'VirtualRun'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDistance: { $sum: '$distance' },
                    totalTime: { $sum: '$movingTime' },
                    activityCount: { $sum: 1 }
                }
            }
        ]);

        // This week
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekStats = await Activity.aggregate([
            {
                $match: {
                    userId: user._id,
                    startDate: { $gte: weekStart },
                    type: { $in: ['Run', 'VirtualRun'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDistance: { $sum: '$distance' },
                    totalTime: { $sum: '$movingTime' },
                    activityCount: { $sum: 1 }
                }
            }
        ]);

        // This month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStats = await Activity.aggregate([
            {
                $match: {
                    userId: user._id,
                    startDate: { $gte: monthStart },
                    type: { $in: ['Run', 'VirtualRun'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDistance: { $sum: '$distance' },
                    totalTime: { $sum: '$movingTime' },
                    activityCount: { $sum: 1 }
                }
            }
        ]);

        res.json({
            user: {
                id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                profile: user.profile,
                lastSyncedAt: user.lastSyncedAt
            },
            today: todayStats[0] || { totalDistance: 0, totalTime: 0, activityCount: 0 },
            week: weekStats[0] || { totalDistance: 0, totalTime: 0, activityCount: 0 },
            month: monthStats[0] || { totalDistance: 0, totalTime: 0, activityCount: 0 }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * Sync user activities manually
 */
router.post('/sync', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const result = await syncUserActivities(req.session.userId);
        res.json({
            success: true,
            message: 'Activities synced successfully',
            ...result
        });
    } catch (error) {
        console.error('Error syncing activities:', error);
        res.status(500).json({ error: 'Failed to sync activities' });
    }
});

/**
 * Get recent activities
 */
router.get('/activities/recent', async (req, res) => {
    const { limit = 10 } = req.query;

    try {
        const activities = await Activity.find()
            .populate('userId', 'username firstname lastname profile')
            .sort({ startDate: -1 })
            .limit(parseInt(limit));

        res.json({ activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

module.exports = router;
