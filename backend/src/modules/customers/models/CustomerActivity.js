const mongoose = require('mongoose');

const customerActivitySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Activity action is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true
    },
    performedBy: {
      id: { type: String, default: null },
      name: { type: String, default: 'System' },
      role: { type: String, default: 'system' }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // Append-only audit trail
  }
);

customerActivitySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CustomerActivity = mongoose.model('CustomerActivity', customerActivitySchema);

module.exports = CustomerActivity;
