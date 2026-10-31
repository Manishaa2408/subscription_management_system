const express = require('express');
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  getCustomerActivity
} = require('../controllers/customerController');

const {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
} = require('../controllers/customerAddressController');

const {
  getNotes,
  addNote,
  updateNote
} = require('../controllers/customerNoteController');

const { authenticate, authorize } = require('../adapters/authAdapter');

// All customer management endpoints require authentication
router.use(authenticate);

// 1. Customer Core CRUD
router.post('/', authorize('admin'), createCustomer);
router.get('/', authorize('admin', 'staff'), getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.patch('/:id/status', authorize('admin'), updateCustomerStatus);
router.get('/:id/activity', authorize('admin', 'staff'), getCustomerActivity);

// 2. Customer Address Management
router.get('/:id/addresses', getAddresses);
router.post('/:id/addresses', addAddress);
router.put('/:id/addresses/:addressId', updateAddress);
router.patch('/:id/addresses/:addressId/default', setDefaultAddress);
router.delete('/:id/addresses/:addressId', deleteAddress);

// 3. Customer Internal Notes (Strictly Admin / Staff)
router.get('/:id/notes', authorize('admin', 'staff'), getNotes);
router.post('/:id/notes', authorize('admin', 'staff'), addNote);
router.put('/:id/notes/:noteId', authorize('admin', 'staff'), updateNote);

module.exports = router;
