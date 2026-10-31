import mongoose from "mongoose";

const subscriptionRenewalSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    nextBillingDate: {
      type: Date,
      required: true
    },
    renewalNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active"
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriptionRenewalSchema.index({ subscriptionId: 1, renewalNumber: -1 });

export default mongoose.model("SubscriptionRenewal", subscriptionRenewalSchema);
