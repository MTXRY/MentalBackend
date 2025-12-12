const express = require('express');
const router = express.Router();

// Import route modules
const exampleRoutes = require('./example');
const userRoutes = require('./users');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const paymentRoutes = require('./payments');
const notificationRoutes = require('./notifications');
const settingsRoutes = require('./settings');
const consultationFeeRoutes = require('./consultationFees');
const adminRoutes = require('./adminRoutes');
const doctorScheduleRoutes = require('./doctorSchedules');
const profileRoutes = require('./profiles');
const teamMemberRoutes = require('./teamMembers');
const notificationSimpleRoutes = require('./notificationsSimple');

// Mount routes
router.use('/example', exampleRoutes);
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notifications-simple', notificationSimpleRoutes);
router.use('/settings', settingsRoutes);
router.use('/consultation-fees', consultationFeeRoutes);
router.use('/admin', adminRoutes);
router.use('/doctor-schedules', doctorScheduleRoutes);
router.use('/profiles', profileRoutes);
router.use('/team-members', teamMemberRoutes);

// API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      example: '/api/example',
      users: '/api/users',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      payments: '/api/payments',
      notifications: '/api/notifications',
      notificationsSimple: '/api/notifications-simple',
      settings: '/api/settings',
      consultationFees: '/api/consultation-fees',
      admin: '/api/admin',
      doctorSchedules: '/api/doctor-schedules',
      profiles: '/api/profiles',
      teamMembers: '/api/team-members'
    }
  });
});

module.exports = router;

