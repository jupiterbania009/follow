const helmet = require('helmet');

const securityMiddleware = {
  // Configure Helmet with enhanced CSP and other security headers
  helmetConfig: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.your-domain.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    expectCt: {
      maxAge: 86400,
      enforce: true
    },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  }),

  // Additional custom security headers
  additionalHeaders: (req, res, next) => {
    // Permissions Policy (formerly Feature-Policy)
    res.setHeader('Permissions-Policy', 
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

    // Clear-Site-Data header for logout routes
    if (req.path === '/api/auth/logout') {
      res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    }

    // Report-To and NEL (Network Error Logging) headers
    const reportToHeader = {
      group: 'default',
      max_age: 31536000,
      endpoints: [{ url: 'https://your-domain.com/api/csp-report' }]
    };
    res.setHeader('Report-To', JSON.stringify(reportToHeader));
    res.setHeader('NEL', JSON.stringify({
      report_to: 'default',
      max_age: 31536000,
      include_subdomains: true
    }));

    // Cross-Origin-Resource-Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    next();
  },

  // Security response headers middleware
  securityResponseHeaders: (req, res, next) => {
    // Remove X-Powered-By header if it wasn't already removed by Helmet
    res.removeHeader('X-Powered-By');

    // Add security headers for API responses
    if (req.path.startsWith('/api/')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Pragma', 'no-cache');
    }

    next();
  }
};

module.exports = securityMiddleware; 