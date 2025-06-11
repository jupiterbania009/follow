const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed',
      error: 'CORS policy violation'
    });
  }
  next(err);
};

module.exports = corsErrorHandler; 