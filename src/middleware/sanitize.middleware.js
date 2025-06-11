const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');

const sanitizeData = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeData(v));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((result, key) => {
      result[key] = sanitizeData(obj[key]);
      return result;
    }, {});
  }
  if (typeof obj === 'string') {
    return xss(obj);
  }
  return obj;
};

const sanitizeMiddleware = {
  // Sanitize request body, query, and params
  sanitizeRequest: (req, res, next) => {
    if (req.body) {
      req.body = sanitizeData(req.body);
    }
    if (req.query) {
      req.query = sanitizeData(req.query);
    }
    if (req.params) {
      req.params = sanitizeData(req.params);
    }
    next();
  },

  // MongoDB query sanitization
  mongoSanitize: mongoSanitize({
    allowDots: true,
    replaceWith: '_'
  }),

  // Clean response data
  sanitizeResponse: (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      if (body && typeof body === 'object') {
        body = sanitizeData(body);
      }
      return originalSend.call(this, body);
    };
    next();
  }
};

module.exports = sanitizeMiddleware; 