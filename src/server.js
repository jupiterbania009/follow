require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const followRoutes = require('./routes/follow.routes');
const reviewRoutes = require('./routes/review.routes');
const instagramRoutes = require('./routes/instagramRoutes');

// Import configurations and middleware
const corsOptions = require('./config/cors.config');
const { sessionConfig } = require('./config/session.config');
const corsErrorHandler = require('./middleware/cors.middleware');
const { helmetConfig, additionalHeaders, securityResponseHeaders } = require('./middleware/security.middleware');
const { sanitizeRequest, sanitizeResponse } = require('./middleware/sanitize.middleware');
const { loginLimiter, registrationLimiter, apiLimiter } = require('./middleware/bruteforce.middleware');
const config = require('./config/config');

const app = express();

// Basic middleware
app.use(express.json({
  limit: '10kb' // Limit body size
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Enable CORS with options
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Security middleware
app.use(helmetConfig);
app.use(compression());
app.use(morgan('dev'));

// Request sanitization (after body parsing)
app.use(mongoSanitize()); // Sanitize requests against NoSQL injection
app.use(hpp());
app.use(sanitizeRequest);
app.use(sanitizeResponse);

app.use(additionalHeaders);
app.use(securityResponseHeaders);

// Session configuration
app.use(sessionConfig);

// Apply rate limiting to specific routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registrationLimiter);
app.use('/api', apiLimiter);

// API Security Headers for specific routes
app.use('/api', (req, res, next) => {
    // Ensure API responses are not cached
    res.set({
        'Surrogate-Control': 'no-store',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/instagram', instagramRoutes);

// Error handler for CORS
app.use(corsErrorHandler);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
        } else {
            next();
        }
    });
}

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle specific types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

// Database connection with retry logic
const connectWithRetry = () => {
    // Validate MongoDB URI
    if (!config.MONGODB_URI) {
        console.error('MONGODB_URI environment variable is not set');
        process.exit(1);
    }

    mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
    })
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        if (err.name === 'MongoParseError') {
            console.error('Invalid MongoDB connection string. Please check your MONGODB_URI environment variable.');
            process.exit(1);
        }
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    if (mongoose.connection.readyState !== 1) {
        connectWithRetry();
    }
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry();
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

// Initial connection attempt
connectWithRetry();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Received shutdown signal. Starting graceful shutdown...');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); 
