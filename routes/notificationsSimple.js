const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationControllerSimple');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get notifications for a user (authenticated)
router.get('/user/:userId', authenticate, notificationController.getByUserId);

// Admin routes
router.get('/', authenticate, requireAdmin, notificationController.getAll);
router.get('/:id', authenticate, notificationController.getById);
router.post('/', authenticate, notificationController.create);
router.put('/:id', authenticate, notificationController.update);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/:id', authenticate, notificationController.delete);

module.exports = router;

