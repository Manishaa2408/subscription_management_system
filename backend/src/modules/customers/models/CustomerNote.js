const mongoose = require('mongoose');

const customerNoteSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true
    },
    note: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true,
      maxlength: [2000, 'Note text cannot exceed 2000 characters']
    },
    visibility: {
      type: String,
      enum: ['internal', 'public'],
      default: 'internal',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    authorName: {
      type: String,
      default: 'Staff Member'
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

customerNoteSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CustomerNote = mongoose.model('CustomerNote', customerNoteSchema);

module.exports = CustomerNote;
