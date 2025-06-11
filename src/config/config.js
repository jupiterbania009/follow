require('dotenv').config();

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/instafollowx',
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production',
    SESSION_SECRET: process.env.SESSION_SECRET || 'default_session_secret_key_change_in_production',
    REDIS_URL: process.env.REDIS_URL || 'redis://default:6hUrYZQkUF26SIgCkGkaKSDlsbWvZ5Nm@redis-17417.c301.ap-south-1-1.ec2.redns.redis-cloud.com:17417'
}; 