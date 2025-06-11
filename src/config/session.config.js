const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

// Redis error handling
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

const sessionConfig = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this',
  name: 'sessionId', // Change default session cookie name
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only send cookies over HTTPS in production
    httpOnly: true, // Prevents client side JS from reading the cookie
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict', // Protection against CSRF
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  rolling: true, // Forces the session identifier cookie to be set on every response
});

module.exports = {
  sessionConfig,
  redisClient
}; 