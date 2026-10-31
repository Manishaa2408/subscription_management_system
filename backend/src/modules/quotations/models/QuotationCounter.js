import mongoose from "mongoose";

const quotationCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    default: 0
  }
});

export default mongoose.model("QuotationCounter", quotationCounterSchema);
