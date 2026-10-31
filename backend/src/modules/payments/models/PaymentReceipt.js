const mongoose = require('mongoose');

const PaymentReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true
    },
    paymentReference: {
      type: String,
      required: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String,
      required: true
    },
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    invoiceReference: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    transactionReference: {
      type: String,
      default: ''
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    companySnapshot: {
      name: { type: String, default: 'Brightloop Software' },
      gstin: { type: String, default: '32AABCB1234D1Z8' },
      address: { type: String, default: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042' },
      email: { type: String, default: 'billing@brightloop.io' },
      phone: { type: String, default: '+91 484 290 8800' }
    }
  },
  {
    timestamps: true,
    collection: 'paymentreceipts'
  }
);

PaymentReceiptSchema.index({ customerId: 1, issuedAt: -1 });

module.exports = mongoose.model('PaymentReceipt', PaymentReceiptSchema);
