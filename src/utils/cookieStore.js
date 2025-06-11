const { CookieJar, Store } = require('tough-cookie');
const fs = require('fs');
const path = require('path');

// Ensure cookies directory exists
const cookiesDir = path.join(__dirname, '../cookies');

// Create directory if it doesn't exist
if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
}

const createCookieStore = (username) => {
    try {
        const cookieJar = new CookieJar();
        
        // Return a synchronous-compatible cookie store
        return cookieJar;
    } catch (error) {
        console.error('Error creating cookie store:', error);
        throw error;
    }
};

module.exports = { createCookieStore }; 
