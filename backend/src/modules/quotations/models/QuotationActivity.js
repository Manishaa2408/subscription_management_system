import mongoose from "mongoose";

const quotationActivitySchema = new mongoose.Schema(
  {
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "line_item_added",
        "line_item_updated",
        "line_item_removed",
        "discount_applied",
        "recalculated",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
        "conversion_requested",
        "conversion_completed",
        "conversion_failed"
      ]
    },
    description: {
      type: String,
      required: true
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

quotationActivitySchema.index({ quotationId: 1, createdAt: -1 });

export default mongoose.model("QuotationActivity", quotationActivitySchema);
