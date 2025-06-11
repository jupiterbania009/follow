const { CookieJar, Cookie } = require('tough-cookie');
const FileCookieStore = require('tough-cookie-filestore');
const fs = require('fs');
const path = require('path');

// Ensure cookies directory exists
const cookiesDir = path.join(__dirname, '../cookies');

// Create directory if it doesn't exist
if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
}

// Essential Instagram cookies
const ESSENTIAL_COOKIES = [
    {
        key: 'ig_cb',
        value: '1',
        domain: '.instagram.com'
    },
    {
        key: 'ig_did',
        value: generateDeviceId(),
        domain: '.instagram.com'
    },
    {
        key: 'csrftoken',
        value: generateCSRFToken(),
        domain: '.instagram.com'
    },
    {
        key: 'mid',
        value: generateMachineId(),
        domain: '.instagram.com'
    }
];

// Generate a random device ID
function generateDeviceId() {
    return 'android-' + Math.random().toString(36).substring(2, 15);
}

// Generate a CSRF token
function generateCSRFToken() {
    return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

// Generate a machine ID
function generateMachineId() {
    return Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

// Set essential cookies in the jar
async function setEssentialCookies(cookieJar) {
    const url = 'https://www.instagram.com';
    
    for (const cookieData of ESSENTIAL_COOKIES) {
        const cookie = new Cookie({
            key: cookieData.key,
            value: cookieData.value,
            domain: cookieData.domain,
            path: '/',
            secure: true,
            httpOnly: true,
            maxAge: 31536000 // 1 year in seconds
        });
        
        try {
            await cookieJar.setCookie(cookie, url);
        } catch (error) {
            console.error(`Error setting ${cookieData.key} cookie:`, error);
        }
    }
}

const createCookieStore = (username) => {
    try {
        const cookieFile = path.join(cookiesDir, `${username}.json`);
        
        // Create cookie file if it doesn't exist
        if (!fs.existsSync(cookieFile)) {
            fs.writeFileSync(cookieFile, '{}');
        }

        // Create a new cookie jar with file store
        const cookieJar = new CookieJar(new FileCookieStore(cookieFile));
        
        // Set essential cookies
        setEssentialCookies(cookieJar)
            .catch(error => console.error('Error setting essential cookies:', error));

        return cookieJar;
    } catch (error) {
        console.error('Error creating cookie store:', error);
        // Fallback to memory-only cookie jar if file store fails
        const cookieJar = new CookieJar();
        
        // Set essential cookies even in memory-only mode
        setEssentialCookies(cookieJar)
            .catch(error => console.error('Error setting essential cookies:', error));
            
        return cookieJar;
    }
};

module.exports = { createCookieStore }; 
