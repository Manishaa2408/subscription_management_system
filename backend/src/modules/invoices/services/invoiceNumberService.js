const InvoiceSequence = require('../models/InvoiceSequence');

/**
 * Generates an atomic, unique sequential invoice number
 * Format: INV-YYYY-0001
 * @param {string} prefix Default 'INV'
 * @param {number} year Default current full year
 * @returns {Promise<string>} e.g. 'INV-2026-0001'
 */
const generateInvoiceNumber = async (prefix = 'INV', year = new Date().getFullYear()) => {
  const cleanPrefix = (prefix || 'INV').toUpperCase().trim();
  const cleanYear = Number(year) || new Date().getFullYear();

  // Atomically increment the sequence counter
  const sequenceDoc = await InvoiceSequence.findOneAndUpdate(
    { prefix: cleanPrefix, year: cleanYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSequence = String(sequenceDoc.sequence).padStart(4, '0');
  return `${cleanPrefix}-${cleanYear}-${paddedSequence}`;
};

/**
 * Inspects current sequence without incrementing
 */
const getCurrentSequence = async (prefix = 'INV', year = new Date().getFullYear()) => {
  const doc = await InvoiceSequence.findOne({ prefix: prefix.toUpperCase(), year });
  return doc ? doc.sequence : 0;
};

module.exports = {
  generateInvoiceNumber,
  getCurrentSequence
};
