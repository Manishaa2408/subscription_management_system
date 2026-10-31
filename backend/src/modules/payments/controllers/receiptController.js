const { getReceiptById } = require('../services/receiptService');

/**
 * Get receipt details
 * GET /api/receipts/:id (Admin, Staff, Owner Customer)
 */
const getReceipt = async (req, res) => {
  try {
    const receipt = await getReceiptById(req.params.id, req.user);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Payment receipt not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Receipt retrieved successfully',
      data: receipt
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Printable receipt data
 * GET /api/receipts/:id/print
 */
const getReceiptPrint = async (req, res) => {
  try {
    const receipt = await getReceiptById(req.params.id, req.user);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Printable receipt data retrieved',
      data: {
        receipt,
        printedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = {
  getReceipt,
  getReceiptPrint
};
