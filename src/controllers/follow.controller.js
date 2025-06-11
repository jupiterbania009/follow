const User = require('../models/user.model');
const Follow = require('../models/follow.model');

// Follow a user
exports.followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        // Prevent self-following
        if (followerId === followingId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        // Check if already following
        const existingFollow = await Follow.checkFollowExists(followerId, followingId);
        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: 'You are already following this user'
            });
        }

        // Create follow relationship
        const follow = new Follow({
            follower: followerId,
            following: followingId
        });

        await follow.save();

        // Update follower's points and following count
        const follower = await User.findById(followerId);
        await follower.updatePoints(1);
        await follower.updateFollowCounts(true);

        // Update following user's followers count
        const following = await User.findById(followingId);
        await following.updateFollowCounts(false);

        res.json({
            success: true,
            message: 'Successfully followed user',
            points: follower.points
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error following user',
            error: error.message
        });
    }
};

// Get follow suggestions
exports.getFollowSuggestions = async (req, res) => {
    try {
        const suggestions = await Follow.getFollowSuggestions(req.user.id);
        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting follow suggestions',
            error: error.message
        });
    }
};

// Get user's followers
exports.getFollowers = async (req, res) => {
    try {
        const followers = await Follow.find({ 
            following: req.params.userId,
            status: 'active'
        })
        .populate('follower', 'username email rating followersCount')
        .sort('-createdAt');

        res.json({
            success: true,
            followers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting followers',
            error: error.message
        });
    }
};

// Get user's following
exports.getFollowing = async (req, res) => {
    try {
        const following = await Follow.find({ 
            follower: req.params.userId,
            status: 'active'
        })
        .populate('following', 'username email rating followersCount')
        .sort('-createdAt');

        res.json({
            success: true,
            following
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting following users',
            error: error.message
        });
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        // Find and update follow relationship
        const follow = await Follow.findOneAndUpdate(
            {
                follower: followerId,
                following: followingId,
                status: 'active'
            },
            {
                status: 'unfollowed',
                unfollowedAt: Date.now()
            },
            { new: true }
        );

        if (!follow) {
            return res.status(400).json({
                success: false,
                message: 'Follow relationship not found'
            });
        }

        // Update counts for both users
        const [follower, following] = await Promise.all([
            User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
            User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } })
        ]);

        res.json({
            success: true,
            message: 'Successfully unfollowed user'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unfollowing user',
            error: error.message
        });
    }
}; 