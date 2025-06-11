const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const config = require('./config');

let redisClient = null;
let sessionStore = null;

// Initialize Redis if URL is provided
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
          console.log('Redis connection failed for session store, falling back to memory store');
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
      console.error('Redis session store error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis Cloud for session store');
    });

    // Create Redis store for sessions
    sessionStore = new RedisStore({ 
      client: redisClient,
      prefix: 'sess:',
      ttl: 86400 // 24 hours
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
  secret: config.SESSION_SECRET,
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
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