const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/example
router.get('/', (req, res) => {
  res.json({
    message: 'Example route is working',
    data: {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path
    }
  });
});

// Simple Supabase connectivity test
// GET /api/example/supabase-test
router.get('/supabase-test', async (req, res, next) => {
  try {
    // Replace "your_table_name" with an actual table in your Supabase project
    const { data, error } = await supabase
      .from('your_table_name')
      .select('*')
      .limit(10);

    if (error) {
      // Forward Supabase errors to the global error handler
      error.status = 500;
      throw error;
    }

    res.json({
      message:
        'Successfully connected to Supabase. Replace "your_table_name" with a real table name.',
      rows: data
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/example/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Example route with ID: ${id}`,
    id: id
  });
});

// POST /api/example
router.post('/', (req, res) => {
  const { body } = req;
  res.status(201).json({
    message: 'Example POST request received',
    receivedData: body
  });
});

module.exports = router;

