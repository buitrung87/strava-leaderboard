const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { getAthleteProfile, syncUserActivities } = require('../services/stravaService');

const router = express.Router();

/**
 * Redirect to Strava OAuth page
 */
router.get('/strava', (req, res) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    const scope = 'read,activity:read_all,profile:read_all';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
    
    res.redirect(authUrl);
});

/**
 * Handle OAuth callback from Strava
 */
router.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect('/?error=' + error);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code'
        });

        const {
            access_token,
            refresh_token,
            expires_at,
            athlete
        } = tokenResponse.data;

        // Find or create user
        let user = await User.findOne({ stravaId: athlete.id.toString() });

        if (user) {
            // Update existing user
            user.accessToken = access_token;
            user.refreshToken = refresh_token;
            user.expiresAt = expires_at;
            user.username = athlete.username;
            user.firstname = athlete.firstname;
            user.lastname = athlete.lastname;
            user.profile = athlete.profile;
            user.profileMedium = athlete.profile_medium;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                stravaId: athlete.id.toString(),
                username: athlete.username,
                firstname: athlete.firstname,
                lastname: athlete.lastname,
                profile: athlete.profile,
                profileMedium: athlete.profile_medium,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: expires_at
            });
        }

        // Save user ID in session
        req.session.userId = user._id.toString();

        // Sync activities in background
        syncUserActivities(user._id).catch(err => {
            console.error('Error syncing activities:', err);
        });

        res.redirect('/?auth=success');
    } catch (error) {
        console.error('OAuth error:', error.response?.data || error.message);
        res.redirect('/?error=auth_failed');
    }
});

/**
 * Logout
 */
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/**
 * Get current user
 */
router.get('/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ user: null });
    }

    try {
        const user = await User.findById(req.session.userId).select('-accessToken -refreshToken');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
