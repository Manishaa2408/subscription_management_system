const mongoose = require('mongoose');

const PaymentSequenceSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: true,
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
    collection: 'paymentsequences'
  }
);

PaymentSequenceSchema.index({ prefix: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PaymentSequence', PaymentSequenceSchema);
