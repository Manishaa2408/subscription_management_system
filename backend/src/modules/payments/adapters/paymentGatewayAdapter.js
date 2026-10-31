/**
 * M11 Payment Gateway Simulation Adapter
 * 
 * Provides mock payment gateway operations (UPI, Cards, NetBanking, Razorpay-style webhook simulation).
 * NEVER collects or stores card PINs, CVVs, UPI PINs, or banking passwords.
 */

const crypto = require('crypto');

const initiatePayment = async ({ amount, currency = 'INR', invoiceId, customerId }) => {
  const gatewayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    success: true,
    gatewayOrderId,
    amount,
    currency,
    status: 'created',
    checkoutUrl: `https://checkout.brightloop.io/pay/${gatewayOrderId}`
  };
};

const verifyPayment = async (gatewayReference) => {
  if (!gatewayReference) {
    return { verified: false, error: 'Missing gateway reference' };
  }

  // Simulated gateway verification
  return {
    verified: true,
    status: 'captured',
    gatewayPaymentId: `pay_${Date.now()}`,
    verifiedAt: new Date()
  };
};

const handleWebhook = (payload, signature) => {
  // In development, validates structure
  if (!payload || !payload.event) {
    throw new Error('Invalid webhook payload format');
  }

  return {
    event: payload.event,
    paymentId: payload.paymentId,
    amount: payload.amount,
    status: payload.status || 'captured'
  };
};

const processRefund = async ({ paymentReference, amount, reason }) => {
  const refundId = `rfnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    success: true,
    refundId,
    amount,
    reason: reason || 'Customer requested refund',
    status: 'processed',
    processedAt: new Date()
  };
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  processRefund
};
