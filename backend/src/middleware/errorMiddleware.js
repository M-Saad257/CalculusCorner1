const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    // Include stack trace only in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = { errorHandler };
