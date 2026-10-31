// backend/src/modules/products/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const authAdapter = require('../adapters/authAdapter');
const productController = require('../controllers/productController');

// All product routes require authentication
router.use(authAdapter.authenticate);

// Admin and staff can create, update, change status, archive
router.post('/', authAdapter.authorize(['admin', 'staff']), productController.createProduct);
router.get('/', authAdapter.authorize(['admin', 'staff', 'customer']), productController.listProducts);
router.get('/:id', authAdapter.authorize(['admin', 'staff', 'customer']), productController.getProduct);
router.put('/:id', authAdapter.authorize(['admin', 'staff']), productController.updateProduct);
router.patch('/:id/status', authAdapter.authorize(['admin', 'staff']), productController.changeStatus);
router.delete('/:id', authAdapter.authorize(['admin', 'staff']), productController.archiveProduct);
router.get('/:id/activity', authAdapter.authorize(['admin', 'staff']), productController.getActivity);

module.exports = router;
