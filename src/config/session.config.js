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
      // Don't crash the server on Redis errors
      if (sessionStore) {
        console.log('Falling back to memory store for sessions');
        sessionStore = null;
      }
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

// Create session middleware
const createSessionMiddleware = () => {
  const baseConfig = {
    secret: config.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  };

  // Add store if Redis is available
  if (sessionStore) {
    baseConfig.store = sessionStore;
  }

  return session(baseConfig);
};

// Add session cleanup for Instagram checkpoint data
if (sessionStore) {
  // Cleanup expired checkpoint data every hour
  setInterval(() => {
    sessionStore.all((err, sessions) => {
      if (err) {
        console.error('Error cleaning up checkpoint sessions:', err);
        return;
      }

      const now = new Date();
      sessions.forEach((session) => {
        if (session.instagramCheckpoint) {
          const checkpointTime = new Date(session.instagramCheckpoint.timestamp);
          // Remove checkpoint data after 15 minutes
          if (now - checkpointTime > 15 * 60 * 1000) {
            delete session.instagramCheckpoint;
            sessionStore.set(session.id, session);
          }
        }
      });
    });
  }, 60 * 60 * 1000); // Run every hour
}

// Export session middleware creator instead of config
module.exports = {
  createSessionMiddleware,
  redisClient
}; 
