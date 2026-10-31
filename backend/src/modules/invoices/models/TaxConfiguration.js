const mongoose = require('mongoose');

const TaxConfigurationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax configuration name is required'],
      trim: true,
      maxlength: [100, 'Tax name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Tax code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      match: [/^[A-Z0-9_-]+$/, 'Tax code can only contain alphanumeric characters, underscores, and dashes']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
      default: ''
    },
    rate: {
      type: Number,
      required: [true, 'Tax percentage rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    taxType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    applicability: {
      type: String,
      enum: ['all', 'services', 'goods'],
      default: 'all'
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: String,
      default: 'system'
    },
    updatedBy: {
      type: String,
      default: 'system'
    }
  },
  {
    timestamps: true,
    collection: 'taxconfigurations'
  }
);

TaxConfigurationSchema.index({ isActive: 1, effectiveFrom: 1, effectiveTo: 1 });

module.exports = mongoose.model('TaxConfiguration', TaxConfigurationSchema);
