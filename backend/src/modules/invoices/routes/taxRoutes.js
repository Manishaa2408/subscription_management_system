const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { authenticate, authorize } = require('../adapters/authAdapter');
const { validateObjectId } = require('../middleware/invoiceValidation');

router.use(authenticate);

// Tax preview calculation
router.post('/calculate', authorize('admin', 'staff'), taxController.previewTaxCalculation);

// List & Create
router.get('/', authorize('admin', 'staff'), taxController.getTaxConfigurations);
router.post('/', authorize('admin'), taxController.createTaxConfiguration);

// Single configuration operations
router.get('/:id', authorize('admin', 'staff'), validateObjectId('id'), taxController.getTaxConfigurationById);
router.put('/:id', authorize('admin'), validateObjectId('id'), taxController.updateTaxConfiguration);
router.patch('/:id/status', authorize('admin'), validateObjectId('id'), taxController.toggleTaxStatus);

module.exports = router;
