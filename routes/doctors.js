const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');



// Public routes
router.get('/', doctorController.getAll);
router.get('/list', doctorController.getDoctors); // Simple endpoint to get all doctors
router.get('/available', doctorController.getAvailable);
router.get('/:id', doctorController.getById);
router.post('/register', doctorController.register);
router.post('/login', doctorController.login);
router.post('/bookAppointment', doctorController.bookAppointment);

// Protected routes (Admin functions)
// Note: In production, add authenticate middleware for security
router.post('/create', doctorController.createDoctor); // Admin create doctor (auth can be added later)
router.put('/:id', doctorController.update); // Update doctor (auth can be added later)
router.delete('/:id', doctorController.delete); // Delete doctor (auth can be added later)

module.exports = router;
