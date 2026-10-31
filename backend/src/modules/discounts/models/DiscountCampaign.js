import mongoose from "mongoose";

const discountCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true
    },
    campaignCode: {
      type: String,
      required: [true, "Campaign code is required"],
      uppercase: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
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

discountCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });

export default mongoose.model("DiscountCampaign", discountCampaignSchema);
