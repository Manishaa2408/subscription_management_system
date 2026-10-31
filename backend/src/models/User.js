const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'staff', 'customer'],
        message: 'Role must be admin, staff, or customer'
      },
      default: 'customer'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password with bcryptjs if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON serialization (strip password and reset tokens)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
