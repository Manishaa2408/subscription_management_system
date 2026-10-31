/**
 * Notification Adapter for Quotation Management (M6)
 * Simulates outgoing customer email deliveries and notifications
 */

export const sendQuotationEmail = async (customer, quotation) => {
  console.log(`[Notification] Quotation ${quotation.quotationNumber} dispatched to ${customer.email}`);
  return { success: true, deliveredAt: new Date() };
};

export const sendQuotationStatusNotification = async (customer, quotation, action) => {
  console.log(`[Notification] Quotation ${quotation.quotationNumber} status changed: ${action}`);
  return { success: true, notifiedAt: new Date() };
};

export default {
  sendQuotationEmail,
  sendQuotationStatusNotification
};
