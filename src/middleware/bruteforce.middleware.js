const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

const bruteForceMiddleware = {
  // Login attempt limiter
  loginLimiter: rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return `${req.ip}-login`;
    }
  }),

  // Registration limiter
  registrationLimiter: rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: {
      success: false,
      message: 'Too many registration attempts, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return `${req.ip}-register`;
    }
  }),

  // API rate limiter
  apiLimiter: rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Specific endpoint limiter (for sensitive operations)
  sensitiveOpLimiter: rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts
    message: {
      success: false,
      message: 'Too many sensitive operations, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};

module.exports = bruteForceMiddleware; 