const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productCode: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true },
    shortDescription: { type: String },
    description: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    productType: { type: String, enum: ['software', 'service', 'digital', 'physical'], default: 'software' },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    imageUrl: { type: String },
    images: [{ type: String }],
    tags: [{ type: String }],
    features: [{ type: String }],
    specifications: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ProductSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Product', ProductSchema);
