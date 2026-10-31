// backend/src/modules/products/routes/productVariantRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :productId from parent
const authAdapter = require('../adapters/authAdapter');
const variantController = require('../controllers/productVariantController');

// All variant routes require authentication
router.use(authAdapter.authenticate);

// Create variant (admin, staff)
router.post('/', authAdapter.authorize(['admin', 'staff']), variantController.createVariant);

// List variants (admin, staff, customer)
router.get('/', authAdapter.authorize(['admin', 'staff', 'customer']), variantController.listVariants);

// Get specific variant
router.get('/:variantId', authAdapter.authorize(['admin', 'staff', 'customer']), variantController.getVariant);

// Update variant (admin, staff)
router.put('/:variantId', authAdapter.authorize(['admin', 'staff']), variantController.updateVariant);

// Change status
router.patch('/:variantId/status', authAdapter.authorize(['admin', 'staff']), variantController.changeStatus);

// Archive (delete)
router.delete('/:variantId', authAdapter.authorize(['admin', 'staff']), variantController.archiveVariant);

// Activity log for variant
router.get('/:variantId/activity', authAdapter.authorize(['admin', 'staff']), variantController.getActivity);

module.exports = router;
