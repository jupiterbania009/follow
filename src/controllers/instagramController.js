const InstagramAPI = require('instagram-web-api');
const InstagramFollow = require('../models/InstagramFollow');
const User = require('../models/user.model');
const { createCookieStore } = require('../utils/cookieStore');

// Instagram client configuration
const getInstagramClient = (username, password) => {
  const cookieStore = createCookieStore(username);
  return new InstagramAPI({
    username,
    password,
    cookieStore
  });
};

exports.connectInstagram = async (req, res) => {
  try {
    console.log('Instagram connect request received');
    const { instagramUsername, instagramPassword } = req.body;
    
    if (!instagramUsername || !instagramPassword) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide Instagram username and password'
      });
    }

    console.log('Creating Instagram client...');
    const client = getInstagramClient(instagramUsername, instagramPassword);
    
    try {
      console.log('Attempting to login to Instagram...');
      // Attempt to login to verify credentials
      await client.login();
      console.log('Instagram login successful');
      
      // Get user info to verify account
      console.log('Fetching Instagram profile...');
      const profile = await client.getProfile();
      console.log('Instagram profile fetched successfully');
      
      // Save Instagram info to user
      console.log('Updating user record...');
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          instagramUsername,
          instagramPassword: instagramPassword,
          instagramId: profile.id,
          isInstagramConnected: true
        },
        { new: true }
      );
      console.log('User record updated successfully');

      res.status(200).json({
        success: true,
        message: 'Instagram account connected successfully',
        data: {
          instagramUsername: user.instagramUsername,
          isInstagramConnected: user.isInstagramConnected
        }
      });
    } catch (error) {
      console.error('Instagram API Error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Instagram credentials or API error',
        error: error.message || 'Unknown Instagram API error'
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Instagram account',
      error: error.message || 'Unknown server error'
    });
  }
};

exports.followUser = async (req, res) => {
  try {
    console.log('Follow request received');
    const { targetUsername } = req.body;
    
    if (!req.user.isInstagramConnected) {
      return res.status(400).json({
        success: false,
        message: 'Please connect your Instagram account first'
      });
    }

    // Get the full user data including Instagram credentials
    const user = await User.findById(req.user.id).select('+instagramPassword');
    if (!user || !user.instagramPassword) {
      return res.status(400).json({
        success: false,
        message: 'Instagram credentials not found. Please reconnect your Instagram account.'
      });
    }

    console.log('Creating Instagram client for follow operation...');
    const client = getInstagramClient(user.instagramUsername, user.instagramPassword);
    
    try {
      // Login before performing any action
      console.log('Logging in to Instagram...');
      await client.login();
      console.log('Instagram login successful');
      
      // Get target user info
      console.log('Fetching target user info...');
      const targetUser = await client.getUserByUsername({ username: targetUsername });
      
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Instagram user not found'
        });
      }

      // Follow the user
      console.log('Attempting to follow user...');
      await client.follow({ userId: targetUser.id });
      console.log('Successfully followed user on Instagram');

      // Record the follow action
      console.log('Recording follow action...');
      const instagramFollow = await InstagramFollow.create({
        user: req.user.id,
        instagramUsername: targetUsername,
        instagramId: targetUser.id
      });

      // Award points
      console.log('Awarding points...');
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
      console.error('Instagram API Error:', error);
      return res.status(401).json({
        success: false,
        message: 'Error following user on Instagram',
        error: error.message || 'Unknown Instagram API error'
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error following Instagram user',
      error: error.message || 'Unknown server error'
    });
  }
};

exports.getFollowHistory = async (req, res) => {
  try {
    console.log('Fetching follow history...');
    const follows = await InstagramFollow.find({ user: req.user.id })
      .sort({ followDate: -1 });

    res.status(200).json({
      success: true,
      data: follows
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow history',
      error: error.message || 'Unknown server error'
    });
  }
}; 
