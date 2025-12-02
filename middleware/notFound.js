// 404 Not Found middleware
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
};

module.exports = notFound;

