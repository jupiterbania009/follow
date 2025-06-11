const whitelist = [
  'http://localhost:3000', // React development server
  'http://localhost:5000', // Express API server
  // Add your production domains here, for example:
  // 'https://your-production-domain.com',
  // 'https://api.your-production-domain.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
  credentials: true, // Allow cookies if you're using them
  maxAge: 86400, // Cache preflight request results for 24 hours
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

module.exports = corsOptions; 