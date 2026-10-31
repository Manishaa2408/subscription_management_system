// backend/src/modules/products/services/productActivityService.js
const ProductActivity = require('../models/ProductActivity');

/** Log an activity entry */
const logActivity = async ({ productId = null, variantId = null, action, description = '', performedBy = null, previousValue = null, newValue = null }) => {
  const entry = new ProductActivity({
    productId,
    variantId,
    action,
    description,
    performedBy,
    previousValue,
    newValue
  });
  await entry.save();
  return entry;
};

module.exports = { logActivity };
