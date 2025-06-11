const express = require('express');
const router = express.Router();
const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowSuggestions
} = require('../controllers/follow.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Follow routes
router.post('/:userId', authenticateToken, followUser);
router.delete('/:userId', authenticateToken, unfollowUser);
router.get('/followers/:userId', authenticateToken, getFollowers);
router.get('/following/:userId', authenticateToken, getFollowing);
router.get('/suggestions', authenticateToken, getFollowSuggestions);

module.exports = router; 
