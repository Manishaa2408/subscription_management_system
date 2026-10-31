// backend/src/modules/plans/routes/planRoutes.js
const express = require('express');
const router = express.Router();
const authAdapter = require('../adapters/authAdapter');
const planController = require('../controllers/planController');

// All routes require authentication
router.use(authAdapter.authenticate);

// Admin-only routes
router.post('/', authAdapter.authorize(['admin']), planController.createPlan);
router.get('/', authAdapter.authorize(['admin', 'staff']), planController.listPlans);
router.get('/catalog', authAdapter.authorize(['admin', 'staff', 'customer']), planController.getCatalog);
router.get('/product/:productId', authAdapter.authorize(['admin', 'staff', 'customer']), planController.getPlansByProduct);
router.get('/:id', authAdapter.authorize(['admin', 'staff']), planController.getPlan);
router.put('/:id', authAdapter.authorize(['admin']), planController.updatePlan);
router.patch('/:id/status', authAdapter.authorize(['admin']), planController.changeStatus);
router.patch('/:id/archive', authAdapter.authorize(['admin']), planController.archivePlan);
router.get('/:id/activity', authAdapter.authorize(['admin', 'staff']), planController.getActivity);

module.exports = router;
