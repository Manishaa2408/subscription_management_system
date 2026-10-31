import mongoose from "mongoose";

const subscriptionActivitySchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "activated",
        "trial_started",
        "trial_ended",
        "renewed",
        "plan_upgraded",
        "plan_downgraded",
        "paused",
        "resumed",
        "cancellation_requested",
        "cancelled",
        "expired",
        "billing_schedule_updated",
        "billing_sync_failed",
        "billing_sync_retried",
        "updated"
      ]
    },
    description: {
      type: String,
      required: true
    },
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    performedByRole: {
      type: String,
      enum: ["admin", "staff", "customer", "system"],
      default: "system"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriptionActivitySchema.index({ subscriptionId: 1, createdAt: -1 });

export default mongoose.model("SubscriptionActivity", subscriptionActivitySchema);
