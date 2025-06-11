const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Sanitize request data
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    // Sanitize request body for XSS
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

// Sanitize response data
const sanitizeResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'string') {
      data = xss(data);
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = xss(data[key]);
        }
      });
    }
    originalSend.call(this, data);
  };
  next();
};

module.exports = {
  mongoSanitize: mongoSanitize(),
  sanitizeRequest,
  sanitizeResponse
}; 