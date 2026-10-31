// backend/src/modules/products/routes/productCategoryRoutes.js
const express = require('express');
const router = express.Router();
const authAdapter = require('../adapters/authAdapter');
const categoryController = require('../controllers/productCategoryController');

router.use(authAdapter.authenticate);

router.post('/', authAdapter.authorize(['admin', 'staff']), categoryController.createCategory);
router.get('/', authAdapter.authorize(['admin', 'staff', 'customer']), categoryController.listCategories);
router.get('/:id', authAdapter.authorize(['admin', 'staff', 'customer']), categoryController.getCategory);
router.put('/:id', authAdapter.authorize(['admin', 'staff']), categoryController.updateCategory);
router.patch('/:id/status', authAdapter.authorize(['admin', 'staff']), categoryController.changeStatus);

module.exports = router;
