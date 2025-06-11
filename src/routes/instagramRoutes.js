const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  connectInstagram,
  followUser,
  getFollowHistory
} = require('../controllers/instagramController');

// Instagram routes
router.post('/connect', protect, connectInstagram);
router.post('/follow', protect, followUser);
router.get('/history', protect, getFollowHistory);

module.exports = router; 