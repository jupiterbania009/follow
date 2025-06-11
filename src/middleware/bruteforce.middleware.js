const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Create a simple memory store as fallback
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in development
      return process.env.NODE_ENV === 'development';
    }
  });
};

const bruteForceMiddleware = {
  // Login attempt limiter
  loginLimiter: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many login attempts, please try again after 15 minutes'
  ),

  // Registration limiter
  registrationLimiter: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts
    'Too many registration attempts, please try again after 1 hour'
  ),

  // API rate limiter
  apiLimiter: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests, please try again later'
  ),

  // Specific endpoint limiter (for sensitive operations)
  sensitiveOpLimiter: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 attempts
    'Too many sensitive operations, please try again after 1 hour'
  )
};

module.exports = bruteForceMiddleware; 
