const mongoose = require('mongoose');

const billingSequenceSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    currentSequence: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

billingSequenceSchema.index({ prefix: 1, year: 1 }, { unique: true });

billingSequenceSchema.statics.getNextSequence = async function (prefix, year = new Date().getFullYear()) {
  const record = await this.findOneAndUpdate(
    { prefix, year },
    { $inc: { currentSequence: 1 } },
    { new: true, upsert: true }
  );
  return record.currentSequence;
};

module.exports = mongoose.model('BillingSequence', billingSequenceSchema);
