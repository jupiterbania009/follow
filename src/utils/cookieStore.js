const { CookieJar } = require('tough-cookie');
const fs = require('fs').promises;
const path = require('path');

// Ensure cookies directory exists
const cookiesDir = path.join(__dirname, '../cookies');

const createCookieStore = async (username) => {
    try {
        // Ensure directory exists
        await fs.mkdir(cookiesDir, { recursive: true });
        
        const cookieJar = new CookieJar();
        
        // Return an async-compatible cookie store
        return {
            cookieJar,
            setCookie: async (cookie, url) => {
                return await cookieJar.setCookie(cookie, url);
            },
            getCookies: async (url) => {
                return await cookieJar.getCookies(url);
            },
            removeAllCookies: async () => {
                const cookies = await cookieJar.getCookies(url);
                for (const cookie of cookies) {
                    await cookieJar.removeCookie(url, cookie.key);
                }
            }
        };
    } catch (error) {
        console.error('Error creating cookie store:', error);
        throw error;
    }
};

module.exports = { createCookieStore }; 
