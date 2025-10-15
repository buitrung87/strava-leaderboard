const axios = require('axios');
const User = require('../models/User');
const Activity = require('../models/Activity');

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

/**
 * Refresh access token if expired
 */
async function refreshAccessToken(user) {
    const now = Math.floor(Date.now() / 1000);
    
    if (user.expiresAt > now) {
        return user.accessToken;
    }

    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: user.refreshToken
        });

        user.accessToken = response.data.access_token;
        user.refreshToken = response.data.refresh_token;
        user.expiresAt = response.data.expires_at;
        await user.save();

        return user.accessToken;
    } catch (error) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        throw new Error('Failed to refresh access token');
    }
}

/**
 * Get athlete activities from Strava
 */
async function getAthleteActivities(user, page = 1, perPage = 30) {
    const accessToken = await refreshAccessToken(user);

    try {
        const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                page,
                per_page: perPage
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching activities:', error.response?.data || error.message);
        throw new Error('Failed to fetch activities from Strava');
    }
}

/**
 * Sync user activities from Strava to database
 */
async function syncUserActivities(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    console.log(`🔄 Syncing activities for user: ${user.username}`);

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;
    let newActivities = 0;

    while (hasMore) {
        const activities = await getAthleteActivities(user, page, 50);
        
        if (activities.length === 0) {
            hasMore = false;
            break;
        }

        for (const activity of activities) {
            // Only sync Run and VirtualRun activities
            if (activity.type !== 'Run' && activity.type !== 'VirtualRun') {
                continue;
            }

            try {
                const existingActivity = await Activity.findOne({ stravaId: activity.id.toString() });
                
                if (!existingActivity) {
                    await Activity.create({
                        stravaId: activity.id.toString(),
                        userId: user._id,
                        stravaUserId: user.stravaId,
                        name: activity.name,
                        distance: activity.distance,
                        movingTime: activity.moving_time,
                        elapsedTime: activity.elapsed_time,
                        totalElevationGain: activity.total_elevation_gain,
                        type: activity.type,
                        startDate: new Date(activity.start_date),
                        startDateLocal: new Date(activity.start_date_local),
                        timezone: activity.timezone,
                        averageSpeed: activity.average_speed,
                        maxSpeed: activity.max_speed,
                        averageHeartrate: activity.average_heartrate,
                        maxHeartrate: activity.max_heartrate,
                        hasHeartrate: activity.has_heartrate,
                        map: activity.map
                    });
                    newActivities++;
                } else {
                    // Update existing activity
                    await Activity.updateOne(
                        { stravaId: activity.id.toString() },
                        {
                            distance: activity.distance,
                            movingTime: activity.moving_time,
                            elapsedTime: activity.elapsed_time,
                            totalElevationGain: activity.total_elevation_gain,
                            averageSpeed: activity.average_speed,
                            maxSpeed: activity.max_speed
                        }
                    );
                }
                totalSynced++;
            } catch (error) {
                console.error(`Error saving activity ${activity.id}:`, error.message);
            }
        }

        page++;
        
        // Limit to last 200 activities to avoid too many API calls
        if (page > 4) {
            hasMore = false;
        }
    }

    user.lastSyncedAt = new Date();
    await user.save();

    console.log(`✅ Synced ${totalSynced} activities (${newActivities} new) for ${user.username}`);
    
    return { totalSynced, newActivities };
}

/**
 * Sync all users' activities
 */
async function syncAllUserActivities() {
    const users = await User.find();
    console.log(`🔄 Syncing activities for ${users.length} users`);

    for (const user of users) {
        try {
            await syncUserActivities(user._id);
        } catch (error) {
            console.error(`Error syncing user ${user.username}:`, error.message);
        }
    }
}

/**
 * Get athlete profile from Strava
 */
async function getAthleteProfile(accessToken) {
    try {
        const response = await axios.get(`${STRAVA_API_BASE}/athlete`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching athlete profile:', error.response?.data || error.message);
        throw new Error('Failed to fetch athlete profile');
    }
}

module.exports = {
    refreshAccessToken,
    getAthleteActivities,
    syncUserActivities,
    syncAllUserActivities,
    getAthleteProfile
};
