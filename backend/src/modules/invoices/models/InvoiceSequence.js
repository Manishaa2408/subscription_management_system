const mongoose = require('mongoose');

const InvoiceSequenceSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: true,
      default: 'INV',
      trim: true,
      uppercase: true
    },
    year: {
      type: Number,
      required: true
    },
    sequence: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'invoicesequences'
  }
);

InvoiceSequenceSchema.index({ prefix: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('InvoiceSequence', InvoiceSequenceSchema);
