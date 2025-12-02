const express = require('express');
const router = express.Router();

// Import route modules
const exampleRoutes = require('./example');
const userRoutes = require('./users');

// Mount routes
router.use('/example', exampleRoutes);
router.use('/users', userRoutes);

// API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      example: '/api/example',
      users: '/api/users'
    }
  });
});

module.exports = router;

