const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const config = require('../config/config');

let redisClient = null;

// Initialize Redis if configuration is available
if (config.REDIS_URL) {
  try {
    // Parse the Redis URL to get the host
    const redisUrl = new URL(config.REDIS_URL);
    
    redisClient = new Redis({
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port),
      username: redisUrl.username,
      password: redisUrl.password,
      db: 0,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      retryStrategy(times) {
        if (times > 3) {
          console.log('Redis connection failed, falling back to memory store');
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
      tls: config.REDIS_URL.startsWith('rediss://') ? {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      } : undefined
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis Cloud for rate limiting');
    });
  } catch (error) {
    console.error('Error initializing Redis:', error);
    redisClient = null;
  }
} else {
  console.log('REDIS_URL not provided, using memory store for rate limiting');
}

// Create a rate limiter with fallback to memory store
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
      return config.NODE_ENV === 'development';
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

// Export Redis client for use in other parts of the application
module.exports = {
  ...bruteForceMiddleware,
  redisClient
}; 
