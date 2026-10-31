const mongoose = require('mongoose');

const InvoiceAuditLogSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'issued', 'cancelled', 'payment_recorded', 'status_changed']
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    performedBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'invoiceauditlogs'
  }
);

InvoiceAuditLogSchema.index({ invoiceId: 1, performedAt: -1 });

module.exports = mongoose.model('InvoiceAuditLog', InvoiceAuditLogSchema);
