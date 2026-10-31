const mongoose = require('mongoose');

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantName: { type: String, required: true },
    variantCode: { type: String, required: true },
    sku: { type: String, required: true },
    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true }
      }
    ],
    description: { type: String },
    additionalPrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ProductVariantSchema.index({ sku: 1 }, { unique: true });
ProductVariantSchema.index({ variantCode: 1 }, { unique: true });
ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ status: 1 });

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);
