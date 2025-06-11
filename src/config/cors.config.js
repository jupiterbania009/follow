const whitelist = [
  'http://localhost:3000', // React development server
  'http://localhost:5000', // Express API server
  'https://instafollowx.onrender.com', // Production domain
  'https://int-flow.onrender.com', // Your actual production domain
  undefined // Allow requests with no origin (like mobile apps or Postman)
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true,
  maxAge: 86400,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

module.exports = corsOptions; 
