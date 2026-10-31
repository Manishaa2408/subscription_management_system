const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    billingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'],
      required: true
    },
    billingInterval: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    trialEnabled: { type: Boolean, default: false },
    trialPeriodDays: { type: Number, default: 0, min: 0 },
    features: [
      {
        name: { type: String, required: true },
        included: { type: Boolean, default: false }
      }
    ],
    limits: [
      {
        name: { type: String, required: true },
        value: { type: Number },
        unit: { type: String },
        isUnlimited: { type: Boolean, default: false }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes
SubscriptionPlanSchema.index({ code: 1 }, { unique: true });
SubscriptionPlanSchema.index({ productId: 1 });
SubscriptionPlanSchema.index({ status: 1 });
SubscriptionPlanSchema.index({ billingFrequency: 1 });
SubscriptionPlanSchema.index({ createdAt: 1 });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
