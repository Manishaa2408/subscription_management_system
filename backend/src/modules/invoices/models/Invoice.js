const mongoose = require('mongoose');

const InvoiceLineItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Line item name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    productId: {
      type: String,
      trim: true,
      default: null
    },
    variantId: {
      type: String,
      trim: true,
      default: null
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    grossAmount: {
      type: Number,
      required: true,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative']
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Taxable amount cannot be negative']
    },
    taxCode: {
      type: String,
      required: true,
      default: 'GST18',
      uppercase: true
    },
    taxRate: {
      type: Number,
      required: true,
      default: 18,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    gstType: {
      type: String,
      enum: ['INTRA_STATE', 'INTER_STATE', 'ZERO_TAX', 'EXEMPT'],
      default: 'INTRA_STATE'
    },
    cgstRate: {
      type: Number,
      default: 0
    },
    cgstAmount: {
      type: Number,
      default: 0
    },
    sgstRate: {
      type: Number,
      default: 0
    },
    sgstAmount: {
      type: Number,
      default: 0
    },
    igstRate: {
      type: Number,
      default: 0
    },
    igstAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: true }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '', uppercase: true },
      state: { type: String, required: true, default: 'Kerala' },
      billingAddress: {
        line1: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'India' }
      }
    },
    supplierSnapshot: {
      name: { type: String, default: 'Brightloop Software' },
      gstin: { type: String, default: '32AABCB1234D1Z8' },
      state: { type: String, default: 'Kerala' },
      email: { type: String, default: 'billing@brightloop.io' },
      phone: { type: String, default: '+91 484 290 8800' },
      address: {
        type: String,
        default: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      }
    },
    subscriptionId: {
      type: String,
      default: null,
      index: true
    },
    sourceReference: {
      type: String,
      default: null,
      sparse: true,
      index: true
    },
    billingPeriod: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null }
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    items: {
      type: [InvoiceLineItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Invoice must contain at least one line item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    discountTotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0
    },
    taxBreakdown: {
      cgstTotal: { type: Number, default: 0 },
      sgstTotal: { type: Number, default: 0 },
      igstTotal: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      ratesSummary: [
        {
          taxCode: String,
          rate: Number,
          taxableAmount: Number,
          taxAmount: Number,
          cgst: Number,
          sgst: Number,
          igst: Number
        }
      ]
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    outstandingAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    issuedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    },
    updatedBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    }
  },
  {
    timestamps: true,
    collection: 'invoices'
  }
);

// Compound and lookup indexes
InvoiceSchema.index({ customerId: 1, status: 1 });
InvoiceSchema.index({ issueDate: -1 });
InvoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
