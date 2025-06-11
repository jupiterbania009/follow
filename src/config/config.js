require('dotenv').config();

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/instafollowx',
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production',
    SESSION_SECRET: process.env.SESSION_SECRET || 'default_session_secret_key_change_in_production',
    REDIS_URL: process.env.REDIS_URL || null, // Make Redis optional
    
    // Add validation method
    validate() {
        const requiredInProd = ['JWT_SECRET', 'SESSION_SECRET', 'MONGODB_URI'];
        
        if (this.NODE_ENV === 'production') {
            const missingVars = requiredInProd.filter(key => !this[key] || this[key].includes('default_'));
            if (missingVars.length > 0) {
                throw new Error(`Missing required environment variables in production: ${missingVars.join(', ')}`);
            }
        }
        
        return true;
    }
};

// Validate configuration
try {
    config.validate();
} catch (error) {
    console.error('Configuration Error:', error.message);
    process.exit(1);
}

module.exports = config; 
