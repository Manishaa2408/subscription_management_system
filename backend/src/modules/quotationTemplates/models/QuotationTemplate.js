import mongoose from "mongoose";

const templateItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ["product", "plan"],
    required: [true, "Item type is required"]
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Item ID is required"]
  },
  variantId: {
    type: String,
    default: null
  },
  itemName: {
    type: String,
    required: [true, "Item name is required"],
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.01, "Quantity must be at least 0.01"]
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"]
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, "Tax rate cannot be negative"],
    max: [100, "Tax rate cannot exceed 100%"]
  },
  lineSubtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  lineTotal: {
    type: Number,
    required: true
  }
});

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      maxlength: [200, "Template name cannot exceed 200 characters"]
    },
    code: {
      type: String,
      required: [true, "Template code is required"],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    validityDays: {
      type: Number,
      required: [true, "Validity period is required"],
      min: [1, "Validity must be at least 1 day"]
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    items: {
      type: [templateItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one line item is required"
      }
    },
    subtotal: {
      type: Number,
      default: 0
    },
    taxTotal: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: "",
      maxlength: [2000, "Notes cannot exceed 2000 characters"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes
quotationTemplateSchema.index({ name: 1 });
quotationTemplateSchema.index({ status: 1 });
quotationTemplateSchema.index({ createdAt: -1 });
quotationTemplateSchema.index({ isDeleted: 1, status: 1 });

export default mongoose.model("QuotationTemplate", quotationTemplateSchema);
