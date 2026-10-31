const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUserById,
  createStaff,
  updateUserStatus,
  updateUserRole
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All user management routes require Admin authorization
router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/staff', createStaff);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/role', updateUserRole);

module.exports = router;
