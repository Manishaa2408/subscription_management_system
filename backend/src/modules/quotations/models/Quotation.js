import mongoose from "mongoose";

const quotationLineItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  variantId: {
    type: String,
    default: null
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  productSnapshot: {
    name: { type: String, default: "" },
    code: { type: String, default: "" }
  },
  variantSnapshot: {
    variantId: { type: String, default: null },
    name: { type: String, default: "" },
    additionalPrice: { type: Number, default: 0 }
  },
  planSnapshot: {
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    billingFrequency: { type: String, default: "" }, // daily, weekly, monthly, yearly
    billingInterval: { type: Number, default: 1 }
  },
  description: {
    type: String,
    default: ""
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, "Quantity must be greater than zero"]
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, "Unit price cannot be negative"]
  },
  billingFrequency: {
    type: String,
    enum: ["one_time", "daily", "weekly", "monthly", "yearly"],
    default: "monthly"
  },
  billingInterval: {
    type: Number,
    default: 1
  },
  discount: {
    code: { type: String, default: null },
    type: { type: String, enum: ["percentage", "fixed", null], default: null },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  taxBreakdown: [
    {
      name: { type: String, default: "GST" },
      rate: { type: Number, default: 18 },
      amount: { type: Number, default: 0 }
    }
  ],
  lineSubtotal: {
    type: Number,
    required: true
  },
  lineTotal: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Customer ID is required"],
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      companyName: { type: String, default: "" },
      billingAddress: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        country: { type: String, default: "India" }
      }
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    quotationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    lineItems: {
      type: [quotationLineItemSchema],
      default: []
    },
    subtotal: {
      type: Number,
      default: 0
    },
    discountDetails: {
      code: { type: String, default: null },
      type: { type: String, enum: ["percentage", "fixed", null], default: null },
      value: { type: Number, default: 0 },
      description: { type: String, default: "" }
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxableAmount: {
      type: Number,
      default: 0
    },
    taxBreakdown: [
      {
        name: { type: String, default: "GST" },
        rate: { type: Number, default: 18 },
        amount: { type: Number, default: 0 }
      }
    ],
    totalTax: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      default: 0
    },
    internalNotes: {
      type: String,
      default: ""
    },
    customerNotes: {
      type: String,
      default: ""
    },
    termsAndConditions: {
      type: String,
      default: "1. Quotation valid until specified expiry date.\n2. Prices subject to applicable standard GST taxes.\n3. Upon acceptance, recurring billing commences as configured."
    },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired", "cancelled"],
      default: "draft",
      index: true
    },
    sentAt: {
      type: Date,
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    expiredAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    cancellationReason: {
      type: String,
      default: ""
    },
    subscriptionConversion: {
      status: {
        type: String,
        enum: ["none", "pending", "converted", "failed"],
        default: "none"
      },
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      requestedAt: {
        type: Date,
        default: null
      },
      convertedAt: {
        type: Date,
        default: null
      },
      errorMessage: {
        type: String,
        default: null
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes for fast lookup, pagination, and status filters
quotationSchema.index({ customerId: 1, status: 1 });
quotationSchema.index({ status: 1, validUntil: 1 });
quotationSchema.index({ quotationDate: -1 });
quotationSchema.index({ "subscriptionConversion.status": 1 });

export default mongoose.model("Quotation", quotationSchema);
