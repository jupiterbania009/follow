const InstagramAPI = require('instagram-web-api');
const InstagramFollow = require('../models/InstagramFollow');
const User = require('../models/user.model');
const { createCookieStore } = require('../utils/cookieStore');

// Instagram client configuration
const getInstagramClient = (username, password) => {
  try {
    const cookieStore = createCookieStore(username);
    
    // Instagram mobile user agent - using Android device to improve reliability
    const userAgent = 'Instagram 219.0.0.12.117 Android (30/11; 480dpi; 1080x2310; samsung; SM-G970F; beyond0; exynos9820; en_US; 346138365)';
    
    return new InstagramAPI({
      username,
      password,
      cookieStore,
      userAgent,
      // Additional Instagram client options
      language: 'en-US',
      timezoneOffset: new Date().getTimezoneOffset(),
      headers: {
        'X-IG-App-ID': '936619743392459',
        'X-IG-WWW-Claim': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://i.instagram.com',
        'Referer': 'https://i.instagram.com/',
      }
    });
  } catch (error) {
    console.error('Error creating Instagram client:', error);
    // If cookie store fails, try with minimal configuration
    return new InstagramAPI({
      username,
      password,
      userAgent: 'Instagram 219.0.0.12.117 Android (30/11; 480dpi; 1080x2310; samsung; SM-G970F; beyond0; exynos9820; en_US; 346138365)'
    });
  }
};

// Extract challenge info from URL
const extractChallengeInfo = (checkpointUrl) => {
  try {
    const url = new URL(checkpointUrl);
    const challengePath = url.pathname.split('/');
    const challengeId = challengePath[2];
    const challengeContext = url.searchParams.get('challenge_context');
    
    return {
      challengeId,
      challengeContext,
      fullUrl: checkpointUrl
    };
  } catch (error) {
    console.error('Error extracting challenge info:', error);
    throw error;
  }
};

// Handle checkpoint challenge
const handleCheckpoint = async (client, checkpointUrl) => {
  try {
    const challengeInfo = extractChallengeInfo(checkpointUrl);
    console.log('Challenge info:', challengeInfo);

    // First API call - Get initial challenge state
    const initialResponse = await client.request({
      method: 'GET',
      url: `https://i.instagram.com/api/v1/challenge/${challengeInfo.challengeId}/`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': client.state.userAgent,
        'X-IG-App-ID': '936619743392459',
        'X-Instagram-AJAX': '1',
      }
    });

    console.log('Initial challenge response:', initialResponse);

    // Second API call - Request verification code
    const verificationResponse = await client.request({
      method: 'POST',
      url: `https://i.instagram.com/api/v1/challenge/${challengeInfo.challengeId}/request_code/`,
      form: {
        choice: 1, // 1 for email, 0 for phone
        _csrftoken: client.state.cookieJar.getCookies('csrftoken'),
        guid: client.state.uuid,
        device_id: client.state.deviceId,
        android_id: client.state.deviceId,
        challenge_context: challengeInfo.challengeContext,
        bloks_versioning_id: '8f05e753340a3a4e93ae9c0809e6d39f3501752d10064c85db3a635f5426a035'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': client.state.userAgent,
        'X-IG-App-ID': '936619743392459',
        'X-Instagram-AJAX': '1'
      }
    });

    console.log('Verification request response:', verificationResponse);

    if (!verificationResponse.status || verificationResponse.status !== 'ok') {
      throw new Error('Failed to request verification code: ' + JSON.stringify(verificationResponse));
    }

    // Get the contact information where code was sent
    const contactInfo = verificationResponse.step_data?.contact_point || 'your email/phone';

    return {
      challengeType: 'verification_code',
      challengeData: {
        ...initialResponse,
        verificationResponse
      },
      verificationMethods: ['email', 'phone'],
      checkpointUrl: checkpointUrl,
      challengeInfo,
      contactPoint: contactInfo
    };
  } catch (error) {
    console.error('Error handling checkpoint:', error);
    throw error;
  }
};

// Connect Instagram account
exports.connectInstagram = async (req, res) => {
  try {
    console.log('Instagram connect request received');
    const { instagramUsername, instagramPassword } = req.body;

    if (!instagramUsername || !instagramPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Instagram username and password'
      });
    }

    console.log('Creating Instagram client...');
    const client = getInstagramClient(instagramUsername, instagramPassword);

    // Test the connection by trying to login
    console.log('Attempting to login to Instagram...');
    try {
      const loginResponse = await client.login();
      console.log('Instagram login response:', loginResponse);

      if (!loginResponse.authenticated) {
        throw new Error('Authentication failed');
      }

      console.log('Instagram login successful');

      // If login successful, update user's Instagram credentials
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          instagramUsername,
          instagramConnected: true,
          lastInstagramLogin: new Date()
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Instagram account connected successfully',
        user
      });
    } catch (loginError) {
      console.error('Instagram login error:', loginError);
      
      // Handle checkpoint challenge
      if (loginError.message.includes('checkpoint_required')) {
        try {
          const checkpointUrl = loginError.checkpoint_url;
          const challengeInfo = await handleCheckpoint(client, checkpointUrl);
          
          // Store checkpoint information in user session for later use
          req.session.instagramCheckpoint = {
            username: instagramUsername,
            password: instagramPassword, // Needed for verification process
            challengeUrl: checkpointUrl,
            challengeInfo: challengeInfo.challengeInfo,
            timestamp: new Date()
          };

          return res.status(403).json({
            success: false,
            message: `Instagram security code has been sent to ${challengeInfo.contactPoint}`,
            error: 'checkpoint_required',
            checkpoint: {
              type: challengeInfo.challengeType,
              methods: challengeInfo.verificationMethods,
              url: checkpointUrl,
              challengeInfo: challengeInfo.challengeInfo,
              contactPoint: challengeInfo.contactPoint
            }
          });
        } catch (checkpointError) {
          console.error('Checkpoint handling error:', checkpointError);
          return res.status(403).json({
            success: false,
            message: 'Unable to send verification code. Please try again or log in to Instagram app directly.',
            error: 'checkpoint_error',
            details: checkpointError.message
          });
        }
      }
      
      if (loginError.message.includes('bad_password')) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect Instagram password.',
          error: 'bad_password'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Failed to login to Instagram. Please check your credentials.',
        error: loginError.message
      });
    }
  } catch (error) {
    console.error('Instagram connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account',
      error: error.message
    });
  }
};

// Submit checkpoint verification code
exports.submitVerificationCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    // Get checkpoint info from session
    const checkpointInfo = req.session.instagramCheckpoint;
    if (!checkpointInfo) {
      return res.status(400).json({
        success: false,
        message: 'No active checkpoint challenge found'
      });
    }

    const client = getInstagramClient(checkpointInfo.username, checkpointInfo.password);

    // Submit the verification code
    try {
      const verifyResponse = await client.request({
        method: 'POST',
        url: `https://i.instagram.com/api/v1/challenge/${checkpointInfo.challengeInfo.challengeId}/verify/`,
        form: {
          security_code: code,
          _csrftoken: client.state.cookieJar.getCookies('csrftoken'),
          guid: client.state.uuid,
          device_id: client.state.deviceId,
          android_id: client.state.deviceId,
          challenge_context: checkpointInfo.challengeInfo.challengeContext,
          bloks_versioning_id: '8f05e753340a3a4e93ae9c0809e6d39f3501752d10064c85db3a635f5426a035'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': client.state.userAgent,
          'X-IG-App-ID': '936619743392459',
          'X-Instagram-AJAX': '1'
        }
      });

      console.log('Verification response:', verifyResponse);

      if (verifyResponse.status === 'ok' || verifyResponse.logged_in_user) {
        // Clear checkpoint info from session
        delete req.session.instagramCheckpoint;

        // Try logging in again
        await client.login();

        // Update user's Instagram connection status
        const user = await User.findByIdAndUpdate(
          req.user._id,
          {
            instagramUsername: checkpointInfo.username,
            instagramConnected: true,
            lastInstagramLogin: new Date()
          },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          message: 'Verification successful',
          user
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
          error: 'invalid_code'
        });
      }
    } catch (verifyError) {
      console.error('Verification error:', verifyError);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify code',
        error: verifyError.message
      });
    }
  } catch (error) {
    console.error('Verification submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification code',
      error: error.message
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
    const client = await getInstagramClient(user.instagramUsername, user.instagramPassword);
    
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
