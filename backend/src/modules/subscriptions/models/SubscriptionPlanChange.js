import mongoose from "mongoose";

const subscriptionPlanChangeSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true
    },
    previousPlanSnapshot: {
      planId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      billingFrequency: { type: String, default: "monthly" },
      billingInterval: { type: Number, default: 1 }
    },
    newPlanSnapshot: {
      planId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      billingFrequency: { type: String, default: "monthly" },
      billingInterval: { type: Number, default: 1 }
    },
    changeType: {
      type: String,
      enum: ["upgrade", "downgrade"],
      required: true
    },
    effectiveDate: {
      type: Date,
      required: true
    },
    priceDifference: {
      type: Number,
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    requestedByRole: {
      type: String,
      enum: ["admin", "staff", "customer", "system"],
      default: "staff"
    },
    changeStatus: {
      type: String,
      enum: ["applied", "pending", "cancelled"],
      default: "applied"
    },
    reason: {
      type: String,
      default: ""
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriptionPlanChangeSchema.index({ subscriptionId: 1, createdAt: -1 });

export default mongoose.model("SubscriptionPlanChange", subscriptionPlanChangeSchema);
