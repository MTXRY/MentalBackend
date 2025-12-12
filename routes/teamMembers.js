const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/', teamMemberController.getAll);
router.get('/:id', teamMemberController.getById);
router.post('/', teamMemberController.create);
router.put('/:id', teamMemberController.update);
router.delete('/:id', teamMemberController.delete);

module.exports = router;

