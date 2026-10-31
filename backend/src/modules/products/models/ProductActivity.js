const mongoose = require('mongoose');

const ProductActivitySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    action: { type: String, required: true },
    description: { type: String },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ProductActivity', ProductActivitySchema);
