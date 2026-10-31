import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Discount name is required"],
      trim: true
    },
    code: {
      type: String,
      required: [true, "Discount code is required"],
      uppercase: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountCampaign",
      default: null,
      index: true
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type must be percentage or fixed"]
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"]
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    maximumDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cap cannot be negative"]
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase cannot be negative"]
    },
    applicability: {
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        }
      ],
      variants: [
        {
          type: mongoose.Schema.Types.ObjectId
        }
      ],
      plans: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubscriptionPlan"
        }
      ],
      customerIds: [
        {
          type: mongoose.Schema.Types.ObjectId
        }
      ],
      customerType: {
        type: String,
        enum: ["all", "new", "existing"],
        default: "all"
      }
    },
    usageLimits: {
      maximumTotalUsage: {
        type: Number,
        default: null
      },
      maximumPerCustomer: {
        type: Number,
        default: null
      }
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    applicationType: {
      type: String,
      enum: ["one_time", "recurring", "unlimited_recurring"],
      default: "one_time"
    },
    billingCycles: {
      type: Number,
      default: 1,
      min: 1
    },
    stacking: {
      isStackable: {
        type: Boolean,
        default: false
      },
      priority: {
        type: Number,
        default: 0
      }
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "archived"],
      default: "active",
      index: true
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
  {
    timestamps: true
  }
);

discountSchema.index({ status: 1, discountType: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Discount", discountSchema);
