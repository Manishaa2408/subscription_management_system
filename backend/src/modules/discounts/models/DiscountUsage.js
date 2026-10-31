import mongoose from "mongoose";

const discountUsageSchema = new mongoose.Schema(
  {
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    contextType: {
      type: String,
      enum: ["quotation", "subscription", "billing", "manual"],
      required: true
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    status: {
      type: String,
      enum: ["reserved", "redeemed", "released", "expired"],
      default: "reserved",
      index: true
    },
    reservedAt: {
      type: Date,
      default: Date.now
    },
    redeemedAt: {
      type: Date,
      default: null
    },
    releasedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    releaseReason: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

discountUsageSchema.index({ discountId: 1, customerId: 1, status: 1 });

export default mongoose.model("DiscountUsage", discountUsageSchema);
