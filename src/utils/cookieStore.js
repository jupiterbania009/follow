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

// Create a memory store that implements the tough-cookie Store interface
class MemoryStore {
    constructor() {
        this.idx = {};
    }

    findCookie(domain, path, key, cb) {
        if (!this.idx[domain] || !this.idx[domain][path] || !this.idx[domain][path][key]) {
            cb(null, null);
            return;
        }
        cb(null, this.idx[domain][path][key]);
    }

    putCookie(cookie, cb) {
        if (!this.idx[cookie.domain]) {
            this.idx[cookie.domain] = {};
        }
        if (!this.idx[cookie.domain][cookie.path]) {
            this.idx[cookie.domain][cookie.path] = {};
        }
        this.idx[cookie.domain][cookie.path][cookie.key] = cookie;
        cb(null);
    }

    getAllCookies(cb) {
        const cookies = [];
        Object.keys(this.idx).forEach(domain => {
            Object.keys(this.idx[domain]).forEach(path => {
                Object.keys(this.idx[domain][path]).forEach(key => {
                    cookies.push(this.idx[domain][path][key]);
                });
            });
        });
        cb(null, cookies);
    }

    removeCookie(domain, path, key, cb) {
        if (this.idx[domain] && this.idx[domain][path] && this.idx[domain][path][key]) {
            delete this.idx[domain][path][key];
        }
        cb(null);
    }

    removeCookies(domain, path, cb) {
        if (this.idx[domain]) {
            if (path) {
                delete this.idx[domain][path];
            } else {
                delete this.idx[domain];
            }
        }
        cb(null);
    }

    updateCookie(oldCookie, newCookie, cb) {
        this.putCookie(newCookie, cb);
    }
}

const createCookieStore = (username) => {
    try {
        const cookieFile = path.join(cookiesDir, `${username}.json`);
        
        // Create cookie file if it doesn't exist
        if (!fs.existsSync(cookieFile)) {
            fs.writeFileSync(cookieFile, '{}');
        }

        // Create a new cookie jar with memory store
        const cookieJar = new CookieJar(new MemoryStore());
        
        // Set essential cookies
        setEssentialCookies(cookieJar)
            .catch(error => console.error('Error setting essential cookies:', error));

        return cookieJar;
    } catch (error) {
        console.error('Error creating cookie store:', error);
        // Fallback to memory-only cookie jar
        const cookieJar = new CookieJar(new MemoryStore());
        
        // Set essential cookies even in memory-only mode
        setEssentialCookies(cookieJar)
            .catch(error => console.error('Error setting essential cookies:', error));
            
        return cookieJar;
    }
};

module.exports = { createCookieStore }; 
