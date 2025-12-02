// Custom error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', err);

  // Default error
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

module.exports = errorHandler;

