const mongoose = require('mongoose');

const instagramFollowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instagramUsername: {
    type: String,
    required: true
  },
  instagramId: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  followDate: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
instagramFollowSchema.index({ user: 1, instagramId: 1 }, { unique: true });

module.exports = mongoose.model('InstagramFollow', instagramFollowSchema); 