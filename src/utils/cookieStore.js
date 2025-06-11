const { CookieJar, Cookie } = require('tough-cookie');
const FileCookieStore = require('tough-cookie-filestore');
const fs = require('fs');
const path = require('path');

// Ensure cookies directory exists
const cookiesDir = path.join(__dirname, '../cookies');
if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
}

const createCookieStore = (username) => {
    const cookiePath = path.join(cookiesDir, `${username}.json`);
    
    // Create cookie file if it doesn't exist
    if (!fs.existsSync(cookiePath)) {
        fs.writeFileSync(cookiePath, '{}');
    }

    return new CookieJar(new FileCookieStore(cookiePath));
};

module.exports = { createCookieStore }; 