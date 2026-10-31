const refundService = require('../services/refundService');

/**
 * Record a refund
 * POST /api/refunds (Admin)
 */
const createRefund = async (req, res) => {
  try {
    const result = await refundService.createRefund(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Refund ${result.refund.refundReference} processed successfully`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * List refunds
 * GET /api/refunds (Admin, Staff)
 */
const getRefunds = async (req, res) => {
  try {
    const refunds = await refundService.getRefunds(req.query);
    return res.status(200).json({
      success: true,
      message: 'Refunds retrieved successfully',
      data: refunds
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get refund by ID
 * GET /api/refunds/:id (Admin, Staff)
 */
const getRefundById = async (req, res) => {
  try {
    const refund = await refundService.getRefundById(req.params.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Refund retrieved successfully',
      data: refund
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createRefund,
  getRefunds,
  getRefundById
};
