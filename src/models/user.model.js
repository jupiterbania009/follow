const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    points: {
        type: Number,
        default: 0
    },
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    instagramUsername: {
        type: String,
        sparse: true,
        unique: true
    },
    instagramPassword: {
        type: String,
        select: false
    },
    instagramId: {
        type: String,
        sparse: true,
        unique: true
    },
    isInstagramConnected: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update points
userSchema.methods.updatePoints = async function(points) {
    this.points += points;
    await this.save();
    return this.points;
};

// Method to update follow counts
userSchema.methods.updateFollowCounts = async function(isFollowing) {
    if (isFollowing) {
        this.followingCount += 1;
    } else {
        this.followersCount += 1;
    }
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 