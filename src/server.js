require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const followRoutes = require('./routes/follow.routes');
const reviewRoutes = require('./routes/review.routes');

// Import configurations and middleware
const corsOptions = require('./config/cors.config');
const { sessionConfig } = require('./config/session.config');
const corsErrorHandler = require('./middleware/cors.middleware');
const { helmetConfig, additionalHeaders, securityResponseHeaders } = require('./middleware/security.middleware');
const { sanitizeRequest, mongoSanitize, sanitizeResponse } = require('./middleware/sanitize.middleware');
const { loginLimiter, registrationLimiter, apiLimiter } = require('./middleware/bruteforce.middleware');

const app = express();

// Basic middleware
app.use(express.json({
  limit: '10kb' // Limit body size
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(morgan('dev'));

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(corsErrorHandler);
app.use(additionalHeaders);
app.use(securityResponseHeaders);
app.use(mongoSanitize); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(sanitizeRequest);
app.use(sanitizeResponse);
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/reviews', reviewRoutes);

// CSP violation report endpoint
app.post('/api/csp-report', (req, res) => {
    console.error('CSP Violation:', req.body);
    res.status(204).end();
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Database connection with retry logic
const connectWithRetry = () => {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry();
});

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
