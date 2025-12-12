const express = require('express');
const router = express.Router();
const doctorScheduleController = require('../controllers/doctorScheduleController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', doctorScheduleController.getAll);
router.get('/doctor/:doctorId', doctorScheduleController.getByDoctorId);
router.get('/:id', doctorScheduleController.getById);

// Protected routes
router.post('/', authenticate, doctorScheduleController.create);
router.put('/:id', authenticate, doctorScheduleController.update);
router.delete('/:id', authenticate, doctorScheduleController.delete);

module.exports = router;

