const InstagramAPI = require('instagram-web-api');
const InstagramFollow = require('../models/InstagramFollow');
const User = require('../models/User');

// Instagram client configuration
const getInstagramClient = (username, password) => {
  return new InstagramAPI({
    username,
    password
  });
};

exports.connectInstagram = async (req, res) => {
  try {
    const { instagramUsername, instagramPassword } = req.body;
    
    if (!instagramUsername || !instagramPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Instagram username and password'
      });
    }

    const client = getInstagramClient(instagramUsername, instagramPassword);
    
    try {
      // Attempt to login to verify credentials
      await client.login();
      
      // Get user info to verify account
      const profile = await client.getProfile();
      
      // Save Instagram info to user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          instagramUsername,
          instagramId: profile.id,
          isInstagramConnected: true
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Instagram account connected successfully',
        data: {
          instagramUsername: user.instagramUsername,
          isInstagramConnected: user.isInstagramConnected
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Instagram credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error connecting Instagram account',
      error: error.message
    });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    
    if (!req.user.isInstagramConnected) {
      return res.status(400).json({
        success: false,
        message: 'Please connect your Instagram account first'
      });
    }

    const client = getInstagramClient(req.user.instagramUsername);
    
    // Get target user info
    const targetUser = await client.getUserByUsername({ username: targetUsername });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Instagram user not found'
      });
    }

    // Follow the user
    await client.follow({ userId: targetUser.id });

    // Record the follow action
    const instagramFollow = await InstagramFollow.create({
      user: req.user.id,
      instagramUsername: targetUsername,
      instagramId: targetUser.id
    });

    // Award points
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { points: 1 }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully followed user and earned 1 point',
      data: instagramFollow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error following Instagram user',
      error: error.message
    });
  }
};

exports.getFollowHistory = async (req, res) => {
  try {
    const follows = await InstagramFollow.find({ user: req.user.id })
      .sort({ followDate: -1 });

    res.status(200).json({
      success: true,
      data: follows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching follow history',
      error: error.message
    });
  }
}; 