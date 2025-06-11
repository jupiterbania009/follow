const express = require('express');
const router = express.Router();
const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowSuggestions
} = require('../controllers/follow.controller');
const { protect } = require('../middleware/auth.middleware');

// Follow routes
router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/followers/:userId', protect, getFollowers);
router.get('/following/:userId', protect, getFollowing);
router.get('/suggestions', protect, getFollowSuggestions);

module.exports = router; 