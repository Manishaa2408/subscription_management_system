import mongoose from "mongoose";

const subscriptionLineItemSchema = new mongoose.Schema({
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
    billingFrequency: { type: String, default: "monthly" },
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
  currency: {
    type: String,
    default: "INR"
  },
  billingFrequency: {
    type: String,
    enum: ["one_time", "daily", "weekly", "monthly", "quarterly", "half_yearly", "yearly"],
    default: "monthly"
  },
  billingInterval: {
    type: Number,
    default: 1
  },
  discountSnapshot: {
    code: { type: String, default: null },
    type: { type: String, default: null },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
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
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      sparse: true,
      index: true
    },
    lineItems: {
      type: [subscriptionLineItemSchema],
      default: []
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    status: {
      type: String,
      enum: ["pending", "trial", "active", "paused", "past_due", "cancelled", "expired"],
      default: "pending",
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    trialEnabled: {
      type: Boolean,
      default: false
    },
    trialStartDate: {
      type: Date,
      default: null
    },
    trialEndDate: {
      type: Date,
      default: null
    },
    currentPeriodStart: {
      type: Date,
      default: null
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    },
    nextBillingDate: {
      type: Date,
      default: null,
      index: true
    },
    lastRenewalDate: {
      type: Date,
      default: null
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    cancellation: {
      requested: { type: Boolean, default: false },
      type: { type: String, enum: ["immediate", "end_of_period", null], default: null },
      reason: { type: String, default: "" },
      requestedAt: { type: Date, default: null },
      effectiveDate: { type: Date, default: null }
    },
    pause: {
      pausedAt: { type: Date, default: null },
      reason: { type: String, default: "" },
      expectedResumeDate: { type: Date, default: null }
    },
    billingIntegration: {
      status: {
        type: String,
        enum: ["registered", "paused", "cancelled", "pending", "failed"],
        default: "pending"
      },
      externalScheduleId: { type: String, default: null },
      lastSyncAt: { type: Date, default: null },
      lastError: { type: String, default: null }
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

// Indexes
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

export default mongoose.model("Subscription", subscriptionSchema);
