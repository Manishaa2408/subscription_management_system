const PaymentSequence = require('../models/PaymentSequence');

/**
 * Atomically generates next sequential reference
 * @param {'PAY' | 'REC' | 'REF'} prefix
 * @param {number} year
 * @returns {Promise<string>} e.g. 'PAY-2026-0001'
 */
const generateSequenceReference = async (prefix, year = new Date().getFullYear()) => {
  const cleanPrefix = prefix.toUpperCase().trim();
  const cleanYear = Number(year) || new Date().getFullYear();

  const seqDoc = await PaymentSequence.findOneAndUpdate(
    { prefix: cleanPrefix, year: cleanYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const padded = String(seqDoc.sequence).padStart(4, '0');
  return `${cleanPrefix}-${cleanYear}-${padded}`;
};

const generatePaymentReference = (year) => generateSequenceReference('PAY', year);
const generateReceiptReference = (year) => generateSequenceReference('REC', year);
const generateRefundReference = (year) => generateSequenceReference('REF', year);

module.exports = {
  generateSequenceReference,
  generatePaymentReference,
  generateReceiptReference,
  generateRefundReference
};
