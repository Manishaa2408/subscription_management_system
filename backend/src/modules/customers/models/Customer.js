const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    addressType: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'billing'
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true, timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    customerCode: {
      type: String,
      required: [true, 'Customer code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    customerType: {
      type: String,
      enum: {
        values: ['individual', 'business'],
        message: "Customer type must be either 'individual' or 'business'"
      },
      default: 'individual',
      index: true
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: ''
    },
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
      default: ''
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    businessType: {
      type: String,
      trim: true,
      default: ''
    },
    industry: {
      type: String,
      trim: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    billingAddress: {
      type: addressSchema,
      default: null
    },
    shippingAddress: {
      type: addressSchema,
      default: null
    },
    addresses: [addressSchema],
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended'],
        message: "Status must be 'active', 'inactive', or 'suspended'"
      },
      default: 'active',
      index: true
    },
    customerSince: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto-derive displayName if empty
customerSchema.pre('validate', function (next) {
  if (!this.displayName) {
    if (this.customerType === 'business' && this.companyName) {
      this.displayName = this.companyName;
    } else if (this.firstName || this.lastName) {
      this.displayName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
    } else {
      this.displayName = this.email;
    }
  }
  next();
});

// JSON formatting
customerSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
