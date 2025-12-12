const express = require('express');
const router = express.Router();
const consultationFeeController = require('../controllers/consultationFeeController');
const { authenticate } = require('../middleware/auth');

// Get all current active fees
router.get('/current', consultationFeeController.getAllCurrentFees);

// Get all fees for a specific doctor
router.get('/doctor/:doctorId', consultationFeeController.getDoctorFees);

// Get current active fee for a doctor and appointment type
router.get('/doctor/:doctorId/current', consultationFeeController.getCurrentFee);

// Create a new consultation fee (authentication optional for now)
router.post('/doctor/:doctorId', consultationFeeController.createFee);

// Update a consultation fee (authentication optional for now)
router.put('/:feeId', consultationFeeController.updateFee);

// Delete/deactivate a consultation fee (authentication optional for now)
router.delete('/:feeId', consultationFeeController.deleteFee);

module.exports = router;

