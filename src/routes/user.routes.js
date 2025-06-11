const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// User profile routes
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await req.user;
        res.json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                points: user.points,
                followersCount: user.followers.length,
                followingCount: user.following.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const updates = {};
        ['username', 'email'].forEach(field => {
            if (req.body[field]) updates[field] = req.body[field];
        });

        const user = await req.user;
        Object.assign(user, updates);
        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 