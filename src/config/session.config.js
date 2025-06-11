const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

let redisClient = null;
let sessionStore = null;

// Initialize Redis if URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          console.log('Redis connection failed for session store, falling back to memory store');
          return null;
        }
        return Math.min(times * 1000, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis session store error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis for session store');
    });

    // Create Redis store for sessions
    sessionStore = new RedisStore({ 
      client: redisClient,
      prefix: 'sess:'
    });
  } catch (error) {
    console.error('Error initializing Redis for sessions:', error);
    redisClient = null;
  }
} else {
  console.log('REDIS_URL not provided, using memory store for sessions');
}

// Session configuration
const sessionConfig = session({
  store: sessionStore, // Will fall back to MemoryStore if sessionStore is null
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict'
  },
  rolling: true
});

module.exports = {
  sessionConfig,
  redisClient
}; 
