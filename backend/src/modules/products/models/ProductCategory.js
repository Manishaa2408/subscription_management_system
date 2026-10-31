const mongoose = require('mongoose');

const ProductCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    imageUrl: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
ProductCategorySchema.index({ code: 1 }, { unique: true });
ProductCategorySchema.index({ name: 1 });
ProductCategorySchema.index({ status: 1 });
ProductCategorySchema.index({ parentCategoryId: 1 });

module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
