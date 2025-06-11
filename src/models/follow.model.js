const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'unfollowed'],
        default: 'active'
    },
    pointsAwarded: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    unfollowedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Static method to check if a follow relationship exists
followSchema.statics.checkFollowExists = async function(followerId, followingId) {
    return await this.findOne({
        follower: followerId,
        following: followingId,
        status: 'active'
    });
};

// Static method to get follow suggestions
followSchema.statics.getFollowSuggestions = async function(userId, limit = 10) {
    const following = await this.find({ follower: userId }).distinct('following');
    
    return await mongoose.model('User').aggregate([
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(userId) },
                _id: { $nin: following }
            }
        },
        { $sample: { size: limit } },
        {
            $project: {
                username: 1,
                rating: 1,
                followersCount: 1
            }
        }
    ]);
};

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow; 
