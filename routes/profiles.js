const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin routes
router.get('/', requireAdmin, profileController.getAll);
router.get('/:id', profileController.getById);
router.post('/', requireAdmin, profileController.create);
router.put('/:id', requireAdmin, profileController.update);
router.delete('/:id', requireAdmin, profileController.delete);
router.patch('/:id/restore', requireAdmin, profileController.restore);

module.exports = router;

